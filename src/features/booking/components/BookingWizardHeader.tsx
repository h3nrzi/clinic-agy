import React from 'react';
import { BookingStep } from '@/shared/stores/useBookingStore';
import { Check } from 'lucide-react';

interface Props {
  currentStep: BookingStep;
  onStepClick: (step: 1 | 2 | 3 | 4) => void;
}

const STEPS = [
  { id: 1 as const, title: 'شعبه و خدمت' },
  { id: 2 as const, title: 'پزشک و زمان' },
  { id: 3 as const, title: 'بیمه و مدارک' },
  { id: 4 as const, title: 'پیش‌فاکتور و تایید' },
];

export const BookingWizardHeader: React.FC<Props> = ({ currentStep, onStepClick }) => {
  const numericStep = typeof currentStep === 'number' ? currentStep : 4;

  return (
    <div className="booking-heading">
      <div><span role="status" className="text-teal-800 font-semibold">رزرو نوبت • مرحله {numericStep} از ۴</span>
        <h2>رزرو نوبت آنلاین و محاسبه هوشمند بیمه</h2>
        <p>شعبه، پزشک و زمان را انتخاب کنید؛ پیش از پرداخت، سهم بیمه و مبلغ نهایی را ببینید. برای ویرایش به مراحل تکمیل‌شده برگردید.</p>
      </div>

      {/* Stepper progress indicator */}
      <nav aria-label="مراحل رزرو نوبت" className="booking-steps">
        {STEPS.map((s) => {
          const isCompleted = numericStep > s.id;
          const isCurrent = numericStep === s.id;
          const isClickable = isCompleted;

          return (
            <button
              key={s.id}
              type="button"
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`${s.title}${isCompleted ? '، تکمیل‌شده' : isCurrent ? '، مرحله جاری' : '، مرحله بعد'}`}
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(s.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-right transition border ${
                isCurrent
                  ? 'bg-teal-50/70 border-teal-400 text-teal-900 shadow-sm'
                  : isCompleted
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer'
                  : 'bg-white border-transparent text-slate-400 opacity-70 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isCurrent
                    ? 'bg-teal-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className="text-xs font-medium">
                {s.title}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
