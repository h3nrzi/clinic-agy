import React from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { BookingWizardHeader } from './BookingWizardHeader';
import { Step1BranchService } from './Step1BranchService';
import { Step2DoctorCalendar } from './Step2DoctorCalendar';
import { Step3InsuranceDocuments } from './Step3InsuranceDocuments';
import { Step4Summary } from './Step4Summary';
import { X } from 'lucide-react';

interface Props {
  onCancel?: () => void;
}

export const BookingWizard: React.FC<Props> = ({ onCancel }) => {
  const { step, setStep } = useBookingStore();

  const handleStepClick = (targetStep: 1 | 2 | 3 | 4) => {
    setStep(targetStep);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute left-4 top-4 z-10 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          aria-label="انصراف از رزرو"
          title="انصراف از رزرو"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <BookingWizardHeader currentStep={step} onStepClick={handleStepClick} />

      <div>
        {step === 1 && <Step1BranchService />}
        {step === 2 && <Step2DoctorCalendar />}
        {step === 3 && <Step3InsuranceDocuments />}
        {step === 4 && <Step4Summary />}
      </div>
    </div>
  );
};
