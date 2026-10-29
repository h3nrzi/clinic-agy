import { create } from 'zustand';
import { Role, BranchId } from '@/shared/types';

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
    id: 'pat-1',
    name: 'علی رضایی',
    role: 'PATIENT',
    roleTitle: 'بیمار (کاربر عمومی)',
    nationalCode: '۰۰۱۲۳۴۵۶۷۸',
    mobile: '۰۹۱۲۱۱۱۲۲۳۳',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
  },
  SECRETARY_TEHRAN: {
    id: 'sec-tehran-1',
    name: 'مریم کریمی',
    role: 'SECRETARY_TEHRAN',
    roleTitle: 'منشی شعبه مرکزی تهران',
    mobile: '۰۹۱۲۹۹۹۸۸۷۷',
    branchId: 'TEHRAN',
    branchName: 'شعبه مرکزی تهران',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120',
  },
  SECRETARY_ISFAHAN: {
    id: 'sec-isfahan-1',
    name: 'نسیم صادقی',
    role: 'SECRETARY_ISFAHAN',
    roleTitle: 'منشی شعبه شمس‌آبادی اصفهان',
    mobile: '۰۹۱۳۲۲۲۳۳۴۴',
    branchId: 'ISFAHAN',
    branchName: 'شعبه شمس‌آبادی اصفهان',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120',
  },
  DOCTOR: {
    id: 'doc-1',
    name: 'دکتر مریم احمدی',
    role: 'DOCTOR',
    roleTitle: 'پزشک متخصص داخلی و غدد',
    mobile: '۰۹۱۲۴۴۴۵۵۶۶',
    branchId: 'ONLINE',
    branchName: 'شعبه تهران و ویزیت آنلاین',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120',
  },
  ADMIN_FINANCE: {
    id: 'admin-1',
    name: 'مهندس توکلی',
    role: 'ADMIN_FINANCE',
    roleTitle: 'مدیر سیستم و ناظر مالی',
    mobile: '۰۹۱۲۷۷۷۸۸۹۹',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
  },
};

interface AuthState {
  currentRole: Role;
  currentUser: AuthUser;
  isLoggedIn: boolean;
  switchRole: (role: Role) => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'PATIENT',
  currentUser: ROLE_PROFILES.PATIENT,
  isLoggedIn: true,
  switchRole: (role: Role) => {
    const user = ROLE_PROFILES[role];
    set({
      currentRole: role,
      currentUser: user,
    });
  },
  setUser: (user: AuthUser) => {
    set({
      currentUser: user,
      currentRole: user.role,
    });
  },
}));
