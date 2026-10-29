import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, ROLE_PROFILES } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';

describe('WP-00: Zustand Stores & Role Switcher Toolbar State', () => {
  beforeEach(() => {
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
  });

  it('switches between all 5 roles seamlessly', () => {
    // 1. Patient
    expect(useAuthStore.getState().currentRole).toBe('PATIENT');
    expect(useAuthStore.getState().currentUser.name).toBe('علی رضایی');

    // 2. Secretary Tehran
    useAuthStore.getState().switchRole('SECRETARY_TEHRAN');
    expect(useAuthStore.getState().currentRole).toBe('SECRETARY_TEHRAN');
    expect(useAuthStore.getState().currentUser.branchId).toBe('TEHRAN');
    expect(useAuthStore.getState().currentUser.name).toBe(ROLE_PROFILES.SECRETARY_TEHRAN.name);

    // 3. Secretary Isfahan
    useAuthStore.getState().switchRole('SECRETARY_ISFAHAN');
    expect(useAuthStore.getState().currentRole).toBe('SECRETARY_ISFAHAN');
    expect(useAuthStore.getState().currentUser.branchId).toBe('ISFAHAN');

    // 4. Doctor
    useAuthStore.getState().switchRole('DOCTOR');
    expect(useAuthStore.getState().currentRole).toBe('DOCTOR');
    expect(useAuthStore.getState().currentUser.roleTitle).toContain('پزشک');

    // 5. Admin / Finance
    useAuthStore.getState().switchRole('ADMIN_FINANCE');
    expect(useAuthStore.getState().currentRole).toBe('ADMIN_FINANCE');
    expect(useAuthStore.getState().currentUser.roleTitle).toContain('مدیر');
  });

  it('injects indebted patient scenario and updates active user and status notice', () => {
    const scenarioStore = useScenarioStore.getState();
    scenarioStore.injectScenario('INDEBTED_PATIENT');

    expect(useScenarioStore.getState().activeScenario).toBe('INDEBTED_PATIENT');
    expect(useScenarioStore.getState().statusNotice).toContain('بیمار بدهکار');

    // Current user should be set to Mehdi Saeidi
    const currentUser = useAuthStore.getState().currentUser;
    expect(currentUser.id).toBe('pat-3');
    expect(currentUser.name).toContain('مهدی سعیدی');
  });

  it('resets database via scenario store and restores state', () => {
    // Put system in abnormal state
    useScenarioStore.getState().injectScenario('INDEBTED_PATIENT');
    expect(useScenarioStore.getState().activeScenario).toBe('INDEBTED_PATIENT');

    // Trigger reset
    useScenarioStore.getState().resetDatabase();

    expect(useScenarioStore.getState().activeScenario).toBe('NORMAL');
    expect(useScenarioStore.getState().statusNotice).toContain('Factory Reset');
    expect(useAuthStore.getState().currentRole).toBe('PATIENT');
  });
});
