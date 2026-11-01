import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { formatToman, formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { PatientConsultationRoom } from '@/features/teleconsultation';
import type { Appointment } from '@/shared/types';
import { CheckCircle2, Calendar, CreditCard, Video, AlertCircle, Lock, Unlock, Building, PlusCircle, XCircle } from 'lucide-react';

/** Patient route leaf; booking steps and cancellation remain local interactions. */
export function PatientPortal() {
  const patientId = useAuthStore(state => state.currentUser.id);
  return <PatientPortalContent key={patientId} />;
}

function PatientPortalContent() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const resetBooking = useBookingStore(s => s.resetBooking);
  const [activePatientConsultationApp, setActivePatientConsultationApp] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [, refresh] = useState(0);
  useEffect(() => memoryDb.subscribe(() => {
    refresh(v => v + 1);
    setActivePatientConsultationApp(current => current ? appointmentRepository.getById(current.id) || null : null);
  }), []);
  const patientAppointments = appointmentRepository.getAll().filter(a => a.patientId === currentUser.id);
  const nextAppointment = [...patientAppointments].filter(a => a.status === 'CONFIRMED' && new Date(a.dateTime).getTime() > Date.now()).sort((a,b) => a.dateTime.localeCompare(b.dateTime))[0];
  const walletBalance = walletRepository.getByPatientId(currentUser.id)?.balance || 0;
  if (activePatientConsultationApp) return <PatientConsultationRoom appointment={activePatientConsultationApp} onExit={() => setActivePatientConsultationApp(null)} />;
  return <div className="space-y-6">
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
                        ? 'دارای مانده بدهی — نوبت‌های آنلاین مشمول قفل نرم می‌شوند.'
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
                    <span className="text-xs font-medium text-slate-500">نوبت بعدی</span>
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <div className="text-base font-bold text-slate-800">
                      {nextAppointment ? formatDateTime(nextAppointment.dateTime) : 'نوبت پیش رو ندارید'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {nextAppointment ? nextAppointment.doctorName : 'برای دریافت خدمات، نوبت جدید رزرو کنید'}
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
                      navigate('/patient/booking');
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
                          navigate('/patient/booking');
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
                                نسخه و توصیه‌های پزشک:
                              </div>
                              <div className="text-slate-700">
                                <strong>دارو و نسخه:</strong> {app.clinicalNote.prescriptions}
                              </div>
                              <div className="text-slate-600">
                                <strong>دستور پیگیری:</strong> {app.clinicalNote.followUp}
                              </div>
                              <div className="text-[11px] text-slate-400 italic">
                                اطلاعات این بخش فقط شامل نسخه و دستور پیگیری شماست.
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

  </div>;
}
