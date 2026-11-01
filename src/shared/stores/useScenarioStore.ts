import { create } from 'zustand';
import { memoryDb } from '@/mocks/db/memoryDb';
import { INDEBTED_PATIENT_PROFILE, useAuthStore } from './useAuthStore';

export type ScenarioPreset = 'NORMAL' | 'INDEBTED_PATIENT' | 'POOR_NETWORK';

interface ScenarioState {
  resetRevision: number;
  activeScenario: ScenarioPreset;
  statusNotice: string | null;
  isSimulatingDelay: boolean;
  injectScenario: (preset: ScenarioPreset) => void;
  resetDatabase: () => void;
  dismissNotice: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  resetRevision: 0,
  activeScenario: 'NORMAL',
  statusNotice: null,
  isSimulatingDelay: false,

  injectScenario: (preset: ScenarioPreset) => {
    if (preset === 'INDEBTED_PATIENT') {
      const auth = useAuthStore.getState();
      if (!auth.isLoggedIn || auth.currentRole !== 'PATIENT') return;
      auth.setUser(INDEBTED_PATIENT_PROFILE);

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
      const auth = useAuthStore.getState();
      if (auth.isLoggedIn && auth.currentRole === 'PATIENT' && auth.currentUser.id === 'pat-3') auth.switchRole('PATIENT');
      set({
        activeScenario: 'NORMAL',
        isSimulatingDelay: false,
        statusNotice: 'حالت عادی سیستم برقرار شد.',
      });
    }
  },

  resetDatabase: () => {
    memoryDb.resetToFactoryDefaults();
    set(state => ({
      resetRevision: state.resetRevision + 1,
      activeScenario: 'NORMAL',
      isSimulatingDelay: false,
      statusNotice: 'تمامی داده‌های دیتابیس به مقادیر اولیه کارخانه‌ای (Factory Reset) بازگردانده شدند.',
    }));
  },

  dismissNotice: () => set({ statusNotice: null }),
}));
