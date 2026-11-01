import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { HeartPulse, LayoutDashboard, ShieldCheck, CalendarDays, Menu, X } from 'lucide-react';
import { WORKSPACE_LINKS } from '@/app/routing/roleRoutes';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useWorkspaceOverlay } from '@/shared/hooks/useWorkspaceOverlay';

export function WorkspaceSidebar() {
  const [open, setOpen] = useState(false);
  const { currentUser, currentRole } = useAuthStore();
  const location = useLocation();
  const dialogRef = useWorkspaceOverlay(() => setOpen(false), open);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const resize = () => { if (window.innerWidth >= 1280) setOpen(false); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  const title = currentRole === 'ADMIN_FINANCE' ? 'مدیریت و امور مالی' : currentRole === 'DOCTOR' ? 'فضای کار پزشک' : currentRole === 'PATIENT' ? 'پورتال سلامت من' : 'پذیرش و نوبت‌ها';
  const content = <>
    <div className="sidebar-brand"><HeartPulse size={30} aria-hidden="true" /><div><strong>آژی</strong><small>مدیریت یکپارچه سلامت</small></div></div>
    <p className="sidebar-label">فضای کار شما</p>
    <nav aria-label={title}>{WORKSPACE_LINKS[currentRole].map(link => <NavLink key={link.path} to={link.path} end className={({isActive}) => `sidebar-link ${isActive ? 'is-active' : ''}`} onClick={() => setOpen(false)}><LayoutDashboard size={18} aria-hidden="true" />{link.label}</NavLink>)}</nav>
    <div className="sidebar-context"><CalendarDays size={18} aria-hidden="true" /><span>{currentUser.branchName || 'خدمات یکپارچه کلینیک'}</span></div>
    <div className="sidebar-bottom"><ShieldCheck size={22} aria-hidden="true" /><strong>مراقبت با اطمینان</strong><p>دسترسی به اطلاعات بر اساس نقش شما کنترل می‌شود.</p><small>محیط نمایشی • داده‌های آزمایشی</small></div>
  </>;
  return <>
    <button className="mobile-workspace-toggle" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? 'mobile-workspace-navigation' : undefined}><Menu size={18} aria-hidden="true" />باز کردن منوی فضای کار</button>
    <aside className="workspace-sidebar" aria-label="ناوبری فضای کار">{content}</aside>
    {open && createPortal(<div className="workspace-overlay" onClick={() => setOpen(false)}><div id="mobile-workspace-navigation" ref={dialogRef} role="dialog" aria-modal="true" aria-label="منوی فضای کار" tabIndex={-1} className="mobile-workspace-dialog" onClick={event => event.stopPropagation()}><button className="sidebar-close" aria-label="بستن ناوبری" onClick={() => setOpen(false)}><X size={20} /></button>{content}</div></div>, document.body)}
  </>;
}
