import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';

beforeEach(() => {
  memoryDb.resetToFactoryDefaults();
  useAuthStore.getState().switchRole('ADMIN_FINANCE');
});

describe('Financial report scope through App and Router', () => {
  it('updates branch reports while keeping explicitly clinic-wide totals independent and excluding cancelled revenue', () => {
    const sample = memoryDb.getAll('appointments')[0];
    [...memoryDb.getAll('appointments')].forEach((a) =>
      memoryDb.delete('appointments', a.id),
    );
    memoryDb.insert('appointments', {
      ...sample,
      id: 'report-a',
      trackingCode: 'REPORT-A',
      branchId: 'TEHRAN',
      status: 'CONFIRMED',
      freePrice: 100000,
      baseInsuranceCoverage: 10000,
      suppInsuranceCoverage: 5000,
      debtOrCreditBalance: -30000,
      isSoftLocked: true,
    });
    memoryDb.insert('appointments', {
      ...sample,
      id: 'report-b',
      trackingCode: 'REPORT-B',
      branchId: 'ISFAHAN',
      status: 'COMPLETED',
      freePrice: 200000,
      baseInsuranceCoverage: 20000,
      suppInsuranceCoverage: 5000,
      debtOrCreditBalance: -40000,
      isSoftLocked: false,
    });
    memoryDb.insert('appointments', {
      ...sample,
      id: 'report-c',
      trackingCode: 'REPORT-C',
      branchId: 'TEHRAN',
      status: 'CANCELLED_BY_PATIENT',
      freePrice: 900000,
      baseInsuranceCoverage: 700000,
      suppInsuranceCoverage: 0,
      debtOrCreditBalance: 0,
      isSoftLocked: false,
    });
    const { router } = renderApp('/finance');
    const clinic = screen.getByRole('region', { name: 'خلاصه مالی کل کلینیک' });
    expect(within(clinic).getByText('۳۰۰,۰۰۰ تومان')).toBeDefined();
    expect(
      screen.getByRole('meter', { name: 'درآمد تهران' }).getAttribute('value'),
    ).toBe('100000');
    fireEvent.change(screen.getByLabelText('محدوده گزارش'), {
      target: { value: 'ISFAHAN' },
    });
    const report = screen.getByRole('region', { name: 'تحلیل عملکرد کلینیک' });
    expect(within(report).getByText('محدوده فعلی: اصفهان')).toBeDefined();
    expect(
      screen.getByRole('meter', { name: 'درآمد تهران' }).getAttribute('value'),
    ).toBe('0');
    expect(
      screen.getByRole('meter', { name: 'درآمد اصفهان' }).getAttribute('value'),
    ).toBe('200000');
    expect(within(report).getByText('۲۵,۰۰۰ تومان')).toBeDefined();
    expect(within(report).getByText('۴۰,۰۰۰ تومان')).toBeDefined();
    expect(within(report).getByText('REPORT-B')).toBeDefined();
    expect(
      within(
        screen.getByRole('region', { name: 'آخرین نوبت‌های مالی' }),
      ).getByText('تکمیل‌شده'),
    ).toBeDefined();
    expect(within(report).queryByText('REPORT-A')).toBeNull();
    expect(within(clinic).getByText('۳۰۰,۰۰۰ تومان')).toBeDefined();
    expect(
      screen.getByRole('region', { name: 'سهم پزشکان کل کلینیک' }),
    ).toBeDefined();
    expect(router.state.location.pathname).toBe('/finance');
  });
  it('shows explicit empty states without invalid chart values', () => {
    [...memoryDb.getAll('appointments')].forEach((a) =>
      memoryDb.delete('appointments', a.id),
    );
    renderApp('/finance');
    expect(
      screen.getByText('در این محدوده درآمدی ثبت نشده است.'),
    ).toBeDefined();
    expect(
      screen.getByRole('meter', { name: 'درآمد تهران' }).getAttribute('max'),
    ).toBe('1');
    expect(
      screen.getByText(
        'هنوز نوبت تأییدشده یا تکمیل‌شده‌ای برای محاسبه سهم ثبت نشده است.',
      ),
    ).toBeDefined();
    expect(screen.queryByText(/NaN|Infinity/)).toBeNull();
  });
});
