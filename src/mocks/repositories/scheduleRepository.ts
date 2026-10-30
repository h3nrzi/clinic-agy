import { memoryDb } from '../db/memoryDb';
import { DoctorShift, DoctorLeave, LeaveStatus, BranchId, Appointment, UserRole } from '@/shared/types';
import { appointmentRepository } from './appointmentRepository';

export interface ShiftFilters {
  doctorId?: string;
  branchId?: BranchId;
  dayOfWeek?: number;
}

export interface LeaveFilters {
  doctorId?: string;
  status?: LeaveStatus;
}

export const scheduleRepository = {
  // --- Shifts Management ---
  getShifts(filters?: ShiftFilters): DoctorShift[] {
    let list = memoryDb.getAll('doctorShifts');

    if (filters?.doctorId) {
      list = list.filter((s) => s.doctorId === filters.doctorId);
    }
    if (filters?.branchId) {
      list = list.filter((s) => s.branchId === filters.branchId);
    }
    if (filters?.dayOfWeek !== undefined) {
      list = list.filter((s) => s.dayOfWeek === filters.dayOfWeek);
    }

    return list;
  },

  getShiftById(id: string): DoctorShift | undefined {
    return memoryDb.getById('doctorShifts', id);
  },

  addShift(shiftData: Omit<DoctorShift, 'id'>): DoctorShift {
    // Conflict Prevention Rule (PRD 9.3):
    // System does not allow a doctor to have two overlapping shifts on the same day
    const existing = this.getShifts({
      doctorId: shiftData.doctorId,
      dayOfWeek: shiftData.dayOfWeek,
    });

    const hasConflict = existing.some((s) => s.isActive);
    if (hasConflict) {
      throw new Error(`تداخل شیفت: پزشک در روز ${shiftData.dayName} دارای شیفت فعال دیگری است.`);
    }

    const newShift: DoctorShift = {
      id: `shift-${Date.now()}`,
      ...shiftData,
    };

    return memoryDb.insert('doctorShifts', newShift);
  },

  updateShift(id: string, partial: Partial<DoctorShift>): DoctorShift {
    return memoryDb.update('doctorShifts', id, partial);
  },

  deleteShift(id: string): boolean {
    return memoryDb.delete('doctorShifts', id);
  },

  // --- Leaves Management ---
  getLeaves(filters?: LeaveFilters): DoctorLeave[] {
    let list = memoryDb.getAll('doctorLeaves');

    if (filters?.doctorId) {
      list = list.filter((l) => l.doctorId === filters.doctorId);
    }
    if (filters?.status) {
      list = list.filter((l) => l.status === filters.status);
    }

    // Sort descending by requested date
    return [...list].sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  },

  getLeaveById(id: string): DoctorLeave | undefined {
    return memoryDb.getById('doctorLeaves', id);
  },

  requestLeave(leaveData: Omit<DoctorLeave, 'id' | 'status' | 'requestedAt'>): DoctorLeave {
    // Calculate affected appointments
    const allApps = appointmentRepository.getAll({ doctorId: leaveData.doctorId });
    const startTs = new Date(leaveData.startDate).setHours(0, 0, 0, 0);
    const endTs = new Date(leaveData.endDate).setHours(23, 59, 59, 999);

    const affected = allApps.filter((a) => {
      if (a.status !== 'CONFIRMED') return false;
      const appTs = new Date(a.dateTime).getTime();
      return appTs >= startTs && appTs <= endTs;
    });

    const newLeave: DoctorLeave = {
      id: `leave-${Date.now()}`,
      ...leaveData,
      status: 'PENDING_APPROVAL',
      requestedAt: new Date().toISOString(),
      affectedAppointmentsCount: affected.length,
    };

    memoryDb.insert('doctorLeaves', newLeave);

    // Audit log
    memoryDb.insert('auditLogs', {
      id: `log-${Date.now()}`,
      actorRole: 'DOCTOR',
      actorName: leaveData.doctorName,
      action: 'LEAVE_REQUESTED',
      details: `درخواست مرخصی از ${leaveData.startDate} تا ${leaveData.endDate} به دلیل: «${leaveData.reason}» (${affected.length} نوبت متأثر)`,
      timestamp: new Date().toISOString(),
    });

    return newLeave;
  },

  getAffectedAppointmentsForLeave(leaveId: string): Appointment[] {
    const leave = this.getLeaveById(leaveId);
    if (!leave) return [];

    const allApps = appointmentRepository.getAll({ doctorId: leave.doctorId });
    const startTs = new Date(leave.startDate).setHours(0, 0, 0, 0);
    const endTs = new Date(leave.endDate).setHours(23, 59, 59, 999);

    return allApps.filter((a) => {
      if (a.status !== 'CONFIRMED') return false;
      const appTs = new Date(a.dateTime).getTime();
      return appTs >= startTs && appTs <= endTs;
    });
  },

  reviewLeave(
    leaveId: string,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    reviewerRole: UserRole = 'SECRETARY_TEHRAN',
    reviewComment?: string
  ): DoctorLeave {
    const leave = this.getLeaveById(leaveId);
    if (!leave) throw new Error(`Leave ${leaveId} not found`);

    const updated = memoryDb.update('doctorLeaves', leaveId, {
      status,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewComment,
    });

    // Audit log
    memoryDb.insert('auditLogs', {
      id: `log-${Date.now()}`,
      actorRole: reviewerRole,
      actorName: reviewedBy,
      action: status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      details: `${status === 'APPROVED' ? 'تأیید' : 'رد'} مرخصی ${leave.doctorName} (${leave.startDate} تا ${leave.endDate})${reviewComment ? ` با توضیح: «${reviewComment}»` : ''}`,
      timestamp: new Date().toISOString(),
    });

    return updated;
  },

  cancelAffectedAppointmentsForLeave(
    leaveId: string,
    reviewedBy: string,
    reviewerRole: UserRole = 'SECRETARY_TEHRAN'
  ): number {
    const affected = this.getAffectedAppointmentsForLeave(leaveId);
    let count = 0;

    for (const app of affected) {
      appointmentRepository.cancelAppointment(app.id, 'CLINIC');
      count++;
    }

    if (count > 0) {
      memoryDb.insert('auditLogs', {
        id: `log-${Date.now()}`,
        actorRole: reviewerRole,
        actorName: reviewedBy,
        action: 'LEAVE_APPOINTMENTS_CANCELLED',
        details: `لغو خودکار ${count} نوبت متأثر از مرخصی توسط کلینیک با استرداد ۱۰۰٪ وجه`,
        timestamp: new Date().toISOString(),
      });
    }

    return count;
  },
};
