import React from 'react';
import { BookingStep } from '@/shared/stores/useBookingStore';
import { Check, Clock } from 'lucide-react';

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
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              جریان نماینده (FLOW-02)
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              زمان تقریبی: کمتر از ۳ دقیقه
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">رزرو نوبت آنلاین و محاسبه هوشمند بیمه</h2>
        </div>
      </div>

      {/* Stepper progress indicator */}
      <nav aria-label="مراحل رزرو نوبت" className="grid grid-cols-4 gap-2 sm:gap-4">
        {STEPS.map((s) => {
          const isCompleted = numericStep > s.id;
          const isCurrent = numericStep === s.id;
          const isClickable = isCompleted;

          return (
            <button
              key={s.id}
              type="button"
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
              <span className="text-xs font-medium truncate hidden md:inline">
                {s.title}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
