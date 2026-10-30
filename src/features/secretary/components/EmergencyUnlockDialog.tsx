import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
import React, { useState } from 'react';
import { Appointment } from '@/shared/types';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { formatToman } from '@/shared/utils/formatters';
import { AlertTriangle, Unlock, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EmergencyUnlockDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_REASONS = [
  'هماهنگی تلفنی جهت تسویه بدهی در پایان روز',
  'بیمار سالمند / عدم توانایی در پرداخت اینترنتی شاپرک',
  'شرایط حاد بالینی و اورژانسی بیمار به تشخیص پزشک معالج',
  'مشکل موقت درگاه بانکی شاپرک با تایید پذیرش',
];

export const EmergencyUnlockDialog: React.FC<EmergencyUnlockDialogProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dialogRef = useDialogFocus(onClose, isOpen && !!appointment);
  const { currentUser, currentRole } = useAuthStore();
  const [reason, setReason] = useState('هماهنگی تلفنی جهت تسویه بدهی در پایان روز');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !appointment) return null;

  const debtAmount = Math.abs(appointment.debtOrCreditBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('ثبت دلیل توجیهی بازگشایی اضطراری (حداقل ۵ کاراکتر) الزامی است.');
      return;
    }

    try {
      appointmentRepository.emergencyUnlock(
        appointment.id,
        reason.trim(),
        currentUser.name,
        currentRole
      );
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در ثبت بازگشایی اضطراری';
      setError(message);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="emergency-dialog-title" className="text-sm font-bold text-slate-900">
                بازگشایی اضطراری قفل ورود به جلسه
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                توسط منشی پذیرش: <strong>{currentUser.name}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Appointment & Debt Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">نام بیمار:</span>
              <span className="font-bold text-slate-900">{appointment.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">کد رهگیری نوبت:</span>
              <span className="font-mono font-bold text-slate-800">{appointment.trackingCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">مانده بدهی معوق:</span>
              <span className="font-bold text-rose-600">{formatToman(debtAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">نوع نوبت:</span>
              <span className="text-teal-700 font-semibold">ویزیت تصویری آنلاین</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-relaxed">
              <strong>قاعدهٔ حاکمیتی:</strong> با تایید این فرم، قفل نرم ورود به جلسهٔ ویدیویی برای این بیمار فوراً برداشته می‌شود. نام کاربر، زمان دقیق و متن دلیل در تاریخچهٔ ممیزی (Audit Trail) سیستم برای مدیر مالی ثبت خواهد شد.
            </div>
          </div>

          {/* Quick Preset Reasons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              دلایل متداول (کلیک جهت انتخاب سریع):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    setError(null);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    reason === preset
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-medium'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label htmlFor="emergency-reason" className="block text-xs font-semibold text-slate-700">
              متن دلیل بازگشایی اضطراری <span className="text-rose-600">*</span>:
            </label>
            <textarea
              id="emergency-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="لطفاً دلیل موجه بازگشایی قفل برای بیمار بدهکار را شرح دهید..."
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800"
            />
            {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
          </div>

          {/* Success Message */}
          {isSubmitted && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>بازگشایی اضطراری با موفقیت در سیستم ثبت شد و قفل ویزیت بازگردید.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitted}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitted || !reason.trim()}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>تایید و بازگشایی اضطراری</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
