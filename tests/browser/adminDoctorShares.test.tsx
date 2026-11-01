import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, within, act } from '@testing-library/react';
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
    expect(res.docGrossShare).toBe(540000); // 900,000 * 0.60
    expect(res.taxAmount).toBe(54000); // 540,000 * 0.10
    expect(res.docNetShare).toBe(486000); // 540,000 - 54,000
    expect(res.clinicShare).toBe(360000); // 900,000 - 540,000
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

  it('shows the known share example and saved tax rate without including cancelled or in-consultation appointments', () => {
    const sample = memoryDb.getAll('appointments')[0];
    const doctor = memoryDb.getAll('doctors')[0];
    const service = memoryDb.getAll('services')[0];
    [...memoryDb.getAll('appointments')].forEach((a) =>
      memoryDb.delete('appointments', a.id),
    );
    memoryDb.update('doctors', doctor.id, { sharePercentage: 0.6 });
    memoryDb.update('services', service.id, { consumableCost: 100000 });
    memoryDb.insert('appointments', {
      ...sample,
      id: 'share-confirmed',
      doctorId: doctor.id,
      serviceId: service.id,
      status: 'CONFIRMED',
      freePrice: 1000000,
    });
    memoryDb.insert('appointments', {
      ...sample,
      id: 'share-cancelled',
      doctorId: doctor.id,
      serviceId: service.id,
      status: 'CANCELLED_BY_PATIENT',
      freePrice: 9000000,
    });
    memoryDb.insert('appointments', {
      ...sample,
      id: 'share-live',
      doctorId: doctor.id,
      serviceId: service.id,
      status: 'IN_CONSULTATION',
      freePrice: 8000000,
    });
    renderApp('/finance');
    const table = screen.getByRole('region', { name: 'جدول سهم پزشکان' });
    const row = within(table).getByRole('row', {
      name: new RegExp(doctor.name),
    });
    for (const value of [
      '۱ نوبت',
      '۱,۰۰۰,۰۰۰ تومان',
      '۱۰۰,۰۰۰ تومان',
      '۵۴۰,۰۰۰ تومان',
      '۵۴,۰۰۰ تومان',
      '۴۸۶,۰۰۰ تومان',
      '۳۶۰,۰۰۰ تومان',
    ]) {
      expect(within(row).getByText(value)).toBeDefined();
    }
    act(() => memoryDb.updateSettings({ defaultTaxPercent: 15 }));
    expect(
      within(table).getByRole('columnheader', { name: 'مالیات ۱۵٪' }),
    ).toBeDefined();
    expect(within(row).getByText('۸۱,۰۰۰ تومان')).toBeDefined();
    expect(within(row).getByText('۴۵۹,۰۰۰ تومان')).toBeDefined();
    // A normal database notification refreshes calculations without changing the route or session.
    expect(
      screen.getByRole('button', { name: 'حساب کاربری مهندس توکلی' }),
    ).toBeDefined();
  });

  it('allows admin to modify clinic settings (tax percent, cancellation hours, penalty percent)', () => {
    renderApp();

    // Switch to Settings Tab
    const settingsTabBtn = screen.getByRole('link', { name: 'تنظیمات مالی' });
    fireEvent.click(settingsTabBtn);

    expect(
      screen.getByText(/پارامترهای سیستمی مالیات و جریمه لغو نوبت/),
    ).toBeDefined();

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
