import { create } from 'zustand';
import { BranchId, MedicalDocument, Appointment } from '@/shared/types';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { calculateInsurance } from '@/features/insurance-engine/logic/calculateInsurance';
import { useAuthStore } from './useAuthStore';

export type BookingStep = 1 | 2 | 3 | 4 | 'GATEWAY' | 'CONFIRMED';

export interface BookingState {
  draftRevision: number;
  pendingDocumentReads: number;
  // Step indicator
  step: BookingStep;

  // Step 1: Branch and Service
  branchId: BranchId | null;
  serviceId: string | null;

  // Step 2: Doctor and Slot
  doctorId: string | null;
  slotDateTime: string | null;
  preselectedSlotDateTime: string | null;

  // Step 3: Insurance and Documents
  baseInsuranceId: string;
  suppInsuranceId: string;
  documents: MedicalDocument[];

  // Step 4 & Gateway
  lastConfirmedAppointment: Appointment | null;
  gatewayError: string | null;
  transactionRef: string | null;

  // Actions
  setStep: (step: BookingStep) => void;
  setBranchId: (branchId: BranchId) => void;
  setServiceId: (serviceId: string) => void;
  setDoctorId: (doctorId: string) => void;
  setSlotDateTime: (dateTime: string) => void;
  setDefaultSlotDateTime: (dateTime: string) => void;
  setBaseInsuranceId: (id: string) => void;
  setSuppInsuranceId: (id: string) => void;
  addDocument: (doc: MedicalDocument) => void;
  startDocumentRead: () => number;
  finishDocumentRead: (revision: number) => boolean;
  removeDocument: (docId: string) => void;
  setGatewayError: (err: string | null) => void;
  
  // Submission
  submitSuccessfulBooking: (paymentRef?: string) => Appointment;
  resetBooking: () => void;
}

const DEFAULT_STATE = {
  step: 1 as BookingStep,
  branchId: 'ONLINE' as BranchId,
  serviceId: 'srv-1',
  doctorId: 'doc-1',
  slotDateTime: null,
  preselectedSlotDateTime: null,
  baseInsuranceId: 'ins-base-tamin',
  suppInsuranceId: 'ins-supp-dana',
  documents: [] as MedicalDocument[],
  pendingDocumentReads: 0,
  lastConfirmedAppointment: null as Appointment | null,
  gatewayError: null as string | null,
  transactionRef: null as string | null,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...DEFAULT_STATE,
  draftRevision: 0,

  setStep: (step) => set({ step, gatewayError: null }),
  setBranchId: (branchId) => {
    // When branch changes, reset doctor and service if not applicable
    const services = tariffRepository.getServices(branchId);
    const firstService = services[0]?.id || 'srv-1';
    const doctors = doctorRepository.getByBranch(branchId);
    const firstDoctor = doctors[0]?.id || 'doc-1';
    set({ branchId, serviceId: firstService, doctorId: firstDoctor, slotDateTime: null });
  },
  setServiceId: (serviceId) => set({ serviceId }),
  setDoctorId: (doctorId) => set({ doctorId, slotDateTime: null }),
  setSlotDateTime: (slotDateTime) => set({ slotDateTime }),
  setDefaultSlotDateTime: (slotDateTime) => set({ slotDateTime, preselectedSlotDateTime: slotDateTime }),
  setBaseInsuranceId: (baseInsuranceId) => set({ baseInsuranceId }),
  setSuppInsuranceId: (suppInsuranceId) => set({ suppInsuranceId }),
  startDocumentRead: () => {
    set(state => ({ pendingDocumentReads: state.pendingDocumentReads + 1 }));
    return get().draftRevision;
  },
  finishDocumentRead: (revision) => {
    if (get().draftRevision !== revision) return false;
    set(state => ({ pendingDocumentReads: Math.max(0, state.pendingDocumentReads - 1) }));
    return true;
  },
  addDocument: (doc) => set((state) => ({ documents: [...state.documents, doc] })),
  removeDocument: (docId) =>
    set((state) => ({ documents: state.documents.filter((d) => d.id !== docId) })),
  setGatewayError: (gatewayError) => set({ gatewayError }),

  submitSuccessfulBooking: (customRef?: string) => {
    const state = get();
    const currentUser = useAuthStore.getState().currentUser;

    const service = tariffRepository.getServiceById(state.serviceId || 'srv-1');
    const doctor = doctorRepository.getById(state.doctorId || 'doc-1');
    const baseIns = tariffRepository.getBaseInsuranceById(state.baseInsuranceId);
    const suppIns = tariffRepository.getSupplementaryInsuranceById(state.suppInsuranceId);

    const freePrice = service?.freePrice || 280000;
    const calc = calculateInsurance(freePrice, baseIns, suppIns);

    // Check patient wallet credit
    const wallet = walletRepository.getByPatientId(currentUser.id);
    const availableCredit = wallet && wallet.balance > 0 ? wallet.balance : 0;
    const creditToApply = Math.min(availableCredit, calc.patientShare);
    const finalPaid = Math.max(0, calc.patientShare - creditToApply);

    // Apply wallet deduction if credit was applied
    if (creditToApply > 0) {
      walletRepository.adjustBalance(
        currentUser.id,
        -creditToApply,
        `کسر بستانکاری بابت رزرو نوبت ${service?.name || ''}`
      );
    }

    const trackingNumber = Math.floor(10000 + Math.random() * 90000);
    const trackingCode = `AGY-${trackingNumber}`;
    const txRef = customRef || `RRN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Default slot if none picked: tomorrow at 10:00 AM
    let appointmentDateTime = state.slotDateTime;
    if (!appointmentDateTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      appointmentDateTime = tomorrow.toISOString();
    }

    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      trackingCode,
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientMobile: currentUser.mobile,
      doctorId: doctor?.id || 'doc-1',
      doctorName: doctor?.name || 'دکتر مریم احمدی',
      serviceId: service?.id || 'srv-1',
      serviceName: service?.name || 'ویزیت تخصصی آنلاین (تله‌مدیسین)',
      branchId: state.branchId || 'ONLINE',
      dateTime: appointmentDateTime,
      durationMinutes: service?.durationMinutes || 15,
      status: 'CONFIRMED',
      financialStatus: 'SETTLED',
      freePrice,
      baseInsuranceCoverage: calc.baseCoverage,
      suppInsuranceCoverage: calc.suppCoverage,
      walletCreditApplied: creditToApply,
      initialPatientPaid: finalPaid,
      revisedPatientDue: finalPaid,
      debtOrCreditBalance: 0,
      isSoftLocked: false,
      emergencyUnlocked: false,
      documents: state.documents,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = appointmentRepository.create(newAppointment);

    set({
      lastConfirmedAppointment: saved,
      step: 'CONFIRMED',
      gatewayError: null,
      transactionRef: txRef,
    });

    return saved;
  },

  resetBooking: () => {
    set({
      ...DEFAULT_STATE,
      draftRevision: get().draftRevision + 1,
      slotDateTime: null,
      documents: [],
      lastConfirmedAppointment: null,
      gatewayError: null,
      transactionRef: null,
    });
  },
}));

// Booking inputs and confirmations belong to one account, never the next login/scenario.
useAuthStore.subscribe((state, previous) => {
  if (state.currentUser.id !== previous.currentUser.id || (!state.isLoggedIn && previous.isLoggedIn)) {
    useBookingStore.getState().resetBooking();
  }
});
