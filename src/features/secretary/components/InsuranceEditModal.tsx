import { useDialogFocus } from '@/shared/hooks/useDialogFocus';
import React, { useState, useEffect } from 'react';
import { Appointment } from '@/shared/types';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import {
  FileEdit,
  X,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

interface InsuranceEditModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InsuranceEditModal: React.FC<InsuranceEditModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dialogRef = useDialogFocus(onClose, isOpen && !!appointment);
  const { currentUser, currentRole } = useAuthStore();

  const [baseCoverage, setBaseCoverage] = useState<number>(0);
  const [suppCoverage, setSuppCoverage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (appointment) {
      setBaseCoverage(appointment.baseInsuranceCoverage || 0);
      setSuppCoverage(appointment.suppInsuranceCoverage || 0);
      setError(null);
      setIsSuccess(false);
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const freePrice = appointment.freePrice;
  const initialPaid = appointment.initialPatientPaid;

  // Real-time calculated revised patient share and Delta (FLOW-03 / AC-03)
  const revisedPatientDue = Math.max(0, freePrice - baseCoverage - suppCoverage);
  const delta = initialPaid - revisedPatientDue; // Positive = credit to patient, Negative = debit from patient
  const isIndebted = delta < 0;
  const isCredited = delta > 0;
  const willSoftLock = appointment.branchId === 'ONLINE' && isIndebted && !appointment.emergencyUnlocked;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (baseCoverage < 0 || suppCoverage < 0) {
      setError('سهم بیمه نمی‌تواند مقداری منفی باشد.');
      return;
    }
    if (baseCoverage + suppCoverage > freePrice) {
      setError('مجموع تعهد بیمه پایه و تکمیلی نمی‌تواند از تعرفهٔ آزاد خدمت بیشتر باشد.');
      return;
    }

    try {
      appointmentRepository.correctInsurance(
        appointment.id,
        baseCoverage,
        suppCoverage,
        currentUser.name,
        currentRole
      );
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در ثبت اصلاح بیمه';
      setError(message);
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="insurance-modal-title"
      className="reception-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 id="insurance-modal-title" className="text-sm font-bold text-slate-900">
                اصلاح دستی سهم بیمه
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                <span>نوبت: {appointment.trackingCode}</span> • <span>بیمار: {appointment.patientName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن اصلاح سهم بیمه"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Appointment Baseline Info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">خدمت درمانی:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{appointment.serviceName}</div>
            </div>
            <div>
              <span className="text-slate-500">تعرفه مصوب آزاد:</span>
              <div className="font-bold text-slate-900 mt-0.5">{formatToman(freePrice)}</div>
            </div>
            <div>
              <span className="text-slate-500">مبلغ پرداختی اولیه بیمار:</span>
              <div className="font-bold text-teal-700 mt-0.5">{formatToman(initialPaid)}</div>
            </div>
            <div>
              <span className="text-slate-500">نوع نوبت:</span>
              <div className="font-semibold text-slate-800 mt-0.5">
                {appointment.branchId === 'ONLINE' ? 'ویزیت آنلاین (مشمول قفل نرم)' : 'حضوری شعبه'}
              </div>
            </div>
          </div>

          {/* Quick Presets for Demo & Testing */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              انتخاب سریع سهم بیمه:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuppCoverage(0);
                  setError(null);
                }}
                className="text-[11px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg transition font-medium"
              >
                ابطال بیمه تکمیلی (سهم ۰)
              </button>

              <button
                type="button"
                onClick={() => {
                  setBaseCoverage(0);
                  setSuppCoverage(0);
                  setError(null);
                }}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg transition font-medium"
              >
                تعرفه آزاد کامل (سهم هر دو ۰)
              </button>

              <button
                type="button"
                onClick={() => {
                  setBaseCoverage(appointment.baseInsuranceCoverage || 0);
                  setSuppCoverage(appointment.suppInsuranceCoverage || 0);
                  setError(null);
                }}
                className="text-[11px] bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> بازنشانی اولیه
              </button>
            </div>
          </div>

          {/* Insurance Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="base-insurance-input" className="block text-xs font-semibold text-slate-700">
                سهم اصلاح‌شده بیمه پایه (تومان):
              </label>
              <input
                id="base-insurance-input"
                type="number"
                min={0}
                max={freePrice}
                step={1000}
                value={baseCoverage}
                onChange={(e) => {
                  setBaseCoverage(Number(e.target.value) || 0);
                  if (error) setError(null);
                }}
                className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900"
              />
              <span className="text-[11px] text-slate-400">
                مقدار جاری: {formatToman(baseCoverage)}
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="supp-insurance-input" className="block text-xs font-semibold text-slate-700">
                سهم اصلاح‌شده بیمه تکمیلی (تومان):
              </label>
              <input
                id="supp-insurance-input"
                type="number"
                min={0}
                max={freePrice}
                step={1000}
                value={suppCoverage}
                onChange={(e) => {
                  setSuppCoverage(Number(e.target.value) || 0);
                  if (error) setError(null);
                }}
                className="w-full text-xs font-mono rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900"
              />
              <span className="text-[11px] text-slate-400">
                مقدار جاری: {formatToman(suppCoverage)}
              </span>
            </div>
          </div>

          {/* Real-time Calculation Card (INT-04 / AC-03) */}
          <div
            className={`rounded-2xl p-4 border transition ${
              isIndebted
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : isCredited
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-teal-600" />
                محاسبه بلادرنگ مابه‌التفاوت سهم بیمار (Δ):
              </span>
              <span className="font-mono text-sm">
                {delta > 0 ? `+${toPersianDigits(delta.toLocaleString('fa-IR'))}` : toPersianDigits(delta.toLocaleString('fa-IR'))} تومان
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">سهم بازنگری‌شده بیمار:</span>
                <div className="font-bold text-slate-900 mt-0.5">{formatToman(revisedPatientDue)}</div>
              </div>
              <div>
                <span className="text-slate-500">وضعیت مانده بیمار:</span>
                <div className="font-bold mt-0.5">
                  {isIndebted ? (
                    <span className="text-rose-600 flex items-center gap-1">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      بدهکار به کلینیک ({formatToman(Math.abs(delta))})
                    </span>
                  ) : isCredited ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      بستانکار ({formatToman(delta)})
                    </span>
                  ) : (
                    <span className="text-slate-600">تسویه کامل (بدون تغییر)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Soft Lock Warning Banner */}
            {willSoftLock && (
              <div className="mt-3 bg-rose-100/90 border border-rose-300 text-rose-800 rounded-xl p-2.5 text-xs flex items-center gap-2 font-medium">
                <Lock className="w-4 h-4 shrink-0 text-rose-700" />
                <span>
                  <strong>هشدار قفل نرم:</strong> این نوبت اینترنتی است؛ با ثبت این بدهکاری، دکمهٔ «ورود به اتاق ویزیت» در پنل بیمار مسدود شده و تا زمان تسویه یا بازگشایی اضطراری قفل می‌ماند.
                </span>
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>اصلاح سهم بیمه با موفقیت ثبت شد و مانده‌حساب بیمار به‌روزرسانی گردید.</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSuccess}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSuccess}
              className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ذخیره و اعمال اصلاحیه</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
