import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from '@/App';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';

describe('WP-06: Comprehensive E2E Evaluation & Acceptance Suite (FLOW-01 to FLOW-06, AC-01 to AC-08)', () => {
  beforeEach(() => {
    // Reset all database stores to pristine factory state
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
    useBookingStore.getState().resetBooking();
  });

  it('validates the complete end-to-end lifecycle across all roles with under-3-minute benchmark (AC-01 through AC-08)', async () => {
    const cycleStartTime = Date.now();
    render(<App />);

    // =========================================================================
    // STEP 1: FLOW-01 & SCREEN-01 — Role Switching & Demo Shell Verification
    // =========================================================================
    expect(screen.getByText('کلینیک سلامت آژی')).toBeDefined();
    expect(screen.getByRole('button', { name: 'بیمار' })).toBeDefined();
    expect(screen.getByRole('button', { name: /منشی تهران/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /منشی اصفهان/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /پزشک/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /مدیر مالی/ })).toBeDefined();

    // =========================================================================
    // STEP 2: FLOW-02 / AC-01 / AC-02 — Representative Online Booking (< 180s)
    // =========================================================================
    const bookingStartTime = Date.now();

    // Start New Booking
    const newBookingTab = screen.getByRole('button', { name: /رزرو نوبت جدید \(جریان نماینده\)/ });
    fireEvent.click(newBookingTab);

    // Step 1: Branch selection -> Online Telemedicine
    const onlineBranch = screen.getByText('سامانه ویزیت آنلاین و تله‌مدیسین آژی');
    fireEvent.click(onlineBranch);
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک و تقویم/ }));

    // Step 2: Doctor & Slot selection -> Dr. Maryam Ahmadi
    const doctorCard = screen.getAllByText('دکتر مریم احمدی')[0];
    fireEvent.click(doctorCard);

    const slotButtons = screen.getAllByRole('button', { name: /ساعت/ });
    expect(slotButtons.length).toBeGreaterThan(0);
    fireEvent.click(slotButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه و مدارک/ }));

    // Step 3: Tiered Insurance Calculation & Document Upload (AC-01)
    // Free: 280,000, Tamin 30% (84,000), Dana 70% of rem (137,200), Patient: 58,800
    expect(screen.getByText(/۵۸,۸۰۰ تومان/)).toBeDefined();

    const sampleDoc = new File(['test-cbc-blood-test'], 'test-cbc.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [sampleDoc] } });

    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ }));

    // Step 4: Summary Pre-invoice (SCREEN-03)
    expect(screen.getByText('ریز صورت‌حساب مالی (پیش‌فاکتور شفاف)')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /انتقال به درگاه پرداخت شاپرک/ }));

    // Shaparak Simulator (INT-03) -> Success
    expect(screen.getByText('شبیه‌ساز درگاه شاپرک')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /پرداخت موفق \(تایید قطعی نوبت\)/ }));

    // Confirmation Screen (AC-02)
    expect(screen.getByText(/وضعیت نوبت: قطعی‌شده \(CONFIRMED\)/)).toBeDefined();
    expect(screen.getByText(/پرداخت با موفقیت انجام شد و نوبت شما ثبت گردید/)).toBeDefined();

    // Verify under-3-minute benchmark (< 180s)
    const bookingElapsedSeconds = (Date.now() - bookingStartTime) / 1000;
    expect(bookingElapsedSeconds).toBeLessThan(180);

    // Return to Patient Dashboard
    fireEvent.click(screen.getByRole('button', { name: /مشاهده در نوبت‌های من/ }));

    // =========================================================================
    // STEP 3: FLOW-03 / AC-03 / AC-04 — Secretary Desk, Insurance Correction & Soft Lock
    // =========================================================================
    // Switch to Secretary Tehran
    fireEvent.click(screen.getByRole('button', { name: /منشی تهران/ }));
    expect(screen.getByText(/میز کار پذیرش شعبه مرکزی تهران/)).toBeDefined();

    // Open insurance edit modal for AGY-10142
    const editBtns = screen.getAllByTitle('اصلاح سهم بیمه');
    fireEvent.click(editBtns[0]);

    // Zero out supplementary insurance to trigger debit and soft-lock (AC-03)
    const zeroSuppBtn = screen.getByRole('button', {
      name: /ابطال بیمه تکمیلی \(سهم ۰ — سناریوی AC-03\)/,
    });
    fireEvent.click(zeroSuppBtn);
    expect(screen.getByText(/هشدار قفل نرم \(AC-03\)/)).toBeDefined();

    // Save correction
    fireEvent.click(screen.getByRole('button', { name: /ذخیره و اعمال اصلاحیه/ }));
    await waitFor(() => {
      expect(screen.queryByText(/اصلاح دستی سهم بیمه — پنجره فریز روزانه/)).toBeNull();
    });

    // Verify soft-lock in Patient view
    fireEvent.click(screen.getByRole('button', { name: 'بیمار' }));
    expect(screen.getByText(/قفل نرم فعال است: به دلیل مابه‌التفاوت بدهی/)).toBeDefined();
    const lockedBtn = screen.getByRole('button', { name: /ورود مسدود \(قفل بدهی\)/ });
    expect((lockedBtn as HTMLButtonElement).disabled).toBe(true);

    // Switch back to Secretary and issue Emergency Unlock (AC-04)
    fireEvent.click(screen.getByRole('button', { name: /منشی تهران/ }));
    const emergencyUnlockBtns = screen.getAllByRole('button', { name: /بازگشایی اضطراری/ });
    fireEvent.click(emergencyUnlockBtns[0]);

    // Confirm emergency unlock with reason
    fireEvent.click(screen.getByRole('button', { name: /تایید و بازگشایی اضطراری/ }));
    await waitFor(() => {
      expect(screen.queryByText(/بازگشایی اضطراری قفل ورود به جلسه \(AC-04\)/)).toBeNull();
    });

    // =========================================================================
    // STEP 4: FLOW-04 / AC-05 — Doctor Teleconsultation & Field-Level RBAC
    // =========================================================================
    // Switch to Doctor role using demo toolbar
    const toolbar = screen.getByLabelText('نوار ابزار دمو و سناریو');
    fireEvent.click(within(toolbar).getByRole('button', { name: 'پزشک' }));
    expect(screen.getByTestId('doctor-dashboard')).toBeDefined();

    // Start video consultation
    const startConsultBtns = screen.getAllByRole('button', { name: /شروع ویزیت تصویری/ });
    fireEvent.click(startConsultBtns[0]);

    expect(screen.getByTestId('doctor-consultation-room')).toBeDefined();
    expect(screen.getByTestId('video-call-simulator')).toBeDefined();

    // Fill 5-Field Clinical Note
    fireEvent.click(screen.getByRole('button', { name: /فرم شرح‌حال ۵ فیلدی/ }));
    fireEvent.click(screen.getByRole('button', { name: /درج سناریوی AC-05/ }));

    // Submit clinical note
    fireEvent.click(screen.getByRole('button', { name: /ثبت نهایی و خاتمه ویزیت/ }));
    expect(screen.getByText('پرونده بالینی با موفقیت ثبت شد')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /بازگشت به کارتابل نوبت‌ها/ }));

    // Check RBAC for Patient (AC-05): Only fields 4 & 5 rendered
    fireEvent.click(screen.getByRole('button', { name: 'بیمار' }));
    expect(screen.getByText('کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی')).toBeDefined();
    expect(screen.getByText('مراجعه مجدد ۲ هفته دیگر')).toBeDefined();
    expect(screen.queryByText('سردرد مزمن و احساس خستگی')).toBeNull();
    expect(screen.queryByText('فشار خون 13 روی 8')).toBeNull();
    expect(screen.queryByText('میگرن ناشی از استرس')).toBeNull();

    // Check RBAC for Secretary (AC-05): Click tracking code to open Secretary Drawer
    fireEvent.click(screen.getByRole('button', { name: /منشی تهران/ }));
    const trackingBtn = screen.getByText('AGY-10142');
    fireEvent.click(trackingBtn);

    await waitFor(() => {
      expect(screen.getByText('مراجعه مجدد ۲ هفته دیگر')).toBeDefined();
    });
    expect(screen.queryByText('کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی')).toBeNull();
    expect(screen.queryByText('میگرن ناشی از استرس')).toBeNull();
    expect(screen.queryByText('سردرد مزمن و احساس خستگی')).toBeNull();
    expect(screen.queryByText('فشار خون 13 روی 8')).toBeNull();

    // =========================================================================
    // STEP 5: FLOW-05 / AC-06 — 12-Hour Cancellation Rule & Wallet Refund
    // =========================================================================
    // Return to Patient role to cancel app-future-urgent (<12h remaining)
    fireEvent.click(screen.getByRole('button', { name: 'بیمار' }));

    const urgentBadge = screen.getByText('AGY-10189');
    const urgentCard = urgentBadge.closest('.hover\\:bg-slate-50\\/60') || urgentBadge.parentElement?.parentElement?.parentElement!;
    const urgentCancelBtn = within(urgentCard as HTMLElement).getByRole('button', { name: /لغو نوبت/ });
    fireEvent.click(urgentCancelBtn);

    // Verify 50% penalty warning dialog (AC-06)
    expect(screen.getByText(/مشمول ۵۰٪ جریمه/)).toBeDefined();
    expect(screen.getAllByText(/۱۰۰,۰۰۰ تومان/).length).toBeGreaterThanOrEqual(2);

    // Confirm cancel
    fireEvent.click(screen.getByRole('button', { name: /تأیید لغو با کسر ۵۰٪ جریمه/ }));
    expect(screen.getByText('نوبت با موفقیت لغو شد')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /متوجه شدم و بستن/ }));

    // =========================================================================
    // STEP 6: FLOW-06 / AC-07 / AC-08 — Excel Tariff Upload Diff & Doctor Share
    // =========================================================================
    // Switch to Admin Finance role
    fireEvent.click(within(toolbar).getByRole('button', { name: /مدیر مالی/ }));
    expect(screen.getByTestId('financial-dashboard')).toBeDefined();

    // Switch to Excel Tariff Tab (Tab 2)
    const excelTabBtn = screen.getByRole('button', { name: /آپلود اکسل ۲ شیتی/ });
    fireEvent.click(excelTabBtn);
    expect(screen.getByText(/آپلود و تحلیل فایل اکسل تعرفه‌ها/)).toBeDefined();

    // Load 2-Sheet Excel Tariff mock (DEC-FE-03)
    const loadMockBtn = screen.getByRole('button', { name: /بارگذاری داده نمونه ماک ۲ شیتی/ });
    fireEvent.click(loadMockBtn);

    // Verify Diff Preview table (AC-07)
    await waitFor(() => {
      expect(screen.getByText(/پیش‌نمایش تغییرات و جدول مقایسه‌ای Diff/)).toBeDefined();
    });
    expect(screen.getByText('SRV-CLI-01')).toBeDefined();
    expect(screen.getByText('SRV-HOL-01')).toBeDefined();

    // Confirm and apply Diff
    const applyDiffBtn = screen.getByRole('button', { name: /تأیید و اعمال نهایی در سیستم/ });
    fireEvent.click(applyDiffBtn);

    await waitFor(() => {
      expect(screen.getByText(/تعرفه‌های جدید با موفقیت اعمال شدند/)).toBeDefined();
    });

    // Switch back to Tab 1 (KPI & Doctor Shares)
    const kpiTabBtn = screen.getByRole('button', { name: /داشبورد مالی و سهم پزشکان/ });
    fireEvent.click(kpiTabBtn);

    // Verify Doctor Share Calculations with 10% tax in Admin Dashboard (AC-08)
    expect(screen.getByText('کل درآمد ناخالص خدمات')).toBeDefined();
    expect(screen.getByText('مجموع سهم ناخالص پزشکان')).toBeDefined();
    expect(screen.getByText('مالیات ۱۰٪ کسرشده (DEC-FE-03)')).toBeDefined();
    expect(screen.getByText('خالص پرداختی به پزشکان')).toBeDefined();
    expect(screen.getAllByText('دکتر مریم احمدی').length).toBeGreaterThanOrEqual(1);

    // =========================================================================
    // STEP 7: Benchmark Verification
    // =========================================================================
    const totalCycleDuration = (Date.now() - cycleStartTime) / 1000;
    // Entire multi-role cycle completes cleanly and rapidly
    expect(totalCycleDuration).toBeLessThan(60);
  });

  it('rigorously tests the Representative Booking under-3-minute benchmark (FLOW-02, AC-01, AC-02)', async () => {
    const bookingBenchmarkStart = Date.now();
    render(<App />);

    // Step 1: Open Wizard
    fireEvent.click(screen.getByRole('button', { name: /رزرو نوبت جدید \(جریان نماینده\)/ }));
    expect(screen.getByText('جریان نماینده (FLOW-02)')).toBeDefined();

    // Select branch -> Online
    fireEvent.click(screen.getByText('سامانه ویزیت آنلاین و تله‌مدیسین آژی'));
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک و تقویم/ }));

    // Step 2: Select doctor & time slot
    fireEvent.click(screen.getAllByText('دکتر مریم احمدی')[0]);
    const slotBtns = screen.getAllByRole('button', { name: /ساعت/ });
    fireEvent.click(slotBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه و مدارک/ }));

    // Step 3: Verify tiered calculation formula
    expect(screen.getByText(/۵۸,۸۰۰ تومان/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ }));

    // Step 4: Pre-invoice check & Go to gateway
    expect(screen.getByText('پیش‌فاکتور شفاف و خلاصه نوبت')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /انتقال به درگاه پرداخت شاپرک/ }));

    // Step 5: Gateway success
    expect(screen.getByText('شبیه‌ساز درگاه شاپرک')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /پرداخت موفق \(تایید قطعی نوبت\)/ }));

    // Step 6: Confirmation screen verified
    expect(screen.getByText(/وضعیت نوبت: قطعی‌شده \(CONFIRMED\)/)).toBeDefined();

    const elapsedSeconds = (Date.now() - bookingBenchmarkStart) / 1000;
    // Must be strictly less than 180 seconds (3 minutes) as required by PRD and AC-02
    expect(elapsedSeconds).toBeLessThan(180);
    // In our automated browser test runner, it executes in mere seconds:
    expect(elapsedSeconds).toBeLessThan(15);
  });

  it('validates demo toolbar role-switching, scenario state injection and factory reset safety (DEC-FE-01)', () => {
    render(<App />);

    const toolbar = screen.getByLabelText('نوار ابزار دمو و سناریو');

    // 1. Verify default role is Patient
    expect(useAuthStore.getState().currentRole).toBe('PATIENT');

    // 2. Switch to Secretary Isfahan
    fireEvent.click(within(toolbar).getByRole('button', { name: /منشی اصفهان/ }));
    expect(useAuthStore.getState().currentRole).toBe('SECRETARY_ISFAHAN');
    expect(screen.getByText(/میز کار پذیرش شعبه شمس‌آبادی اصفهان/)).toBeDefined();

    // 3. Switch to Patient and inject Indebted Scenario
    fireEvent.click(within(toolbar).getByRole('button', { name: 'بیمار' }));
    expect(useAuthStore.getState().currentRole).toBe('PATIENT');

    const scenarioBtn = within(toolbar).getByRole('button', { name: /تزریق بیمار بدهکار/ });
    fireEvent.click(scenarioBtn);

    // Verify scenario banner and soft-lock
    expect(screen.getByText(/سناریوی بیمار بدهکار فعال شد/)).toBeDefined();
    expect(useScenarioStore.getState().activeScenario).toBe('INDEBTED_PATIENT');
    expect(screen.getByText(/قفل نرم فعال است/)).toBeDefined();

    // 4. Toggle scenario off
    const toggleOffBtn = within(toolbar).getByRole('button', { name: /غیرفعال‌سازی بیمار بدهکار/ });
    fireEvent.click(toggleOffBtn);
    expect(useScenarioStore.getState().activeScenario).toBe('NORMAL');

    // 5. Test Factory Reset
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const resetBtn = within(toolbar).getByRole('button', { name: /ریست کارخانه‌ای داده‌ها/ });
    fireEvent.click(resetBtn);
    expect(screen.getByText(/تمامی داده‌های دیتابیس به مقادیر اولیه کارخانه‌ای/)).toBeDefined();
  });
});
