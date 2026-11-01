import { create } from "zustand";
import { Role, BranchId } from "@/shared/types";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  roleTitle: string;
  nationalCode?: string;
  mobile: string;
  branchId?: BranchId;
  branchName?: string;
  avatar: string;
}

export const ROLE_PROFILES: Record<Role, AuthUser> = {
  PATIENT: {
    id: "pat-1",
    name: "علی رضایی",
    role: "PATIENT",
    roleTitle: "بیمار (کاربر عمومی)",
    nationalCode: "۰۰۱۲۳۴۵۶۷۸",
    mobile: "۰۹۱۲۱۱۱۲۲۳۳",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120",
  },
  SECRETARY_TEHRAN: {
    id: "sec-tehran-1",
    name: "مریم کریمی",
    role: "SECRETARY_TEHRAN",
    roleTitle: "منشی شعبه مرکزی تهران",
    mobile: "۰۹۱۲۹۹۹۸۸۷۷",
    branchId: "TEHRAN",
    branchName: "شعبه مرکزی تهران",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
  },
  SECRETARY_ISFAHAN: {
    id: "sec-isfahan-1",
    name: "نسیم صادقی",
    role: "SECRETARY_ISFAHAN",
    roleTitle: "منشی شعبه شمس‌آبادی اصفهان",
    mobile: "۰۹۱۳۲۲۲۳۳۴۴",
    branchId: "ISFAHAN",
    branchName: "شعبه شمس‌آبادی اصفهان",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120",
  },
  DOCTOR: {
    id: "doc-1",
    name: "دکتر مریم احمدی",
    role: "DOCTOR",
    roleTitle: "پزشک متخصص داخلی و غدد",
    mobile: "۰۹۱۲۴۴۴۵۵۶۶",
    branchId: "ONLINE",
    branchName: "شعبه تهران و ویزیت آنلاین",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120",
  },
  ADMIN_FINANCE: {
    id: "admin-1",
    name: "مهندس توکلی",
    role: "ADMIN_FINANCE",
    roleTitle: "مدیر سیستم و ناظر مالی",
    mobile: "۰۹۱۲۷۷۷۸۸۹۹",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
  },
};

/** Additional patient identity is activated only by the patient-only demo scenario. */
export const INDEBTED_PATIENT_PROFILE: AuthUser = {
  id: 'pat-3', name: 'مهدی سعیدی (سناریوی بدهکار)', role: 'PATIENT',
  roleTitle: 'بیمار دارای بدهی و قفل نرم', nationalCode: '۰۰۳۴۵۶۷۸۹۰',
  mobile: '۰۹۱۲۵۵۵۶۶۷۷',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
};

const SESSION_KEY = "agy-demo-session-v1";

interface AuthState {
  currentRole: Role;
  currentUser: AuthUser;
  isLoggedIn: boolean;
  switchRole: (role: Role) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}
function saveSession(user: AuthUser) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ accountId: user.id }));
  } catch {
    /* The session remains usable when browser storage is unavailable. */
  }
}
export const useAuthStore = create<AuthState>((set) => ({
  currentRole: "PATIENT",
  currentUser: ROLE_PROFILES.PATIENT,
  isLoggedIn: false,
  switchRole: (role: Role) => {
    const user = ROLE_PROFILES[role];
    saveSession(user);
    set({ currentRole: role, currentUser: user, isLoggedIn: true });
  },
  setUser: (user: AuthUser) => {
    saveSession(user);
    set({ currentUser: user, currentRole: user.role, isLoggedIn: true });
  },
  logout: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* No stored session to remove. */
    }
    set({
      currentUser: ROLE_PROFILES.PATIENT,
      currentRole: "PATIENT",
      isLoggedIn: false,
    });
  },
}));

/** Called when a new application router boots, including a refresh of this tab. */
export function restoreDemoSession() {
  let user: AuthUser | undefined;
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    user = [...Object.values(ROLE_PROFILES), INDEBTED_PATIENT_PROFILE].find(
      (profile) => profile.id === saved?.accountId,
    );
  } catch {
    /* Invalid or unavailable storage starts as a guest. */
  }
  useAuthStore.setState({
    currentUser: user || ROLE_PROFILES.PATIENT,
    currentRole: user?.role || "PATIENT",
    isLoggedIn: !!user,
  });
}
