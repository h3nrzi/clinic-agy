import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { formatToman, formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import { BookingWizard } from '@/features/booking';
import { GatewaySimulator } from '@/features/payment-mock';
import { PaymentSuccessConfirmation } from '@/features/patient-portal';
import {
  Calendar,
  CreditCard,
  Video,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  ArrowRight,
  Database,
  Building,
  UserCheck,
  Clock,
  Sparkles,
  FileSpreadsheet,
  PlusCircle,
  CalendarCheck,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentRole, currentUser } = useAuthStore();
  const { activeScenario } = useScenarioStore();
  const { step: bookingStep, resetBooking } = useBookingStore();

  const [patientTab, setPatientTab] = useState<'MY_APPOINTMENTS' | 'NEW_BOOKING'>('MY_APPOINTMENTS');

  // Reactive listener to database changes
  const [, setDbVersion] = useState(0);
  useEffect(() => {
    const unsubscribe = memoryDb.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const allAppointments = appointmentRepository.getAll();
  const allDoctors = doctorRepository.getAll();
  const allBranches = memoryDb.getAll('branches');
  const allServices = tariffRepository.getServices();

  // Patient view calculations
  const patientAppointments = allAppointments.filter((a) => a.patientId === currentUser.id);
  const patientWallet = walletRepository.getByPatientId(currentUser.id);
  const walletBalance = patientWallet ? patientWallet.balance : 0;

  // Secretary view calculations
  const secretaryBranchId = currentRole === 'SECRETARY_TEHRAN' ? 'TEHRAN' : 'ISFAHAN';
  const branchAppointments = allAppointments.filter(
    (a) => a.branchId === secretaryBranchId || a.branchId === 'ONLINE'
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Scope and Roadmap Banner for Work Package WP-02 */}
      <section
        aria-label="وضعیت بسته کاری"
        className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-teal-500/30"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              بستهٔ کاری WP-02: جریان نماینده (رزرو آنلاین نوبت، بیمه پلکانی و درگاه شاپرک)
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              جریان کامل نوبت‌گیری آنلاین زیر ۳ دقیقه و محاسبهٔ هوشمند سهم بیمه
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              این ماژول جریان کاربر (FLOW-02) را از انتخاب خدمت و پزشک تا استعلام آنی بیمه، آپلود مدارک و پرداخت در درگاه شبیه‌ساز شاپرک بدون دخالت منشی و در کمتر از ۳ دقیقه پوشش می‌دهد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>پایگاه داده: <strong>حافظه‌ای (LocalStorage)</strong></span>
            </span>
            <span className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>وضعیت WP-02: <strong className="text-emerald-400">فعال و عملیاتی</strong></span>
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

          {/* Conditional View: Booking Gateway, Confirmation or Dashboard */}
          {bookingStep === 'GATEWAY' ? (
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
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                              {app.status === 'CONFIRMED' ? 'قطعی‌شده' : app.status}
                            </span>
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

                        {/* Action button */}
                        <div className="flex items-center gap-2 shrink-0">
                          {app.branchId === 'ONLINE' && (
                            <button
                              disabled={app.isSoftLocked}
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
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Secretary View */}
      {(currentRole === 'SECRETARY_TEHRAN' || currentRole === 'SECRETARY_ISFAHAN') && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  میز کار پذیرش {currentRole === 'SECRETARY_TEHRAN' ? 'شعبه مرکزی تهران' : 'شعبه شمس‌آبادی اصفهان'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                کنترل نوبت‌های روز، اصلاح دستی سهم بیمه تا پایان روز (Freeze Window) و مدیریت قفل نرم بدهکاری
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium">
                تعداد نوبت‌های شعبه: {toPersianDigits(branchAppointments.length)} نوبت
              </span>
            </div>
          </div>

          {/* Secretary Appointments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3.5">کد رهگیری</th>
                  <th className="p-3.5">نام بیمار</th>
                  <th className="p-3.5">پزشک معالج</th>
                  <th className="p-3.5">خدمت</th>
                  <th className="p-3.5">نوع نوبت</th>
                  <th className="p-3.5">سهم پرداختی</th>
                  <th className="p-3.5">وضعیت مالی</th>
                  <th className="p-3.5">وضعیت قفل</th>
                  <th className="p-3.5 text-center">عملیات شبیه‌سازی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{app.trackingCode}</td>
                    <td className="p-3.5 font-medium text-slate-900">{app.patientName}</td>
                    <td className="p-3.5 text-slate-700">{app.doctorName}</td>
                    <td className="p-3.5 text-slate-600">{app.serviceName}</td>
                    <td className="p-3.5">
                      {app.branchId === 'ONLINE' ? (
                        <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          آنلاین
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          حضوری
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">
                      {app.initialPatientPaid.toLocaleString('fa-IR')} تومان
                    </td>
                    <td className="p-3.5">
                      {app.financialStatus === 'DEBIT' ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          بدهکار ({Math.abs(app.debtOrCreditBalance).toLocaleString('fa-IR')} تومان)
                        </span>
                      ) : app.financialStatus === 'CREDIT' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          بستانکار
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          تسویه
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {app.isSoftLocked ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[11px]">
                          <Lock className="w-3 h-3" /> قفل نرم
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <Unlock className="w-3 h-3" /> باز
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {app.isSoftLocked ? (
                        <button
                          onClick={() => {
                            const reason = prompt(
                              'لطفاً دلیل بازگشایی اضطراری قفل ورود را وارد کنید:',
                              'هماهنگی تلفنی جهت تسویه در پایان روز'
                            );
                            if (reason) {
                              appointmentRepository.emergencyUnlock(app.id, reason, currentUser.name);
                            }
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded text-[11px] font-medium transition"
                        >
                          بازگشایی اضطراری
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">آماده پیاده‌سازی WP-03</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Doctor View */}
      {currentRole === 'DOCTOR' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{currentUser.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  کارتابل بالینی، نوبت‌های ویزیت تصویری و فرم ثبت پرونده ۵ فیلدی
                </p>
              </div>
            </div>
            <span className="bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-lg text-xs font-semibold">
              آماده برای بسته کاری WP-04
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">نوبت‌های ویزیت دکتر احمدی (شبیه‌ساز)</h4>
            <div className="space-y-3">
              {allAppointments
                .filter((a) => a.doctorId === 'doc-1')
                .map((app) => (
                  <div
                    key={app.id}
                    className="p-4 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        {app.patientName} — {app.serviceName}
                      </div>
                      <div className="text-slate-500 mt-1">
                        زمان: {formatDateTime(app.dateTime)} | وضعیت: {app.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {app.clinicalNote ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-medium">
                          شرح‌حال ۵ فیلدی ثبت شده
                        </span>
                      ) : (
                        <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                          در انتظار شروع ویزیت (WP-04)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin / Finance View */}
      {currentRole === 'ADMIN_FINANCE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">کل شعب فعال</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{toPersianDigits(allBranches.length)} شعبه</div>
              <div className="text-[11px] text-slate-400 mt-1">تهران، اصفهان، آنلاین</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">پزشکان ثبت‌شده</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{toPersianDigits(allDoctors.length)} پزشک</div>
              <div className="text-[11px] text-slate-400 mt-1">با درصد توافقی ۵۵٪ تا ۶۵٪</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">خدمات و تعرفه‌ها</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{toPersianDigits(allServices.length)} خدمت</div>
              <div className="text-[11px] text-slate-400 mt-1">آماده آپلود اکسل ۲ شیتی</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500">کل نوبت‌های پایگاه داده</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{toPersianDigits(allAppointments.length)} نوبت</div>
              <div className="text-[11px] text-slate-400 mt-1">در دیتابیس لوکال حافظه‌ای</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  مدیریت تعرفه و تسویه سهم پزشک (پیش‌نمایش گام‌های بعدی)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  در بسته‌های کاری WP-01 و WP-05، موتور محاسبه سهم پزشک با کسر مواد مصرفی و مالیات ۱۰٪ و آپلود فایل اکسل ۲ شیتی با جدول Diff در این بخش فعال خواهد شد.
                </p>
              </div>
            </div>
          </div>
        </div>
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
            WP-02 تکمیل و عملیاتی
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-00: اسکلت، ماک و دمو
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              پایگاه داده حافظه‌ای، استورها، نوار سوییچ ۵ نقشه و کامپوننت دمو.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-teal-400 shadow-sm ring-1 ring-teal-400/40">
            <div className="font-bold text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              WP-01: موتورهای منطق مالی
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              فرمول پلکانی بیمه، سهم پزشک با مالیات ۱۰٪ و ۱۰ تست واحد Vitest.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-500 shadow-sm ring-2 ring-emerald-500/40">
            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              WP-02: جریان نماینده (رزرو)
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              ویزارد ۴ مرحله‌ای زیر ۳ دقیقه، شبیه‌ساز شاپرک و صدور کد نوبت.
            </div>
          </div>

          <div className="bg-white/70 p-3.5 rounded-lg border border-slate-200">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <ArrowRight className="w-4 h-4 text-slate-400" />
              WP-03 تا WP-06: منشی، ویزیت، اکسل
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              میز کار منشی، اتاق ویزیت زنده، آپلود اکسل و تست‌های مرورگری E2E.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
