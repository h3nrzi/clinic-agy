import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
import React from 'react';
import { Appointment, PatientDocument } from '@/shared/types';
import { formatToman, formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import {
  X,
  FileText,
  Lock,
  Unlock,
  ShieldAlert,
  User,
  Phone,
  CreditCard,
  Building,
  Video,
  FileEdit,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';

interface AppointmentDrawerProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInsuranceModal: (appointment: Appointment) => void;
  onOpenEmergencyUnlock: (appointment: Appointment) => void;
  onViewDocument: (doc: PatientDocument) => void;
}

export const AppointmentDrawer: React.FC<AppointmentDrawerProps> = ({
  appointment: app,
  isOpen,
  onClose,
  onOpenInsuranceModal,
  onOpenEmergencyUnlock,
  onViewDocument,
}) => {
  const dialogRef = useDialogFocus(onClose, isOpen && !!app);
  if (!isOpen || !app) return null;

  const isIndebted = app.financialStatus === 'DEBIT';
  const isCredited = app.financialStatus === 'CREDIT';

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="جزئیات پرونده و نوبت بیمار"
      className="reception-drawer fixed inset-0 z-40 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>{app.patientName}</span>
                  <span className="font-mono text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                    {app.trackingCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ثبت‌شده در: {formatDateTime(app.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
              aria-label="بستن کشو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Quick Status Banners */}
            <div className="space-y-2">
              {app.isSoftLocked && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <div className="font-bold">قفل نرم ورود به جلسه فعال است</div>
                    <div className="mt-0.5 text-[11px] text-rose-700 leading-relaxed">
                      بیمار دارای مانده بدهی {formatToman(Math.abs(app.debtOrCreditBalance))} تومان است. ورود به جلسه ویزیت آنلاین مسدود شده است.
                    </div>
                  </div>
                </div>
              )}

              {app.emergencyUnlocked && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 flex items-start gap-2.5">
                  <Unlock className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="font-bold">بازگشایی اضطراری قفل ورود انجام شده است</div>
                    <div className="mt-0.5 text-[11px] text-emerald-700">
                      دلیل: «{app.emergencyUnlockReason}» • توسط: {app.emergencyUnlockedBy}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Patient & Appointment Information */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <Calendar className="w-4 h-4 text-teal-600" />
                مشخصات نوبت و زمان‌بندی
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">پزشک معالج:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{app.doctorName}</div>
                </div>
                <div>
                  <span className="text-slate-500">خدمت درمانی:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{app.serviceName}</div>
                </div>
                <div>
                  <span className="text-slate-500">زمان نوبت:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{formatDateTime(app.dateTime)}</div>
                </div>
                <div>
                  <span className="text-slate-500">نوع نوبت:</span>
                  <div className="mt-0.5">
                    {app.branchId === 'ONLINE' ? (
                      <span className="inline-flex items-center gap-1 text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        <Video className="w-3 h-3" /> ویزیت آنلاین
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        <Building className="w-3 h-3" /> شعبه {app.branchId === 'TEHRAN' ? 'مرکزی تهران' : 'اصفهان'}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">شماره تماس بیمار:</span>
                  <div className="font-mono text-slate-800 mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {app.patientMobile}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">مدت جلسه استاندارد:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{toPersianDigits(app.durationMinutes)} دقیقه</div>
                </div>
              </div>
            </div>

            {/* Financial Ledger & Insurance Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  ریزحساب مالی و پوشش بیمه
                </h4>
                <button
                  type="button"
                  onClick={() => onOpenInsuranceModal(app)}
                  className="text-teal-700 hover:text-teal-800 font-bold flex items-center gap-1 text-[11px]"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  ویرایش سهم بیمه
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">تعرفه آزاد خدمت:</span>
                  <span className="font-bold text-slate-900">{formatToman(app.freePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">سهم بیمه پایه:</span>
                  <span className="font-semibold text-slate-700">{formatToman(app.baseInsuranceCoverage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">سهم بیمه تکمیلی:</span>
                  <span className="font-semibold text-slate-700">{formatToman(app.suppInsuranceCoverage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ پرداختی اولیه بیمار در درگاه:</span>
                  <span className="font-bold text-teal-700">{formatToman(app.initialPatientPaid)}</span>
                </div>
                {app.revisedPatientDue !== undefined && app.revisedPatientDue !== app.initialPatientPaid && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">سهم بازنگری‌شده بیمار:</span>
                    <span className="font-bold text-slate-900">{formatToman(app.revisedPatientDue)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">وضعیت مانده نهایی:</span>
                  <div>
                    {isIndebted ? (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2 py-0.5 rounded text-[11px]">
                        بدهکار: {formatToman(Math.abs(app.debtOrCreditBalance))}
                      </span>
                    ) : isCredited ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                        بستانکار: {formatToman(app.debtOrCreditBalance)}
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                        تسویه کامل
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents Gallery (FLOW-03 Step 2) */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                مدارک و ضمائم بارگذاری‌شدهٔ بیمار ({toPersianDigits(app.documents.length)})
              </h4>

              {app.documents.length === 0 ? (
                <div className="p-5 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 bg-slate-50">
                  هیچ مدرکی برای این نوبت بارگذاری نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {app.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={doc.url}
                          alt={doc.title}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 break-words">{doc.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {formatDateTime(doc.uploadedAt)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onViewDocument(doc)}
                        className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg font-semibold transition shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده و زوم</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical History & Clinical RBAC Compliance (AC-05) */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                پیگیری ویزیت پزشک (رعایت محرمانگی بالینی منشی)
              </h4>

              {app.clinicalNote ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-slate-500 font-medium">دستور پیگیری ویزیت بعد:</span>
                    <div className="mt-1 text-slate-800 bg-white p-3 rounded-lg border border-slate-200 font-medium">
                      {app.clinicalNote.followUp || 'دستور پیگیری خاصی ثبت نشده است.'}
                    </div>
                  </div>

                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-2.5 text-[11px] text-indigo-900 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                    <div>
                      <strong>حریم خصوصی پرونده بالینی:</strong> پذیرش فقط دستور پیگیری را می‌بیند. شرح‌حال، یافته‌های معاینه، تشخیص و نسخهٔ بیمار محرمانه‌اند.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 text-center">
                  ویزیت پزشک هنوز برگزار نشده است یا یادداشت بالینی ثبت نشده است.
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onOpenInsuranceModal(app)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold transition shadow-sm"
            >
              <FileEdit className="w-4 h-4" />
              <span>اصلاح سهم بیمه</span>
            </button>

            {app.isSoftLocked && (
              <button
                type="button"
                onClick={() => onOpenEmergencyUnlock(app)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold transition shadow-sm"
              >
                <Unlock className="w-4 h-4" />
                <span>بازگشایی اضطراری قفل</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
