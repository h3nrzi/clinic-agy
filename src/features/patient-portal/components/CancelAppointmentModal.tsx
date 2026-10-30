import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
import React, { useState } from 'react';
import { Appointment } from '@/shared/types';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { evaluateCancellation } from '../logic/cancellationRules';
import { formatDateTime, formatToman, toPersianDigits } from '@/shared/utils/formatters';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';

interface CancelAppointmentModalProps {
  appointment: Appointment;
  onClose: () => void;
  onCancelled: () => void;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  appointment,
  onClose,
  onCancelled,
}) => {
  const dialogRef = useDialogFocus(onClose);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancellationDone, setCancellationDone] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  // Evaluate cancellation policy in real-time
  const evalResult = evaluateCancellation({
    appointmentTime: appointment.dateTime,
    cancelTime: new Date(),
    cancelledBy: 'PATIENT',
    patientPaidAmount: appointment.initialPatientPaid,
  });

  const handleConfirmCancel = () => {
    setIsSubmitting(true);
    try {
      const res = appointmentRepository.cancelAppointment(appointment.id, 'PATIENT');
      setCancellationDone(true);
      setResultMessage(res.evaluation.message);
    } catch (err: any) {
      setError(err.message || 'خطا در لغو نوبت');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
        {error && <p role="alert" className="bg-rose-50 text-rose-700 p-3 rounded-lg">{error}</p>}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                evalResult.isLateCancellation
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-teal-100 text-teal-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cancel-modal-title" className="font-bold text-slate-900 text-base">
                لغو نوبت و استرداد وجه (قانون مرز ۱۲ ساعت)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                کد رهگیری: <span className="font-mono font-bold">{appointment.trackingCode}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cancellationDone ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">نوبت با موفقیت لغو شد</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">{resultMessage}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-right">
              <div className="flex justify-between text-slate-600">
                <span>مبلغ بازگشتی به کیف پول:</span>
                <strong className="text-emerald-700 font-bold">
                  {formatToman(evalResult.walletCreditAmount)}
                </strong>
              </div>
              {evalResult.penaltyAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>جریمه کسرشده ۵۰٪ کلینیک:</span>
                  <strong className="text-rose-600 font-bold">
                    {formatToman(evalResult.penaltyAmount)}
                  </strong>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onCancelled();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              متوجه شدم و بستن
            </button>
          </div>
        ) : (
          <div className="py-5 space-y-5">
            {/* Appointment Details Box */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-700">
                <span>خدمت:</span>
                <strong>{appointment.serviceName}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>پزشک معالج:</span>
                <strong>{appointment.doctorName}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>زمان نوبت:</span>
                <span className="font-bold text-slate-900">{formatDateTime(appointment.dateTime)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>مبلغ پرداختی اولیه بیمار:</span>
                <strong className="text-indigo-700 font-bold">
                  {formatToman(appointment.initialPatientPaid)}
                </strong>
              </div>
            </div>

            {/* Time Remaining & 12h Policy Evaluation */}
            <div
              className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                evalResult.isLateCancellation
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  فاصله تا زمان ویزیت:{' '}
                  {evalResult.hoursUntilAppointment > 0
                    ? `${toPersianDigits(Math.max(0, evalResult.hoursUntilAppointment).toFixed(1))} ساعت`
                    : 'زمان نوبت سپری شده'}
                </span>
              </div>

              {evalResult.isLateCancellation ? (
                <>
                  <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>مشمول ۵۰٪ جریمهٔ لغو دیرهنگام (فاصله کمتر از ۱۲ ساعت)</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    طبق مصوبهٔ بند ۹.۳ سند مرجع محصول، در صورتی که بیمار کمتر از ۱۲ ساعت مانده به نوبت اقدام به لغو کند، ۵۰٪ مبلغ پرداختی ({formatToman(evalResult.penaltyAmount)}) به‌عنوان جریمه کلینیک کسر شده و ۵۰٪ باقی‌مانده ({formatToman(evalResult.walletCreditAmount)}) به موجودی بستانکاری کیف پول شما واریز خواهد شد.
                  </p>
                </>
              ) : (
                <>
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>لغو رایگان و بدون جریمه (فاصله بیشتر یا مساوی ۱۲ ساعت)</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    با توجه به اینکه بیش از ۱۲ ساعت تا زمان ویزیت باقی مانده است، ۱۰۰٪ مبلغ پرداختی شما معادل {formatToman(evalResult.walletCreditAmount)} بدون هیچ‌گونه جریمه‌ای فوراً به کیف پول شما برگشت داده می‌شود.
                  </p>
                </>
              )}
            </div>

            {/* Refund and Penalty Summary Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">مبلغ برگشتی به کیف پول</span>
                <span className="text-base font-bold text-emerald-600 block mt-1">
                  {formatToman(evalResult.walletCreditAmount)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-slate-500 block text-[11px]">جریمه کلینیک</span>
                <span
                  className={`text-base font-bold block mt-1 ${
                    evalResult.penaltyAmount > 0 ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {formatToman(evalResult.penaltyAmount)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white transition shadow-sm flex items-center justify-center gap-2 ${
                  evalResult.isLateCancellation
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {evalResult.isLateCancellation ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>تأیید لغو با کسر ۵۰٪ جریمه</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأیید لغو و برگشت ۱۰۰٪ وجه</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                انصراف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
