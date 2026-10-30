import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { formatToman, formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import { BookingWizard } from '@/features/booking';
import { GatewaySimulator } from '@/features/payment-mock';
import { PaymentSuccessConfirmation, CancelAppointmentModal } from '@/features/patient-portal';
import { SecretaryDashboard } from '@/features/secretary';
import { FinancialDashboard } from '@/features/financial-dashboard';
import { Appointment } from '@/shared/types';
import {
  DoctorDashboard,
  ConsultationRoom,
  PatientConsultationRoom,
} from '@/features/teleconsultation';
import {
  Calendar,
  CreditCard,
  Video,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  Clock,
  Building,
  Sparkles,
  PlusCircle,
  CalendarCheck,
  XCircle,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentRole, currentUser } = useAuthStore();
  const { activeScenario } = useScenarioStore();
  const { step: bookingStep, resetBooking } = useBookingStore();

  const [patientTab, setPatientTab] = useState<'MY_APPOINTMENTS' | 'NEW_BOOKING'>('MY_APPOINTMENTS');
  const [activePatientConsultationApp, setActivePatientConsultationApp] = useState<Appointment | null>(null);
  const [activeDoctorConsultationApp, setActiveDoctorConsultationApp] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  // Reactive listener to database changes
  const [, setDbVersion] = useState(0);
  useEffect(() => {
    const unsubscribe = memoryDb.subscribe(() => {
      setDbVersion((v) => v + 1);
      setActiveDoctorConsultationApp((current: Appointment | null) => {
        if (!current) return null;
        return appointmentRepository.getById(current.id) || null;
      });
      setActivePatientConsultationApp((current: Appointment | null) => {
        if (!current) return null;
        return appointmentRepository.getById(current.id) || null;
      });
    });
    return unsubscribe;
  }, []);

  const allAppointments = appointmentRepository.getAll();

  // Patient view calculations
  const patientAppointments = allAppointments.filter((a) => a.patientId === currentUser.id);
  const patientWallet = walletRepository.getByPatientId(currentUser.id);
  const walletBalance = patientWallet ? patientWallet.balance : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Scope and Roadmap Banner for Work Packages */}
      <section
        aria-label="وضعیت بسته کاری"
        className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-teal-500/30"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              بستهٔ کاری WP-05: تقویم شیفت‌ها، مرخصی، لغو ۱۲ ساعت و ماژول مالی اکسل ۲ شیتی (FLOW-05, FLOW-06)
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              مدیریت تقویم شیفت‌ها، قانون لغو ۱۲ ساعت با ۵۰٪ جریمه و تحلیلگر اکسل ۲ شیتی با پیش‌نمایش Diff
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              این بسته شامل هماهنگی ظرفیت تقویم و مرخصی پزشکان، لغو نوبت با مرز ۱۲ ساعت و استرداد وجه به کیف پول، داشبورد جامع مالی و تسویه سهم پزشکان (AC-08)، و تحلیلگر فایل اکسل ۲ شیتی تعرفه با جدول مقایسه‌ای Diff (AC-07) است.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>وضعیت WP-04: <strong className="text-emerald-400">تکمیل‌شده ✅</strong></span>
            </span>
            <span className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>وضعیت WP-05: <strong className="text-emerald-400">فعال و عملیاتی 🟢</strong></span>
            </span>
          </div>
        </div>
      </section>

      {/* Role-Specific Dashboard Content */}
      {currentRole === 'PATIENT' && (
        <div className="space-y-6">
          {/* Patient Header Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPatientTab('MY_APPOINTMENTS');
                  if (bookingStep === 'CONFIRMED') resetBooking();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  patientTab === 'MY_APPOINTMENTS' && bookingStep !== 'GATEWAY' && bookingStep !== 'CONFIRMED'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CalendarCheck className="w-4 h-4" />
                <span>نوبت‌های من ({toPersianDigits(patientAppointments.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPatientTab('NEW_BOOKING');
                  if (bookingStep === 'CONFIRMED' || bookingStep === 'GATEWAY') {
                    resetBooking();
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  patientTab === 'NEW_BOOKING' || bookingStep === 'GATEWAY' || bookingStep === 'CONFIRMED'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>رزرو نوبت جدید (جریان نماینده)</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>کاربر فعال: <strong>{currentUser.name}</strong></span>
            </div>
          </div>

          {/* Conditional View: Active Patient Video Room, Gateway, Confirmation or Dashboard */}
          {activePatientConsultationApp ? (
            <PatientConsultationRoom
              appointment={activePatientConsultationApp}
              onExit={() => setActivePatientConsultationApp(null)}
            />
          ) : bookingStep === 'GATEWAY' ? (
            <GatewaySimulator />
          ) : bookingStep === 'CONFIRMED' ? (
            <PaymentSuccessConfirmation
              onViewAppointments={() => {
                setPatientTab('MY_APPOINTMENTS');
                resetBooking();
              }}
              onBookAnother={() => {
                resetBooking();
                setPatientTab('NEW_BOOKING');
              }}
            />
          ) : patientTab === 'NEW_BOOKING' ? (
            <BookingWizard
              onCancel={() => {
                setPatientTab('MY_APPOINTMENTS');
                resetBooking();
              }}
            />
          ) : (
            <>
              {/* Patient Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Wallet Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">کیف پول بیمار</span>
                    <CreditCard className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="mt-3">
                    <div
                      className={`text-2xl font-bold ${
                        walletBalance < 0
                          ? 'text-rose-600'
                          : walletBalance > 0
                          ? 'text-emerald-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {formatToman(walletBalance)}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {walletBalance < 0
                        ? '⚠️ دارای مانده بدهی — نوبت‌های آنلاین مشمول قفل نرم می‌شوند.'
                        : walletBalance > 0
                        ? 'دارای بستانکاری قابل کسر از نوبت بعدی'
                        : 'حساب تسویه است (بدون بدهی یا بستانکاری)'}
                    </div>
                  </div>
                </div>

                {/* Active Appointments Count */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">نوبت‌های رزروشده</span>
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-slate-800">
                      {toPersianDigits(patientAppointments.length)} نوبت
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      شامل نوبت‌های حضوری شعب و ویزیت آنلاین
                    </div>
                  </div>
                </div>

                {/* Scenario Status Indicator */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">حالت سناریوی جاری</span>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <div className="text-base font-bold text-slate-800">
                      {activeScenario === 'INDEBTED_PATIENT'
                        ? '⚠️ بیمار بدهکار (قفل نرم فعال)'
                        : '✅ حالت عادی (بیمار نرمال)'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      قابل تعویض با دکمه نوار ابزار دمو در بالای صفحه
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Appointments List */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">نوبت‌های ثبت‌شدهٔ من</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      مشاهده جزئیات، وضعیت پرداخت و لینک ورود به جلسه ویزیت آنلاین
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPatientTab('NEW_BOOKING');
                      resetBooking();
                    }}
                    className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm self-start sm:self-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>رزرو نوبت جدید</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {patientAppointments.length === 0 ? (
                    <div className="p-8 text-center space-y-3">
                      <div className="text-slate-400 text-xs">
                        هیچ نوبتی برای این بیمار ثبت نشده است. برای ثبت نوبت جدید از ویزارد زیر ۳ دقیقه استفاده کنید.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPatientTab('NEW_BOOKING');
                          resetBooking();
                        }}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-teal-700 transition"
                      >
                        شروع رزرو نوبت آنلاین
                      </button>
                    </div>
                  ) : (
                    patientAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{app.serviceName}</span>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">
                              {app.trackingCode}
                            </span>
                            {app.branchId === 'ONLINE' ? (
                              <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-teal-200">
                                <Video className="w-3 h-3" /> ویزیت آنلاین
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 rounded-full border border-blue-200">
                                <Building className="w-3 h-3" /> شعبه{' '}
                                {app.branchId === 'TEHRAN' ? 'تهران' : 'اصفهان'}
                              </span>
                            )}
                            {app.status === 'CONFIRMED' ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                قطعی‌شده
                              </span>
                            ) : app.status === 'COMPLETED' ? (
                              <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                ویزیت تکمیل‌شده
                              </span>
                            ) : app.status === 'CANCELLED_BY_PATIENT' ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                لغو شده توسط بیمار
                              </span>
                            ) : app.status === 'CANCELLED_BY_CLINIC' ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                لغو شده توسط کلینیک
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                                {app.status}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                            <span>پزشک: <strong>{app.doctorName}</strong></span>
                            <span>•</span>
                            <span>زمان: <strong>{formatDateTime(app.dateTime)}</strong></span>
                            <span>•</span>
                            <span>مبلغ پرداختی اولیه: <strong>{app.initialPatientPaid.toLocaleString('fa-IR')} تومان</strong></span>
                            {app.walletCreditApplied > 0 && (
                              <span className="text-indigo-700 font-semibold">
                                (با کسر {app.walletCreditApplied.toLocaleString('fa-IR')} تومان از بستانکاری)
                              </span>
                            )}
                          </div>

                          {/* Debt alert if soft locked */}
                          {app.isSoftLocked && (
                            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg font-medium">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                قفل نرم فعال است: به دلیل مابه‌التفاوت بدهی{' '}
                                {Math.abs(app.debtOrCreditBalance).toLocaleString('fa-IR')} تومان پس از اصلاح بیمه، ورود به جلسه مشروط به تسویه یا بازگشایی اضطراری منشی است.
                              </span>
                            </div>
                          )}

                          {/* Emergency unlock note */}
                          {app.emergencyUnlocked && (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
                              <Unlock className="w-3.5 h-3.5 shrink-0" />
                              <span>بازگشایی اضطراری توسط منشی انجام شد: «{app.emergencyUnlockReason}»</span>
                            </div>
                          )}

                          {/* Clinical note preview (Field-level RBAC: Only prescription and follow-up visible to patient) */}
                          {app.clinicalNote && (
                            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                نسخه و توصیه‌های پزشک (رعایت محرمانگی RBAC بیمار):
                              </div>
                              <div className="text-slate-700">
                                <strong>دارو و نسخه:</strong> {app.clinicalNote.prescriptions}
                              </div>
                              <div className="text-slate-600">
                                <strong>دستور پیگیری:</strong> {app.clinicalNote.followUp}
                              </div>
                              <div className="text-[11px] text-slate-400 italic">
                                (طبق قانون محرمانگی AC-05، فیلدهای معاینه و تشخیص برای بیمار رندر نمی‌شوند.)
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Cancel Appointment Button (FLOW-05 / AC-06) */}
                          {app.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              onClick={() => setAppointmentToCancel(app)}
                              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-2 rounded-lg text-xs font-semibold transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>لغو نوبت</span>
                            </button>
                          )}

                          {app.branchId === 'ONLINE' && app.status === 'CONFIRMED' && (
                            <>
                              {app.isSoftLocked && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    appointmentRepository.settleDebt(app.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>پرداخت مابه‌التفاوت و رفع قفل</span>
                                </button>
                              )}
                              <button
                                disabled={app.isSoftLocked}
                                onClick={() => {
                                  if (!app.isSoftLocked) {
                                    setActivePatientConsultationApp(app);
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                                  app.isSoftLocked
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                                }`}
                              >
                                {app.isSoftLocked ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    ورود مسدود (قفل بدهی)
                                  </>
                                ) : (
                                  <>
                                    <Video className="w-3.5 h-3.5" />
                                    ورود به اتاق ویزیت
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cancel Appointment Modal (FLOW-05 / AC-06) */}
              {appointmentToCancel && (
                <CancelAppointmentModal
                  appointment={appointmentToCancel}
                  onClose={() => setAppointmentToCancel(null)}
                  onCancelled={() => setAppointmentToCancel(null)}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Secretary View (FLOW-03, SCREEN-05, WP-03) */}
      {(currentRole === 'SECRETARY_TEHRAN' || currentRole === 'SECRETARY_ISFAHAN') && (
        <SecretaryDashboard />
      )}

      {/* Doctor View (FLOW-04, SCREEN-06, WP-04) */}
      {currentRole === 'DOCTOR' && (
        activeDoctorConsultationApp ? (
          <ConsultationRoom
            appointment={activeDoctorConsultationApp}
            doctorName={currentUser.name}
            onBack={() => setActiveDoctorConsultationApp(null)}
          />
        ) : (
          <DoctorDashboard
            doctorName={currentUser.name}
            appointments={allAppointments.filter((a) => a.doctorId === currentUser.id || !a.doctorId)}
            onStartConsultation={(app) => setActiveDoctorConsultationApp(app)}
          />
        )
      )}

      {/* Admin / Finance View (FLOW-06, SCREEN-07, WP-05) */}
      {currentRole === 'ADMIN_FINANCE' && (
        <FinancialDashboard />
      )}

      {/* Work Package Progress Map */}
      <section aria-label="نقشه بسته‌های کاری" className="bg-slate-100 rounded-xl p-5 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            نقشهٔ پیشرفت بسته‌های کاری فرانت‌اند (WBS Execution Matrix)
          </h3>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            WP-05 فعال و عملیاتی
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-00: شالوده و دمو
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              پایگاه داده حافظه‌ای، استورها، نوار سوییچ ۵ نقشه و کامپوننت دمو.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-01: منطق مالی
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              فرمول پلکانی بیمه، سهم پزشک با مالیات ۱۰٪ و تست‌های Vitest.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-02: جریان نماینده
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              ویزارد ۴ مرحله‌ای زیر ۳ دقیقه، شبیه‌ساز شاپرک و صدور کد نوبت.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-03: میز کار منشی
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              اصلاح دستی بیمه، محاسبه دلتا، مهار قفل نرم و بازگشایی اضطراری.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-04: کارتابل و ویزیت
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              اتاق ویزیت ویدیویی زنده، فرم ۵ فیلدی شرح‌حال و تفکیک RBAC.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-500 shadow-sm ring-2 ring-emerald-500/40">
            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              WP-05: تقویم، لغو و اکسل
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              تقویم و مرخصی، لغو ۱۲ ساعته با کسر ۵۰٪ جریمه و اکسل ۲ شیتی با Diff.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
