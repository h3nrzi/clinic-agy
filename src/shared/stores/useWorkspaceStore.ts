import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import type { Role } from '@/shared/types';
export const WORKSPACE_LINKS: Record<Role, {id:string; label:string}[]> = {
  PATIENT:[{id:'MY_APPOINTMENTS',label:'نوبت‌ها و پرونده من'},{id:'NEW_BOOKING',label:'رزرو نوبت جدید'}],
  DOCTOR:[{id:'APPOINTMENTS',label:'کارتابل نوبت‌ها'},{id:'SHIFTS_AND_LEAVES',label:'شیفت‌ها و مرخصی'}],
  SECRETARY_TEHRAN:[{id:'APPOINTMENTS',label:'میز پذیرش'},{id:'DOCTOR_LEAVES',label:'درخواست‌های مرخصی'}],
  SECRETARY_ISFAHAN:[{id:'APPOINTMENTS',label:'میز پذیرش'},{id:'DOCTOR_LEAVES',label:'درخواست‌های مرخصی'}],
  ADMIN_FINANCE:[{id:'FINANCE',label:'نمای کلی و امور مالی'},{id:'TARIFF_EXCEL',label:'تعرفه‌ها و بیمه'},{id:'SHIFTS',label:'تقویم شیفت‌ها'},{id:'SETTINGS',label:'تنظیمات مالی'}],
};
const useWorkspaceStore = create<{sections:Partial<Record<Role,string>>; setSection:(role:Role,id:string)=>void}>(set=>({
  sections:{}, setSection:(role,id)=>set(state=>({sections:{...state.sections,[role]:id}})),
}));
export function useWorkspaceSection<T extends string>(fallback:T):[T,(value:T)=>void] {
  const role = useAuthStore(s=>s.currentRole);
  const value = useWorkspaceStore(s=>s.sections[role]);
  const set = useWorkspaceStore(s=>s.setSection);
  return [(value || fallback) as T, (id:T)=>set(role,id)];
}
// Demo role changes start at that role's overview, matching the existing workspace lifecycle.
useAuthStore.subscribe((state, previous)=>{
  if(state.currentRole!==previous.currentRole) useWorkspaceStore.getState().setSection(state.currentRole, WORKSPACE_LINKS[state.currentRole][0].id);
});
