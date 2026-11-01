import React from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { BookingWizardHeader } from './BookingWizardHeader';
import { Step1BranchService } from './Step1BranchService';
import { Step2DoctorCalendar } from './Step2DoctorCalendar';
import { Step3InsuranceDocuments } from './Step3InsuranceDocuments';
import { Step4Summary } from './Step4Summary';

export const BookingWizard: React.FC = () => {
  const { step, setStep } = useBookingStore();

  const handleStepClick = (targetStep: 1 | 2 | 3 | 4) => {
    setStep(targetStep);
  };

  return (
    <div className="booking-panel bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
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
