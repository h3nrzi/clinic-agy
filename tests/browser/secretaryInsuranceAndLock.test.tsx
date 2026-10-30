import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '@/App';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';

describe('WP-03: Secretary Desk, Insurance Correction & Soft Lock (FLOW-03, SCREEN-05, AC-03, AC-04, AC-05)', () => {
  beforeEach(() => {
    // Factory reset before each test
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
    useBookingStore.getState().resetBooking();
  });

  it('executes full FLOW-03 cycle: manual insurance correction produces debit, activates soft lock, and emergency unlock resolves it (AC-03 & AC-04)', async () => {
    render(<App />);

    // 1. Switch to Secretary Tehran role using Demo Toolbar
    const secretaryTehranBtn = screen.getByRole('button', { name: /منشی تهران/ });
    fireEvent.click(secretaryTehranBtn);

    // Verify Secretary Dashboard (SCREEN-05) renders
    expect(screen.getByText(/میز کار پذیرش شعبه مرکزی تهران/)).toBeDefined();
    expect(screen.getByText('AGY-10142')).toBeDefined(); // App-1 (Ali Rezaei, Online)

    // 2. Open Insurance Edit Modal for AGY-10142
    // Row buttons: find the edit insurance button
    const editInsuranceBtns = screen.getAllByTitle('اصلاح سهم بیمه');
    expect(editInsuranceBtns.length).toBeGreaterThan(0);
    fireEvent.click(editInsuranceBtns[0]);

    // Verify Insurance Edit Modal is open
    expect(screen.getByText(/اصلاح دستی سهم بیمه — پنجره فریز روزانه/)).toBeDefined();
    expect(screen.getByText(/نوبت: AGY-10142/)).toBeDefined();

    // 3. Apply AC-03 scenario: Zero out supplementary insurance coverage (revoking Dana insurance)
    const revokeSuppBtn = screen.getByRole('button', {
      name: /ابطال بیمه تکمیلی \(سهم ۰ — سناریوی AC-03\)/,
    });
    fireEvent.click(revokeSuppBtn);

    // Free price: 280,000 | Base coverage: 84,000 | Supp coverage: 0
    // Revised patient due = 280,000 - 84,000 = 196,000 Toman
    // Initial paid = 58,800 Toman
    // Delta = 58,800 - 196,000 = -137,200 Toman (Debit)
    expect(screen.getByText(/بدهکار به کلینیک/)).toBeDefined();
    expect(screen.getByText(/هشدار قفل نرم \(AC-03\)/)).toBeDefined();

    // 4. Save and apply insurance correction
    const saveCorrectionBtn = screen.getByRole('button', { name: /ذخیره و اعمال اصلاحیه/ });
    fireEvent.click(saveCorrectionBtn);

    // Wait for modal to close and state to persist
    await waitFor(() => {
      expect(screen.queryByText(/اصلاح دستی سهم بیمه — پنجره فریز روزانه/)).toBeNull();
    });

    // 5. Verify Appointment in Secretary table now has DEBIT and Soft Lock
    const updatedApp = appointmentRepository.getById('app-1');
    expect(updatedApp?.financialStatus).toBe('DEBIT');
    expect(updatedApp?.debtOrCreditBalance).toBe(-137200);
    expect(updatedApp?.isSoftLocked).toBe(true);

    // Verify patient wallet was adjusted with the debit
    const patientWallet = walletRepository.getByPatientId('pat-1');
    expect(patientWallet?.balance).toBe(-137200);

    // 6. Switch back to Patient role using Demo Toolbar
    const patientBtn = screen.getByRole('button', { name: 'بیمار' });
    fireEvent.click(patientBtn);

    // In Patient Workspace: Verify Soft Lock is enforced (AC-03)
    expect(screen.getByText(/قفل نرم فعال است: به دلیل مابه‌التفاوت بدهی/)).toBeDefined();

    const disabledEnterBtn = screen.getByRole('button', { name: /ورود مسدود \(قفل بدهی\)/ });
    expect(disabledEnterBtn).toBeDefined();
    expect((disabledEnterBtn as HTMLButtonElement).disabled).toBe(true);

    // Also verify "پرداخت مابه‌التفاوت و رفع قفل" button is offered to the patient
    expect(screen.getByRole('button', { name: /پرداخت مابه‌التفاوت و رفع قفل/ })).toBeDefined();

    // 7. Switch back to Secretary role to perform Emergency Unlock (AC-04)
    fireEvent.click(screen.getByRole('button', { name: /منشی تهران/ }));

    // Verify Emergency Unlock button is available in the table
    const emergencyUnlockBtns = screen.getAllByRole('button', { name: /بازگشایی اضطراری/ });
    expect(emergencyUnlockBtns.length).toBeGreaterThan(0);
    fireEvent.click(emergencyUnlockBtns[0]);

    // Verify Emergency Unlock Dialog opens
    expect(screen.getByText(/بازگشایی اضطراری قفل ورود به جلسه \(AC-04\)/)).toBeDefined();
    expect(screen.getByText(/قاعدهٔ حاکمیتی:/)).toBeDefined();

    // Submit emergency unlock
    const confirmUnlockBtn = screen.getByRole('button', { name: /تایید و بازگشایی اضطراری/ });
    fireEvent.click(confirmUnlockBtn);

    await waitFor(() => {
      expect(screen.queryByText(/بازگشایی اضطراری قفل ورود به جلسه \(AC-04\)/)).toBeNull();
    });

    // Verify repository state: soft lock is lifted, emergencyUnlocked is true
    const unlockedApp = appointmentRepository.getById('app-1');
    expect(unlockedApp?.isSoftLocked).toBe(false);
    expect(unlockedApp?.emergencyUnlocked).toBe(true);
    expect(unlockedApp?.emergencyUnlockReason).toContain('هماهنگی تلفنی');

    // 8. Switch back to Patient: verify Enter Visit Room button is immediately unlocked
    fireEvent.click(screen.getByRole('button', { name: 'بیمار' }));

    expect(screen.getByText(/بازگشایی اضطراری توسط منشی انجام شد/)).toBeDefined();
    const activeEnterBtns = screen.getAllByRole('button', { name: /ورود به اتاق ویزیت/ });
    expect(activeEnterBtns.length).toBeGreaterThan(0);
    expect((activeEnterBtns[0] as HTMLButtonElement).disabled).toBe(false);
  });

  it('opens appointment drawer, views uploaded documents with zoom controls, and complies with Field-Level RBAC (AC-05)', async () => {
    render(<App />);

    // Switch to Secretary
    fireEvent.click(screen.getByRole('button', { name: /منشی تهران/ }));

    // Click on tracking code AGY-10142 to open drawer
    const trackingBtn = screen.getByText('AGY-10142');
    fireEvent.click(trackingBtn);

    // Verify Drawer is open
    expect(screen.getByText('مشخصات نوبت و زمان‌بندی')).toBeDefined();
    expect(screen.getByText('ریزحساب مالی و پوشش بیمه')).toBeDefined();
    expect(screen.getByText(/مدارک و ضمائم بارگذاری‌شدهٔ بیمار/)).toBeDefined();

    // Verify document item is present (App-1 has CBC blood test)
    expect(screen.getByText('نتیجه آزمایش خون کامل (CBC) و چربی')).toBeDefined();

    // Click "مشاهده و زوم"
    const viewDocBtn = screen.getByRole('button', { name: /مشاهده و زوم/ });
    fireEvent.click(viewDocBtn);

    // Verify DocumentZoomModal is open with zoom controls
    expect(screen.getByLabelText('مشاهده و زوم مدارک پزشکی')).toBeDefined();
    expect(screen.getByTitle('بزرگ‌نمایی')).toBeDefined();
    expect(screen.getByTitle('کوچک‌نمایی')).toBeDefined();
    expect(screen.getByTitle('چرخش ۹۰ درجه')).toBeDefined();

    // Close zoom modal
    const closeZoomBtn = screen.getByLabelText('بستن');
    fireEvent.click(closeZoomBtn);
    expect(screen.queryByLabelText('مشاهده و زوم مدارک پزشکی')).toBeNull();

    // RBAC Check (AC-05): Save a clinical note first on app-1 to test secretary view
    appointmentRepository.saveClinicalNote('app-1', 'doc-1', {
      mainComplaint: 'سردرد میگرنی حاد',
      findings: 'فشار خون ۱۲ روی ۸',
      diagnosis: 'میگرن بدون اورا',
      prescriptions: 'ارگوتامین سی روزی ۱ عدد',
      followUp: 'ویزیت مجدد ۳ هفته بعد جهت بررسی پاسخ درمانی',
    });

    // Assert that followUp instruction is displayed to Secretary in the drawer
    await waitFor(() => {
      expect(screen.getByText('ویزیت مجدد ۳ هفته بعد جهت بررسی پاسخ درمانی')).toBeDefined();
    });
    expect(screen.getByText(/قانون محرمانگی داده‌های بالینی \(AC-05\)/)).toBeDefined();

    // Assert that diagnosis, examination findings, and complaints are NOT rendered to Secretary
    expect(screen.queryByText('سردرد میگرنی حاد')).toBeNull();
    expect(screen.queryByText('فشار خون ۱۲ روی ۸')).toBeNull();
    expect(screen.queryByText('میگرن بدون اورا')).toBeNull();
    expect(screen.queryByText('ارگوتامین سی روزی ۱ عدد')).toBeNull();
  });

  it('allows indebted patient to settle debt online directly and unlock the visit (AC-03 resolution)', async () => {
    render(<App />);

    // Seed app-2 is an indebted patient (Mehdi Saeidi with balance -120,000)
    // Settle debt on app-2 directly
    const settled = appointmentRepository.settleDebt('app-2');
    expect(settled.financialStatus).toBe('SETTLED');
    expect(settled.debtOrCreditBalance).toBe(0);
    expect(settled.isSoftLocked).toBe(false);

    // Verify patient 3 wallet updated
    const pat3Wallet = walletRepository.getByPatientId('pat-3');
    expect(pat3Wallet?.balance).toBe(0);
  });
});
