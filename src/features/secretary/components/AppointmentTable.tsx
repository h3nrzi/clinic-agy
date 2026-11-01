import React from 'react';
import { Appointment } from '@/shared/types';
import { formatToman, formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import {
  Lock,
  Unlock,
  FileEdit,
  Eye,
  Video,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const appointmentStatusLabels: Record<Appointment['status'], string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت', CONFIRMED: 'تأییدشده', IN_CONSULTATION: 'در حال ویزیت',
  COMPLETED: 'انجام‌شده', CANCELLED_BY_PATIENT: 'لغو توسط بیمار', CANCELLED_BY_CLINIC: 'لغو توسط کلینیک',
};

interface AppointmentTableProps {
  appointments: Appointment[];
  onOpenDrawer: (appointment: Appointment) => void;
  onOpenInsuranceModal: (appointment: Appointment) => void;
  onOpenEmergencyUnlock: (appointment: Appointment) => void;
}

export const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  onOpenDrawer,
  onOpenInsuranceModal,
  onOpenEmergencyUnlock,
}) => {
  if (appointments.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-slate-700">هیچ نوبتی با شرایط فیلتر انتخابی یافت نشد</div>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          می‌توانید فیلتر شعبه یا وضعیت مالی را تغییر دهید تا نوبت‌های دیگر نمایش داده شوند.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table aria-label="فهرست نوبت‌های پذیرش" className="reception-table w-full text-right text-xs">
          <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold select-none">
            <tr>
              <th scope="col" className="p-3.5 whitespace-nowrap">کد رهگیری</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">نام بیمار</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">پزشک معالج</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">خدمت درمانی</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">نوع نوبت</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">زمان نوبت</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">پرداختی اولیه</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">وضعیت مالی</th>
              <th scope="col" className="p-3.5 whitespace-nowrap">قفل ویزیت</th>
              <th scope="col" className="p-3.5 whitespace-nowrap text-center">مدارک</th>
              <th scope="col" className="p-3.5 whitespace-nowrap text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((app) => {
              const isIndebted = app.financialStatus === 'DEBIT';
              const isCredited = app.financialStatus === 'CREDIT';

              return (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50/70 transition duration-150 group"
                >
                  {/* Tracking Code */}
                  <td data-label="کد رهگیری" className="p-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenDrawer(app)}
                      className="hover:text-teal-700 hover:underline cursor-pointer"
                      title="مشاهده پرونده"
                    >
                      {app.trackingCode}
                    </button>
                  </td>

                  {/* Patient */}
                  <td data-label="بیمار" className="p-3.5 whitespace-nowrap">
                    <div className="font-bold text-slate-900">{app.patientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{app.patientMobile}</div>
                  </td>

                  {/* Doctor */}
                  <td data-label="پزشک" className="p-3.5 whitespace-nowrap text-slate-800 font-medium">
                    {app.doctorName}
                  </td>

                  {/* Service */}
                  <td data-label="خدمت" className="p-3.5 text-slate-600 max-w-[180px] break-words">
                    {app.serviceName}
                  </td>

                  {/* Branch / Type */}
                  <td data-label="نوع نوبت" className="p-3.5 whitespace-nowrap">
                    {app.branchId === 'ONLINE' ? (
                      <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <Video className="w-3 h-3" /> آنلاین
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        <Building className="w-3 h-3" /> حضوری ({app.branchId === 'TEHRAN' ? 'تهران' : 'اصفهان'})
                      </span>
                    )}
                  </td>

                  {/* Time */}
                  <td data-label="زمان" className="p-3.5 whitespace-nowrap text-slate-600">
                    {formatDateTime(app.dateTime)}
                    <div className="text-slate-700 font-semibold mt-1">{appointmentStatusLabels[app.status]}</div>
                  </td>

                  {/* Initial Paid */}
                  <td data-label="پرداخت اولیه" className="p-3.5 whitespace-nowrap font-bold text-slate-800">
                    {formatToman(app.initialPatientPaid)}
                  </td>

                  {/* Financial Status */}
                  <td data-label="وضعیت مالی" className="p-3.5 whitespace-nowrap">
                    {isIndebted ? (
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        بدهکار ({formatToman(Math.abs(app.debtOrCreditBalance))})
                      </span>
                    ) : isCredited ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px] font-semibold">
                        بستانکار ({formatToman(app.debtOrCreditBalance)})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-slate-500" /> تسویه
                      </span>
                    )}
                  </td>

                  {/* Lock Status */}
                  <td data-label="ورود به ویزیت" className="p-3.5 whitespace-nowrap">
                    {app.isSoftLocked ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                        <Lock className="w-3 h-3" /> قفل نرم فعال
                      </span>
                    ) : app.emergencyUnlocked ? (
                      <span
                        className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]"
                        title={`دلیل: ${app.emergencyUnlockReason}`}
                      >
                        <Unlock className="w-3 h-3" /> بازگشایی اضطراری
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <Unlock className="w-3 h-3" /> باز
                      </span>
                    )}
                  </td>

                  {/* Documents count */}
                  <td data-label="مدارک" className="p-3.5 whitespace-nowrap text-center">
                    {app.documents.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenDrawer(app)}
                        className="inline-flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-semibold transition"
                      >
                        <FileText className="w-3 h-3" />
                        <span>{toPersianDigits(app.documents.length)} مدرک</span>
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[11px]">-</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td data-label="عملیات" className="p-3.5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenDrawer(app)}
                        aria-label={`مشاهده پرونده و مدارک ${app.trackingCode}`}
                        title="مشاهده پرونده و مدارک"
                        className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenInsuranceModal(app)}
                        aria-label={`اصلاح سهم بیمه ${app.trackingCode}`}
                        title="اصلاح سهم بیمه"
                        className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                      >
                        <FileEdit className="w-4 h-4" />
                      </button>

                      {app.isSoftLocked && (
                        <button
                          type="button"
                          onClick={() => onOpenEmergencyUnlock(app)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-sm"
                        >
                          بازگشایی اضطراری
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
