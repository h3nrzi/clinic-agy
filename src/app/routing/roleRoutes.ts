import type { Role } from "@/shared/types";
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { canOpenConsultation } from './consultationAccess';
export const DEMO_ACCOUNTS: { role: Role; label: string; path: string }[] = [
  { role: "PATIENT", label: "بیمار", path: "/patient" },
  { role: "SECRETARY_TEHRAN", label: "منشی تهران", path: "/secretary/tehran" },
  {
    role: "SECRETARY_ISFAHAN",
    label: "منشی اصفهان",
    path: "/secretary/isfahan",
  },
  { role: "DOCTOR", label: "پزشک", path: "/doctor" },
  { role: "ADMIN_FINANCE", label: "مدیر مالی", path: "/finance" },
];
export function dashboardPath(role: Role) {
  return DEMO_ACCOUNTS.find((account) => account.role === role)!.path;
}
export type WorkspaceDestination = { path: string; label: string };
export const WORKSPACE_LINKS: Record<Role, WorkspaceDestination[]> = {
  PATIENT: [{ path: '/patient', label: 'نوبت‌ها و پرونده من' }, { path: '/patient/booking', label: 'رزرو نوبت جدید' }],
  DOCTOR: [{ path: '/doctor', label: 'کارتابل نوبت‌ها' }, { path: '/doctor/shifts', label: 'شیفت‌ها و مرخصی' }],
  SECRETARY_TEHRAN: [{ path: '/secretary/tehran', label: 'میز پذیرش' }, { path: '/secretary/tehran/leaves', label: 'درخواست‌های مرخصی' }],
  SECRETARY_ISFAHAN: [{ path: '/secretary/isfahan', label: 'میز پذیرش' }, { path: '/secretary/isfahan/leaves', label: 'درخواست‌های مرخصی' }],
  ADMIN_FINANCE: [{ path: '/finance', label: 'نمای کلی و امور مالی' }, { path: '/finance/tariffs', label: 'تعرفه‌ها و بیمه' }, { path: '/finance/shifts', label: 'تقویم شیفت‌ها' }, { path: '/finance/settings', label: 'تنظیمات مالی' }],
};
/** Resume only a known internal destination authorized for this exact account role. */
export function permittedReturnPath(destination: unknown, role: Role) {
  if (typeof destination !== 'string') return dashboardPath(role);
  if (WORKSPACE_LINKS[role].some(link => link.path === destination)) return destination;
  const room = destination.match(/^\/(patient|doctor)\/consultations\/([^/?#]+)$/);
  if (room && ((role === 'PATIENT' && room[1] === 'patient') || (role === 'DOCTOR' && room[1] === 'doctor'))) {
    try {
      const appointment = appointmentRepository.getById(decodeURIComponent(room[2]));
      const user = useAuthStore.getState().currentUser;
      if (appointment && user.role === role && canOpenConsultation(appointment, role, user.id)) return destination;
    } catch { /* Malformed internal resource URL falls back to the account dashboard. */ }
  }
  return dashboardPath(role);
}
