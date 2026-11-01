import type { Appointment, Role } from '@/shared/types';

/** Keep resource authorization ahead of every room render, including live data changes. */
export function canOpenConsultation(appointment: Appointment, role: Role, userId: string) {
  if (role === 'PATIENT') return appointment.patientId === userId && appointment.branchId === 'ONLINE' && appointment.status === 'CONFIRMED' && !appointment.isSoftLocked;
  // Preserve the existing legacy unassigned-doctor appointments, never another doctor's ID.
  return role === 'DOCTOR' && appointment.branchId === 'ONLINE' && (!appointment.doctorId || appointment.doctorId === userId);
}
