import { create } from 'zustand';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from './useAuthStore';

export type ScenarioPreset = 'NORMAL' | 'INDEBTED_PATIENT' | 'POOR_NETWORK';

interface ScenarioState {
  activeScenario: ScenarioPreset;
  statusNotice: string | null;
  isSimulatingDelay: boolean;
  injectScenario: (preset: ScenarioPreset) => void;
  resetDatabase: () => void;
  dismissNotice: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  activeScenario: 'NORMAL',
  statusNotice: null,
  isSimulatingDelay: false,

  injectScenario: (preset: ScenarioPreset) => {
    if (preset === 'INDEBTED_PATIENT') {
      // Switch active user to Mehdi Saeidi (who has debt and soft-lock)
      useAuthStore.getState().setUser({
        id: 'pat-3',
        name: 'مهدی سعیدی (سناریوی بدهکار)',
        role: 'PATIENT',
        roleTitle: 'بیمار دارای بدهی و قفل نرم',
        nationalCode: '۰۰۳۴۵۶۷۸۹۰',
        mobile: '۰۹۱۲۵۵۵۶۶۷۷',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      });

      set({
        activeScenario: 'INDEBTED_PATIENT',
        statusNotice: 'سناریوی بیمار بدهکار فعال شد: نوبت AGY-10143 دارای مانده بدهی ۱۲۰,۰۰۰ تومان و قفل نرم ورود به جلسه است.',
      });
    } else if (preset === 'POOR_NETWORK') {
      set({
        activeScenario: 'POOR_NETWORK',
        isSimulatingDelay: true,
        statusNotice: 'سناریوی اینترنت ضعیف فعال شد: تمامی درخواست‌ها با تأخیر ۱.۵ ثانیه‌ای شبیه‌سازی می‌شوند.',
      });
    } else {
      // Normal
      useAuthStore.getState().switchRole('PATIENT');
      set({
        activeScenario: 'NORMAL',
        isSimulatingDelay: false,
        statusNotice: 'حالت عادی سیستم برقرار شد.',
      });
    }
  },

  resetDatabase: () => {
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    set({
      activeScenario: 'NORMAL',
      isSimulatingDelay: false,
      statusNotice: 'تمامی داده‌های دیتابیس به مقادیر اولیه کارخانه‌ای (Factory Reset) بازگردانده شدند.',
    });
  },

  dismissNotice: () => set({ statusNotice: null }),
}));
