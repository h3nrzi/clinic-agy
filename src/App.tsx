import React from 'react';
import { WorkspaceSidebar } from '@/app/layout/WorkspaceSidebar';
import { RoleSwitcherToolbar } from '@/app/layout/RoleSwitcherToolbar';
import { Navbar } from '@/app/layout/Navbar';
import { AppLayout } from '@/app/layout/AppLayout';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" dir="rtl">
      {/* 1. Floating Demo & Role Switcher Toolbar (DEC-FE-01) */}
      <RoleSwitcherToolbar />

      {/* 2. Clinic Navbar with current user state */}
      <Navbar />
      <WorkspaceSidebar />

      {/* 3. Core App Layout and Active Role Workspaces */}
      <div className="flex-1 workspace-content" id="workspace">
        <AppLayout />
      </div>

      {/* 4. Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            کلینیک سلامت آژی • مراقبت یکپارچه و مدیریت شفاف
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            محیط نمایشی با داده‌های ساختگی • پرداخت و پیامک شبیه‌سازی‌شده
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
