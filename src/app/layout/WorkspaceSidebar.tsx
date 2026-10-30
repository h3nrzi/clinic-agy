import { WORKSPACE_LINKS, useWorkspaceSection } from '@/shared/stores/useWorkspaceStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { useState } from 'react';
import { HeartPulse, LayoutDashboard, ShieldCheck, CalendarDays, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export function WorkspaceSidebar() {
  const [open, setOpen] = useState(false);
  const { currentUser, currentRole } = useAuthStore();
  const links = WORKSPACE_LINKS[currentRole];
  const [section, setSection] = useWorkspaceSection(links[0].id);
  const title = currentRole === 'ADMIN_FINANCE' ? 'مدیریت و امور مالی' : currentRole === 'DOCTOR' ? 'فضای کار پزشک' : currentRole === 'PATIENT' ? 'پورتال سلامت من' : 'پذیرش و نوبت‌ها';
  return <><button className="mobile-workspace-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="workspace-navigation"><Menu size={18}/>فضای کار</button><aside id="workspace-navigation" className={`workspace-sidebar ${open ? 'is-open' : ''}`} aria-label="ناوبری فضای کار">
    <button className="sidebar-close" aria-label="بستن ناوبری" onClick={()=>setOpen(false)}><X size={18}/></button><div className="sidebar-brand"><HeartPulse size={30}/><div><strong>آژی</strong><small>مدیریت یکپارچه سلامت</small></div></div>
    <p className="sidebar-label">فضای کار شما</p>
    <nav aria-label={title}>{links.map(link=><button key={link.id} className={`sidebar-link ${section===link.id?'is-active':''}`} aria-current={section===link.id?'page':undefined} onClick={()=>{ if(currentRole==='PATIENT') useBookingStore.getState().resetBooking(); setSection(link.id); setOpen(false); }}><LayoutDashboard size={18}/>{link.label}</button>)}</nav>
    <div className="sidebar-context"><CalendarDays size={18}/><span>{currentUser.branchName || 'خدمات یکپارچه کلینیک'}</span></div>
    <div className="sidebar-bottom"><ShieldCheck size={22}/><strong>مراقبت با اطمینان</strong><p>دسترسی به اطلاعات بر اساس نقش شما کنترل می‌شود.</p><small>محیط نمایشی • داده‌های آزمایشی</small></div>
  </aside></>;
}
