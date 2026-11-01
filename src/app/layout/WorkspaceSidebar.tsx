import { NavLink } from 'react-router';
import { CalendarDays, ClipboardList, LayoutDashboard, PlusCircle, Settings, Wallet } from 'lucide-react';
import { WORKSPACE_LINKS } from '@/app/routing/roleRoutes';
import { useAuthStore } from '@/shared/stores/useAuthStore';

export function WorkspaceSidebar() {
  const { currentRole } = useAuthStore();
  const title = currentRole === 'ADMIN_FINANCE' ? 'مدیریت و امور مالی' : currentRole === 'DOCTOR' ? 'فضای کار پزشک' : currentRole === 'PATIENT' ? 'پورتال سلامت من' : 'پذیرش و نوبت‌ها';
  return <aside className="workspace-sidebar" aria-label="ناوبری فضای کار">
    <p className="sidebar-label">فضای کار شما</p>
    <nav aria-label={title}>
      {WORKSPACE_LINKS[currentRole].map(link => {
        const Icon = link.path.endsWith('/booking') ? PlusCircle : /\/(leaves|shifts)$/.test(link.path) ? CalendarDays : link.path.endsWith('/settings') ? Settings : link.path.endsWith('/tariffs') ? Wallet : currentRole.startsWith('SECRETARY') ? ClipboardList : LayoutDashboard;
        return <NavLink key={link.path} to={link.path} end className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}><Icon size={20} aria-hidden="true" /><span>{link.label}</span></NavLink>;
      })}
    </nav>
  </aside>;
}
