import React from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { HeartPulse, User, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { statusNotice, dismissNotice } = useScenarioStore();

  return (
    <header className="pt-24 sm:pt-20 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Scenario status notification toast/banner */}
      {statusNotice && (
        <div className="bg-teal-50 border-b border-teal-200 px-4 py-2.5 text-xs text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>{statusNotice}</span>
          </div>
          <button
            onClick={dismissNotice}
            className="text-teal-700 hover:text-teal-950 p-1 rounded transition"
            title="بستن پیام"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Clinic Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">کلینیک سلامت آژی</h1>
              <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-2 py-0.5 rounded-full">
                نسخه آزمایشی فرانت‌اند فاز ۲
              </span>
            </div>
            <p className="text-xs text-slate-500">سامانه هوشمند رزرو نوبت، بیمه پلکانی و ویزیت آنلاین</p>
          </div>
        </div>

        {/* Current user badge */}
        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-800">{currentUser.name}</div>
            <div className="text-[11px] text-slate-500">{currentUser.roleTitle}</div>
          </div>
          <div className="w-9 h-9 rounded-full ring-2 ring-teal-500/30 overflow-hidden bg-slate-100 flex items-center justify-center">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
