import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { calculateDoctorShare } from '@/features/financial-dashboard/logic/doctorShareCalculator';

describe('WP-05: Admin Financial Dashboard & Doctor Share Formula (FLOW-06, AC-08, DEC-FE-03)', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('ADMIN_FINANCE');
  });

  it('calculates doctor share according to PRD 9.1 and AC-08 (gross, consumables, statutory tax 10%, net)', () => {
    // AC-08 Scenario: Service fee: 1,000,000 | Consumables: 100,000 | Doc share: 60% | Tax: 10%
    const res = calculateDoctorShare({
      grossAmount: 1000000,
      consumables: 100000,
      docPercent: 60,
      taxPercent: 10,
    });

    expect(res.distributableAmount).toBe(900000); // 1,000,000 - 100,000
    expect(res.docGrossShare).toBe(540000);       // 900,000 * 0.60
    expect(res.taxAmount).toBe(54000);            // 540,000 * 0.10
    expect(res.docNetShare).toBe(486000);         // 540,000 - 54,000
    expect(res.clinicShare).toBe(360000);         // 900,000 - 540,000
  });

  it('renders financial dashboard KPIs and doctor performance table in UI (SCREEN-07)', () => {
    renderApp();

    expect(screen.getByTestId('financial-dashboard')).toBeDefined();
    expect(screen.getByText('کل درآمد ناخالص خدمات')).toBeDefined();
    expect(screen.getByText('مجموع سهم ناخالص پزشکان')).toBeDefined();
    expect(screen.getByText('مالیات کسرشده')).toBeDefined();
    expect(screen.getByText('خالص پرداختی به پزشکان')).toBeDefined();

    // Verify doctors are in the table
    expect(screen.getAllByText('دکتر مریم احمدی').length).toBeGreaterThan(0);
    expect(screen.getAllByText('دکتر رضا حسینی').length).toBeGreaterThan(0);
  });

  it('allows admin to modify clinic settings (tax percent, cancellation hours, penalty percent)', () => {
    renderApp();

    // Switch to Settings Tab
    const settingsTabBtn = screen.getByRole('link', { name: 'تنظیمات مالی' });
    fireEvent.click(settingsTabBtn);

    expect(screen.getByText(/پارامترهای سیستمی مالیات و جریمه لغو نوبت/)).toBeDefined();

    // Verify default settings from DEC-FE-03
    const settings = memoryDb.getSettings();
    expect(settings.defaultTaxPercent).toBe(10);
    expect(settings.cancellationThresholdHours).toBe(12);
    expect(settings.cancellationPenaltyPercent).toBe(50);

    // Update settings via memoryDb
    memoryDb.updateSettings({
      defaultTaxPercent: 15,
      cancellationThresholdHours: 24,
      cancellationPenaltyPercent: 40,
    });

    const updated = memoryDb.getSettings();
    expect(updated.defaultTaxPercent).toBe(15);
    expect(updated.cancellationThresholdHours).toBe(24);
    expect(updated.cancellationPenaltyPercent).toBe(40);
  });
});
