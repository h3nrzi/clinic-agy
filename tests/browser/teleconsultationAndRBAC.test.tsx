import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderApp, switchAccount } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';

describe('WP-04: Teleconsultation, 5-Field Clinical Note & Field-Level RBAC (FLOW-04, SCREEN-06, AC-05)', () => {
  beforeEach(() => {
    // Factory reset before each test
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
    useBookingStore.getState().resetBooking();
  });

  it('executes full FLOW-04 cycle: doctor conducts video consultation, fills 5-field clinical note, and enforces Field-Level RBAC for Patient and Secretary (AC-05)', async () => {
    renderApp();

    // 1. Sign in with the doctor account.
    await switchAccount('DOCTOR');

    // Verify Doctor Dashboard (SCREEN-06) renders
    expect(screen.getByTestId('doctor-dashboard')).toBeDefined();
    expect(screen.getAllByText('دکتر مریم احمدی').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('AGY-10142')).toBeDefined(); // App-1 (Ali Rezaei, Online)

    // 2. Doctor starts video consultation for appointment AGY-10142
    const startConsultationBtns = screen.getAllByRole('button', { name: /شروع ویزیت تصویری/ });
    expect(startConsultationBtns.length).toBeGreaterThan(0);
    fireEvent.click(startConsultationBtns[0]);

    // Verify Doctor Consultation Room (Side-by-Side layout) is displayed
    expect(screen.getByTestId('doctor-consultation-room')).toBeDefined();
    expect(screen.getByTestId('video-call-simulator')).toBeDefined();
    expect(screen.getByTestId('consultation-timer')).toBeDefined();
    expect(screen.getByText(/ارتباط ویدیویی زنده/)).toBeDefined();

    // 3. Inspect Uploaded Documents Tab
    const docsTabBtn = screen.getByRole('button', { name: /مدارک و آزمایش‌های بیمار/ });
    fireEvent.click(docsTabBtn);

    expect(screen.getByText('نتیجه آزمایش خون کامل (CBC) و چربی')).toBeDefined();

    // Test Document Zoom modal in doctor room
    const zoomBtn = screen.getByRole('button', { name: /زوم/ });
    fireEvent.click(zoomBtn);
    expect(screen.getByLabelText('مشاهده و زوم مدارک پزشکی')).toBeDefined();

    // Close zoom modal
    const closeZoomBtn = screen.getByLabelText('بستن');
    fireEvent.click(closeZoomBtn);
    expect(screen.queryByLabelText('مشاهده و زوم مدارک پزشکی')).toBeNull();

    // 4. Return to Clinical Note Tab and fill all 5 fields
    const noteTabBtn = screen.getByRole('button', { name: /شرح‌حال و نسخه/ });
    fireEvent.click(noteTabBtn);

    // Use Quick Populate for AC-05 values
    const populateBtn = screen.getByRole('button', { name: /درج نمونه یادداشت/ });
    fireEvent.click(populateBtn);

    // Verify fields populated
    const complaintInput = screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement;
    expect(complaintInput.value).toBe('سردرد مزمن و احساس خستگی');

    const findingsInput = screen.getByLabelText(/یافته‌های مهم و معاینه/) as HTMLTextAreaElement;
    expect(findingsInput.value).toBe('فشار خون 13 روی 8');

    const diagnosisInput = screen.getByLabelText(/تشخیص و تشخیص‌های افتراقی/) as HTMLTextAreaElement;
    expect(diagnosisInput.value).toBe('میگرن ناشی از استرس');

    const prescriptionInput = screen.getByLabelText(/توصیه‌ها، دستورات دارویی و نسخه/) as HTMLTextAreaElement;
    expect(prescriptionInput.value).toBe('کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی');

    const followUpInput = screen.getByLabelText(/دستور پیگیری/) as HTMLTextAreaElement;
    expect(followUpInput.value).toBe('مراجعه مجدد ۲ هفته دیگر');

    // 5. Submit and Save 5-Field Clinical Note
    const saveNoteBtn = screen.getByRole('button', { name: /ثبت نهایی و خاتمه ویزیت/ });
    fireEvent.click(saveNoteBtn);

    // Verify Success Modal appears
    expect(screen.getByText('پرونده بالینی با موفقیت ثبت شد')).toBeDefined();
    expect(screen.getByText(/دسترسی به پرونده/)).toBeDefined();

    // Click Return to Appointments button in modal
    const returnBtn = screen.getByRole('button', { name: /بازگشت به کارتابل نوبت‌ها/ });
    fireEvent.click(returnBtn);

    // Verify appointment status updated to COMPLETED in repository
    const completedApp = appointmentRepository.getById('app-1');
    expect(completedApp?.status).toBe('COMPLETED');
    expect(completedApp?.clinicalNote).toBeDefined();
    expect(completedApp?.clinicalNote?.diagnosis).toBe('میگرن ناشی از استرس');

    // 6. RBAC Check for PATIENT: Switch to Patient role
    await switchAccount('PATIENT');

    fireEvent.click(within(screen.getByRole('article', { name: 'نوبت AGY-10142' })).getByRole('button', { name: 'مشاهده نسخه و توصیه‌ها' }));

    // Verify Patient Appointment Card displays clinical note under Field-Level RBAC (AC-05):
    // Prescriptions and Follow-up MUST be displayed
    expect(screen.getByText(/کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی/)).toBeDefined();
    expect(screen.getByText(/مراجعه مجدد ۲ هفته دیگر/)).toBeDefined();

    // Sensitive Doctor-Only Fields MUST NOT be in the Patient DOM!
    expect(screen.queryByText('سردرد مزمن و احساس خستگی')).toBeNull();
    expect(screen.queryByText('فشار خون 13 روی 8')).toBeNull();
    expect(screen.queryByText('میگرن ناشی از استرس')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'بستن نسخه' }));

    // 7. RBAC Check for SECRETARY: Switch to Secretary Tehran role
    await switchAccount('SECRETARY_TEHRAN');

    // Click tracking code AGY-10142 to open Secretary Drawer
    const trackingBtn = screen.getByText('AGY-10142');
    fireEvent.click(trackingBtn);

    // Verify Secretary Drawer displays ONLY Follow-up instructions (AC-05):
    await waitFor(() => {
      expect(screen.getByText('مراجعه مجدد ۲ هفته دیگر')).toBeDefined();
    });

    // Verify Secretary CANNOT see Complaint, Findings, Diagnosis, OR Prescriptions
    expect(screen.queryByText('سردرد مزمن و احساس خستگی')).toBeNull();
    expect(screen.queryByText('فشار خون 13 روی 8')).toBeNull();
    expect(screen.queryByText('میگرن ناشی از استرس')).toBeNull();
    expect(screen.queryByText('کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی')).toBeNull();
  });

  it('allows eligible patient to enter teleconsultation room and inspect their consultation view', async () => {
    renderApp();

    // In Patient view, app-1 is confirmed and not soft-locked
    const enterRoomBtns = screen.getAllByRole('button', { name: /ورود به اتاق ویزیت/ });
    expect(enterRoomBtns.length).toBeGreaterThan(0);
    expect((enterRoomBtns[0] as HTMLButtonElement).disabled).toBe(false);

    // Click enter room
    fireEvent.click(enterRoomBtns[0]);

    // Verify Patient Consultation Room opens
    expect(screen.getByTestId('patient-consultation-room')).toBeDefined();
    expect(screen.getByText('اتاق ویزیت و مشاوره آنلاین')).toBeDefined();
    expect(screen.getByTestId('video-call-simulator')).toBeDefined();

    // Exit back to dashboard
    const exitBtn = screen.getByRole('button', { name: /خروج از اتاق ویزیت/ });
    fireEvent.click(exitBtn);

    // Verifies dashboard returned
    expect(screen.queryByTestId('patient-consultation-room')).toBeNull();
    expect(screen.getByText('نوبت‌های ثبت‌شدهٔ من')).toBeDefined();
  });
});
