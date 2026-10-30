import React, { useState } from 'react';
import { scheduleRepository } from '@/mocks/repositories/scheduleRepository';
import { DoctorLeave } from '@/shared/types';
import { Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface DoctorLeaveRequestModalProps {
  doctorId: string;
  doctorName: string;
  onClose: () => void;
  onRequestSubmitted: (leave: DoctorLeave) => void;
}

export const DoctorLeaveRequestModal: React.FC<DoctorLeaveRequestModalProps> = ({
  doctorId,
  doctorName,
  onClose,
  onRequestSubmitted,
}) => {
  const [startDate, setStartDate] = useState('2026-11-08');
  const [endDate, setEndDate] = useState('2026-11-09');
  const [reason, setReason] = useState('مرخصی شخصی جهت حضور در همایش علمی');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      alert('لطفاً تمامی فیلدهای الزامی را تکمیل کنید.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = scheduleRepository.requestLeave({
        doctorId,
        doctorName,
        startDate,
        endDate,
        reason: reason.trim(),
      });
      setSuccess(true);
      onRequestSubmitted(created);
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت درخواست مرخصی');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 id="leave-modal-title" className="font-bold text-slate-900 text-base">
                ثبت درخواست مرخصی / تغییر شیفت
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                پزشک: {doctorName} • ارسال جهت تأیید منشی ارشد/ادمین
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

        {success ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">درخواست مرخصی با موفقیت ثبت شد</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
              درخواست شما با وضعیت «در انتظار تأیید» در کارتابل منشی ارشد و ادمین قرار گرفت. پس از تأیید، تقویم و نوبت‌ها به‌روزرسانی می‌شوند.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              بستن
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">از تاریخ (شروع):</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">تا تاریخ (پایان):</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">علت مرخصی / توضیحات:</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="توضیح دلیل مرخصی یا درخواست جابجایی شیفت..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs leading-relaxed"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>قانون تقویم کلینیک (S17)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-700">
                در صورت وجود نوبت‌های قبلی در این بازه، منشی پس از تأیید مرخصی نوبت‌های متأثر را به نزدیک‌ترین ظرفیت خالی جابجا کرده یا با استرداد ۱۰۰٪ وجه لغو می‌نماید.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm text-xs"
              >
                ارسال درخواست به منشی
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition text-xs"
              >
                انصراف
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
