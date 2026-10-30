import { memoryDb } from '../db/memoryDb';
import { walletRepository } from './walletRepository';
import { Appointment, AppointmentStatus, BranchId, ClinicalNote, UserRole } from '@/shared/types';

export interface AppointmentFilters {
  branchId?: BranchId;
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
}

export const appointmentRepository = {
  getAll(filters?: AppointmentFilters): Appointment[] {
    let list = memoryDb.getAll('appointments');

    if (filters?.branchId && filters.branchId !== 'ONLINE') {
      list = list.filter((a) => a.branchId === filters.branchId);
    } else if (filters?.branchId === 'ONLINE') {
      list = list.filter((a) => a.branchId === 'ONLINE');
    }

    if (filters?.doctorId) {
      list = list.filter((a) => a.doctorId === filters.doctorId);
    }

    if (filters?.patientId) {
      list = list.filter((a) => a.patientId === filters.patientId);
    }

    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }

    return list;
  },

  getById(id: string): Appointment | undefined {
    return memoryDb.getById('appointments', id);
  },

  create(appointment: Appointment): Appointment {
    return memoryDb.insert('appointments', appointment);
  },

  update(id: string, partial: Partial<Appointment>): Appointment {
    return memoryDb.update('appointments', id, {
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Secretary Manual Insurance Correction (Freeze Window Rule - FLOW-03 / AC-03)
   * Calculates delta and updates wallet + soft lock accordingly.
   */
  correctInsurance(
    appointmentId: string,
    newBaseCoverage: number,
    newSuppCoverage: number,
    correctedBy: string,
    secretaryRole: UserRole = 'SECRETARY_TEHRAN'
  ): { appointment: Appointment; delta: number } {
    const app = this.getById(appointmentId);
    if (!app) throw new Error(`Appointment ${appointmentId} not found`);

    // New calculated patient share
    const newPatientDue = Math.max(0, app.freePrice - newBaseCoverage - newSuppCoverage);
    const delta = app.initialPatientPaid - newPatientDue; // Positive = credit to patient, Negative = debit from patient

    const isIndebted = delta < 0;
    const isSoftLocked = app.branchId === 'ONLINE' && isIndebted && !app.emergencyUnlocked;

    const updated = memoryDb.update('appointments', appointmentId, {
      baseInsuranceCoverage: newBaseCoverage,
      suppInsuranceCoverage: newSuppCoverage,
      revisedPatientDue: newPatientDue,
      debtOrCreditBalance: delta,
      financialStatus: isIndebted ? 'DEBIT' : delta > 0 ? 'CREDIT' : 'SETTLED',
      isSoftLocked: isSoftLocked,
      updatedAt: new Date().toISOString(),
    });

    // Adjust patient wallet with net delta
    const previousDelta = app.debtOrCreditBalance || 0;
    const walletDelta = delta - previousDelta;
    if (walletDelta !== 0) {
      walletRepository.adjustBalance(
        app.patientId,
        walletDelta,
        `مابه‌التفاوت اصلاح سهم بیمه نوبت ${app.trackingCode}`
      );
    }

    // Record audit log
    memoryDb.insert('auditLogs', {
      id: `log-${Date.now()}`,
      actorRole: secretaryRole,
      actorName: correctedBy,
      action: 'INSURANCE_CORRECTION',
      details: `اصلاح بیمه نوبت ${app.trackingCode}: سهم جدید پایه ${newBaseCoverage.toLocaleString('fa-IR')} و تکمیلی ${newSuppCoverage.toLocaleString('fa-IR')} | دلتا: ${delta.toLocaleString('fa-IR')} تومان`,
      timestamp: new Date().toISOString(),
    });

    return { appointment: updated, delta };
  },

  /**
   * Secretary Emergency Unlock for soft-locked teleconsultations (AC-04)
   * Mandatory reason logged into audit trail.
   */
  emergencyUnlock(
    appointmentId: string,
    reason: string,
    unlockedBy: string,
    secretaryRole: UserRole = 'SECRETARY_TEHRAN'
  ): Appointment {
    const app = this.getById(appointmentId);
    if (!app) throw new Error(`Appointment ${appointmentId} not found`);

    const updated = memoryDb.update('appointments', appointmentId, {
      isSoftLocked: false,
      emergencyUnlocked: true,
      emergencyUnlockReason: reason,
      emergencyUnlockedBy: unlockedBy,
      emergencyUnlockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    memoryDb.insert('auditLogs', {
      id: `log-${Date.now()}`,
      actorRole: secretaryRole,
      actorName: unlockedBy,
      action: 'EMERGENCY_UNLOCK',
      details: `بازگشایی اضطراری قفل ورود نوبت ${app.trackingCode} به دلیل: «${reason}»`,
      timestamp: new Date().toISOString(),
    });

    return updated;
  },

  /**
   * Settle patient outstanding debt online (Patient Portal AC-03 resolution)
   */
  settleDebt(appointmentId: string): Appointment {
    const app = this.getById(appointmentId);
    if (!app) throw new Error(`Appointment ${appointmentId} not found`);

    const debt = Math.abs(app.debtOrCreditBalance);
    const updated = memoryDb.update('appointments', appointmentId, {
      debtOrCreditBalance: 0,
      financialStatus: 'SETTLED',
      isSoftLocked: false,
      updatedAt: new Date().toISOString(),
    });

    if (debt > 0) {
      walletRepository.adjustBalance(
        app.patientId,
        debt,
        `تسویه آنلاین مابه‌التفاوت بدهی نوبت ${app.trackingCode}`
      );
    }

    memoryDb.insert('auditLogs', {
      id: `log-${Date.now()}`,
      actorRole: 'PATIENT',
      actorName: app.patientName,
      action: 'PAYMENT',
      details: `تسویه آنلاین بدهی نوبت ${app.trackingCode} به مبلغ ${debt.toLocaleString('fa-IR')} تومان`,
      timestamp: new Date().toISOString(),
    });

    return updated;
  },

  /**
   * Save 5-Field Clinical Notes (FLOW-04)
   */
  saveClinicalNote(
    appointmentId: string,
    doctorId: string,
    noteData: Omit<ClinicalNote, 'id' | 'appointmentId' | 'doctorId' | 'patientId' | 'savedAt'>
  ): ClinicalNote {
    const app = this.getById(appointmentId);
    if (!app) throw new Error(`Appointment ${appointmentId} not found`);

    const fullNote: ClinicalNote = {
      id: `cn-${Date.now()}`,
      appointmentId,
      doctorId,
      patientId: app.patientId,
      ...noteData,
      savedAt: new Date().toISOString(),
    };

    memoryDb.update('appointments', appointmentId, {
      clinicalNote: fullNote,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    });

    return fullNote;
  },
};
