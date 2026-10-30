import React, { useState } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { Role } from '@/shared/types';
import {
  User,
  Building2,
  Stethoscope,
  BarChart3,
  RotateCcw,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export const RoleSwitcherToolbar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentRole, currentUser, switchRole } = useAuthStore();
  const { activeScenario, injectScenario, resetDatabase } = useScenarioStore();

  const roles: Array<{
    id: Role;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'PATIENT',
      label: 'بیمار',
      sublabel: 'رزرو، پرداخت، ویزیت',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'SECRETARY_TEHRAN',
      label: 'منشی تهران',
      sublabel: 'پذیرش، اصلاح بیمه، قفل',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'SECRETARY_ISFAHAN',
      label: 'منشی اصفهان',
      sublabel: 'پذیرش شعبه اصفهان',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'DOCTOR',
      label: 'پزشک',
      sublabel: 'اتاق ویزیت، شرح‌حال',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'ADMIN_FINANCE',
      label: 'مدیر مالی',
      sublabel: 'اکسل تعرفه، سهم پزشک',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <aside 
      aria-label="نوار ابزار دمو و سناریو"
      className="demo-toolbar relative z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-700/80 shadow-xl transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & collapse trigger */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              محیط شبیه‌ساز دمو (Mock Engine)
            </span>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300">
              <span className="text-slate-400">کاربر فعال:</span>
              <strong className="text-white font-medium">{currentUser.name}</strong>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] border border-slate-700">
                {currentUser.roleTitle}
              </span>
            </div>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-2">
            <button
              aria-expanded={!isCollapsed}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded transition border border-slate-700"
              title={isCollapsed ? 'گسترش نوار دمو' : 'جمع کردن نوار دمو'}
            >
              <span className="hidden md:inline">{isCollapsed ? 'نمایش ابزار دمو' : 'جمع کردن'}</span>
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible panel with roles and scenario injectors */}
        {!isCollapsed && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Roles Picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 ml-1 text-xs">تعویض بلادرنگ نقش:</span>
              {roles.map((r) => {
                const isActive = currentRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      if (activeScenario === 'INDEBTED_PATIENT' && r.id !== 'PATIENT') {
                        // Keep scenario in sync
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition text-xs border ${
                      isActive
                        ? 'bg-teal-600 text-white border-teal-400 shadow-md shadow-teal-900/40 ring-2 ring-teal-400/30'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scenario buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Indebted patient injector */}
              <button
                onClick={() => {
                  if (activeScenario === 'INDEBTED_PATIENT') {
                    injectScenario('NORMAL');
                  } else {
                    injectScenario('INDEBTED_PATIENT');
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  activeScenario === 'INDEBTED_PATIENT'
                    ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-amber-500/30'
                }`}
                title="تغییر به بیمار با ۱۲۰,۰۰۰ تومان بدهکاری جهت آزمون قفل نرم ویزیت"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {activeScenario === 'INDEBTED_PATIENT'
                    ? 'غیرفعال‌سازی بیمار بدهکار'
                    : 'تزریق بیمار بدهکار (قفل نرم)'}
                </span>
              </button>

              {/* Factory reset */}
              <button
                onClick={() => {
                  if (window.confirm('آیا از بازنشانی کامل پایگاه داده به وضعیت اولیه (Factory Reset) اطمینان دارید؟')) {
                    resetDatabase();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30 transition"
                title="پاکسازی تغییرات LocalStorage و بازگشت به Seed اولیه"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>ریست کارخانه‌ای داده‌ها</span>
              </button>

              <span className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 border-r border-slate-700 pr-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                محیط ایزوله بدون نیاز به سرور
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
