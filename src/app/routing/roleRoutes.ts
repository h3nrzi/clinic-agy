import type { Role } from "@/shared/types";
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
/** Only exact, known and role-authorized internal destinations can be resumed. */
export function permittedReturnPath(destination: unknown, role: Role) {
  return typeof destination === "string" && destination === dashboardPath(role)
    ? destination
    : dashboardPath(role);
}
