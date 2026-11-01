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
    <div className="booking-panel bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="booking-cancel px-4 py-2"
          aria-label="انصراف از رزرو"
          title="انصراف از رزرو"
        >
          <X className="w-5 h-5" aria-hidden="true" /><span>انصراف از رزرو</span>
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
