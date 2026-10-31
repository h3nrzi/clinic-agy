import { Link, Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { dashboardPath } from "./roleRoutes";
import { WorkspaceSidebar } from "@/app/layout/WorkspaceSidebar";
import { RoleSwitcherToolbar } from "@/app/layout/RoleSwitcherToolbar";
import { Navbar } from "@/app/layout/Navbar";
import { AppLayout } from "@/app/layout/AppLayout";
import type { Role } from "@/shared/types";

export function WorkspaceRoute({ role }: { role: Role }) {
  const { isLoggedIn, currentRole } = useAuthStore();
  const location = useLocation();
  if (!isLoggedIn)
    return (
      <Navigate to="/login" state={{ returnTo: location.pathname }} replace />
    );
  if (currentRole !== role)
    return (
      <main className="access-message" dir="rtl">
        <h1>به این صفحه دسترسی ندارید</h1>
        <p>این مقصد برای نقش دیگری است. حساب نمایشی شما تغییر نکرده است.</p>
        <Link className="public-primary" to={dashboardPath(currentRole)}>
          بازگشت به فضای کار من
        </Link>
      </main>
    );
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900"
      dir="rtl"
    >
      <RoleSwitcherToolbar />
      <Navbar />
      <WorkspaceSidebar />
      <div className="flex-1 workspace-content" id="workspace">
        <AppLayout />
      </div>
      <footer className="public-footer">
        کلینیک سلامت آژی • محیط نمایشی با داده‌های ساختگی
      </footer>
    </div>
  );
}
