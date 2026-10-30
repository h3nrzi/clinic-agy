import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';

describe('WP-02: Representative Flow (FLOW-02, SCREEN-02, SCREEN-03, SCREEN-04)', () => {
  beforeEach(() => {
    // Reset DB and stores to clean state before each test
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
    useBookingStore.getState().resetBooking();
  });

  it('completes the full booking cycle (FLOW-02 / AC-01 / AC-02) from wizard to Shaparak gateway and confirmation', async () => {
    const startTime = Date.now();
    render(<App />);

    // 1. Initial State: Click "رزرو نوبت جدید آنلاین"
    const newBookingTab = screen.getByRole('button', { name: /رزرو نوبت جدید آنلاین/ });
    fireEvent.click(newBookingTab);

    // Verify Wizard Header and Step 1
    expect(screen.getByRole('navigation', { name: 'مراحل رزرو نوبت' })).toBeDefined();
    expect(screen.getByText('۱. انتخاب شعبه یا نوع ویزیت')).toBeDefined();

    // 2. Step 1: Select Online Visit and first service
    const onlineBranchBtn = screen.getByText('سامانه ویزیت آنلاین و تله‌مدیسین آژی');
    fireEvent.click(onlineBranchBtn);

    const step1NextBtn = screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک و تقویم/ });
    fireEvent.click(step1NextBtn);

    // 3. Step 2: Doctor and Slot Selection
    expect(screen.getByText('۱. انتخاب پزشک معالج')).toBeDefined();
    expect(screen.getByText('۲. انتخاب زمان ویزیت')).toBeDefined();

    // Select Dr. Maryam Ahmadi
    const doctorBtn = screen.getAllByText('دکتر مریم احمدی')[0];
    fireEvent.click(doctorBtn);

    // Select a time slot
    const slotButtons = screen.getAllByRole('button', { name: /ساعت/ });
    expect(slotButtons.length).toBeGreaterThan(0);
    fireEvent.click(slotButtons[0]);

    const step2NextBtn = screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه و مدارک/ });
    fireEvent.click(step2NextBtn);

    // 4. Step 3: Insurance and Documents
    expect(screen.getByText(/۱\. وضعیت پوشش بیمهٔ پایه و تکمیلی/)).toBeDefined();
    expect(screen.getByText(/ریز محاسبات مالی پلکانی/)).toBeDefined();

    // Verify default tiered calculation (Service: 280,000, Tamin: 30%, Dana: 70% of remaining up to 200,000)
    // Base: 280,000 * 0.30 = 84,000
    // Remainder: 280,000 - 84,000 = 196,000
    // Supp: 196,000 * 0.70 = 137,200 (< 200,000 cap)
    // Patient Payable: 196,000 - 137,200 = 58,800 Toman
    expect(screen.getByText(/۵۸,۸۰۰ تومان/)).toBeDefined();

    // Test Medical Document Upload
    const file = new File(['mock-ultrasound-data'], 'ultrasound.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();

    fireEvent.change(fileInput, { target: { files: [file] } });

    const step3NextBtn = screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ });
    fireEvent.click(step3NextBtn);

    // 5. Step 4: Summary Pre-invoice (SCREEN-03)
    expect(screen.getByText('پیش‌فاکتور شفاف و خلاصه نوبت')).toBeDefined();
    expect(screen.getByText('ریز صورت‌حساب مالی (پیش‌فاکتور شفاف)')).toBeDefined();
    expect(screen.getAllByText('دکتر مریم احمدی').length).toBeGreaterThanOrEqual(1);

    // Proceed to Gateway
    const proceedToGatewayBtn = screen.getByRole('button', { name: /انتقال به درگاه پرداخت شاپرک/ });
    fireEvent.click(proceedToGatewayBtn);

    // 6. Payment Gateway Simulator (INT-03)
    expect(screen.getByText('شبیه‌ساز درگاه شاپرک')).toBeDefined();
    expect(screen.getByText('کلینیک سلامت زنجیره‌ای آژی')).toBeDefined();
    expect(screen.getByText('TRM-8894102')).toBeDefined();

    // Test simulate failure first
    const failBtn = screen.getByRole('button', { name: /تراکنش ناموفق \(موجودی ناکافی\)/ });
    fireEvent.click(failBtn);
    expect(screen.getByText(/خطای درگاه بانکی \(کد ۵۱\)/)).toBeDefined();

    // No appointment should be created yet
    const initialAppsCount = appointmentRepository.getAll({ patientId: 'pat-1' }).length;

    // Test simulate success
    const successBtn = screen.getByRole('button', { name: /پرداخت موفق \(تایید قطعی نوبت\)/ });
    fireEvent.click(successBtn);

    // 7. Payment Confirmation Screen (FLOW-02 Step 9)
    expect(screen.getByText(/وضعیت نوبت: قطعی‌شده \(CONFIRMED\)/)).toBeDefined();
    expect(screen.getByText(/پرداخت با موفقیت انجام شد و نوبت شما ثبت گردید/)).toBeDefined();
    expect(screen.getByText(/پیامک تایید به شماره همراه ارسال شد/)).toBeDefined();

    // Check newly confirmed appointment in repository
    const finalApps = appointmentRepository.getAll({ patientId: 'pat-1' });
    expect(finalApps.length).toBe(initialAppsCount + 1);

    const newApp = finalApps[finalApps.length - 1];
    expect(newApp.status).toBe('CONFIRMED');
    expect(newApp.branchId).toBe('ONLINE');
    expect(newApp.doctorName).toBe('دکتر مریم احمدی');
    expect(newApp.trackingCode).toMatch(/^AGY-\d+$/);

    // 8. Return to Patient Dashboard
    const viewAppointmentsBtn = screen.getByRole('button', { name: /مشاهده در نوبت‌های من/ });
    fireEvent.click(viewAppointmentsBtn);

    // Verify new appointment is shown in patient list
    expect(screen.getByText(newApp.trackingCode)).toBeDefined();

    // Validate execution time < 180 seconds benchmark (AC-02)
    const durationSeconds = (Date.now() - startTime) / 1000;
    expect(durationSeconds).toBeLessThan(180);
  });

  it('correctly applies existing wallet credit to reduce payable amount in Step 3 & 4', () => {
    // Give patient credit in wallet
    walletRepository.adjustBalance('pat-1', 40000, 'شارژ تستی بستانکاری');
    const walletBefore = walletRepository.getByPatientId('pat-1');
    expect(walletBefore?.balance).toBe(40000);

    render(<App />);

    // Go to booking
    const newBookingTab = screen.getByRole('button', { name: /رزرو نوبت جدید آنلاین/ });
    fireEvent.click(newBookingTab);

    // Step 1 -> Next
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک و تقویم/ }));

    // Step 2 -> Pick first slot -> Next
    const slotBtns = screen.getAllByRole('button', { name: /ساعت/ });
    fireEvent.click(slotBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه و مدارک/ }));

    // Step 3: Verify wallet deduction notice
    // Original payable was 58,800. With 40,000 credit deducted, final should be 18,800 Toman
    expect(screen.getByText(/کسر از بستانکاری کیف پول بیمار/)).toBeDefined();
    expect(screen.getByText(/۱۸,۸۰۰ تومان/)).toBeDefined();

    // Proceed to Step 4
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ }));
    expect(screen.getByText(/کسر خودکار از بستانکاری کیف پول/)).toBeDefined();

    // Proceed to Gateway
    fireEvent.click(screen.getByRole('button', { name: /انتقال به درگاه پرداخت شاپرک/ }));

    // Complete payment
    fireEvent.click(screen.getByRole('button', { name: /پرداخت موفق/ }));

    // Check wallet balance was deducted
    const walletAfter = walletRepository.getByPatientId('pat-1');
    expect(walletAfter?.balance).toBe(0);
  });

  it('allows canceling payment in gateway and returning to Step 4 without creating an appointment', () => {
    render(<App />);

    // Go to booking
    fireEvent.click(screen.getByRole('button', { name: /رزرو نوبت جدید آنلاین/ }));
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک و تقویم/ }));
    const slotBtns = screen.getAllByRole('button', { name: /ساعت/ });
    fireEvent.click(slotBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه و مدارک/ }));
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ }));
    fireEvent.click(screen.getByRole('button', { name: /انتقال به درگاه پرداخت شاپرک/ }));

    expect(screen.getByText('شبیه‌ساز درگاه شاپرک')).toBeDefined();

    const initialAppsCount = appointmentRepository.getAll({ patientId: 'pat-1' }).length;

    // Click Cancel in Gateway
    const cancelBtn = screen.getByRole('button', { name: /انصراف و بازگشت/ });
    fireEvent.click(cancelBtn);

    // Should return to Step 4
    expect(screen.getByText('پیش‌فاکتور شفاف و خلاصه نوبت')).toBeDefined();

    // Appointment count should remain unchanged
    const finalAppsCount = appointmentRepository.getAll({ patientId: 'pat-1' }).length;
    expect(finalAppsCount).toBe(initialAppsCount);
  });
});
