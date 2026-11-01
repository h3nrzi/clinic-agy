import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';

function confirmFactoryReset() {
  fireEvent.click(screen.getByRole('button', { name: 'ابزارهای ارزیابی دمو' }));
  fireEvent.click(screen.getByRole('button', { name: /ریست کارخانه‌ای داده‌ها/ }));
}

describe('finance same-route factory reset', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    sessionStorage.clear();
    useAuthStore.getState().switchRole('ADMIN_FINANCE');
    vi.restoreAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('refreshes overview settings without navigating or changing account', async () => {
    memoryDb.updateSettings({ defaultTaxPercent: 15 });
    const { router } = renderApp('/finance');
    expect(screen.getByText('مالیات پزشک: ۱۵٪')).toBeDefined();

    confirmFactoryReset();

    expect(await screen.findByText('مالیات پزشک: ۱۰٪')).toBeDefined();
    expect(screen.queryByText('مالیات پزشک: ۱۵٪')).toBeNull();
    expect(router.state.location.pathname).toBe('/finance');
    expect(screen.getByRole('button', { name: 'حساب کاربری مهندس توکلی' })).toBeDefined();
  });
  it('removes reset shift rows on the same finance operations route', async () => {
    const originalShift = memoryDb.getAll('doctorShifts')[0];
    memoryDb.insert('doctorShifts', { ...originalShift, id: 'reset-shift-fixture', doctorName: 'پزشک آزمایشی بازنشانی' });
    const { router } = renderApp('/finance/shifts');
    expect(screen.getByText('پزشک آزمایشی بازنشانی')).toBeDefined();

    confirmFactoryReset();

    await waitFor(() => expect(screen.queryByText('پزشک آزمایشی بازنشانی')).toBeNull());
    expect(router.state.location.pathname).toBe('/finance/shifts');
    expect(screen.getByRole('button', { name: 'حساب کاربری مهندس توکلی' })).toBeDefined();
  });

  it('shows factory settings in the existing settings form after reset', async () => {
    memoryDb.updateSettings({ defaultTaxPercent: 15, cancellationThresholdHours: 24, cancellationPenaltyPercent: 40 });
    const { router } = renderApp('/finance/settings');
    expect(screen.getAllByRole('spinbutton').map(input => (input as HTMLInputElement).value)).toEqual(['15', '24', '40']);

    confirmFactoryReset();

    await waitFor(() => expect(screen.getAllByRole('spinbutton').map(input => (input as HTMLInputElement).value)).toEqual(['10', '12', '50']));
    expect(router.state.location.pathname).toBe('/finance/settings');
    expect(screen.getByRole('button', { name: 'حساب کاربری مهندس توکلی' })).toBeDefined();
  });

  it('clears an unsaved settings edit when factory settings were already stored', async () => {
    renderApp('/finance/settings');
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '15' } });
    expect((screen.getAllByRole('spinbutton')[0] as HTMLInputElement).value).toBe('15');

    // An unrelated mock-backend notification preserves the current financial draft.
    const shift = memoryDb.getAll('doctorShifts')[0];
    act(() => { memoryDb.update('doctorShifts', shift.id, { isActive: false }); });
    expect((screen.getAllByRole('spinbutton')[0] as HTMLInputElement).value).toBe('15');

    confirmFactoryReset();

    await waitFor(() => expect((screen.getAllByRole('spinbutton')[0] as HTMLInputElement).value).toBe('10'));
    expect(screen.getByText('مالیات پزشک: ۱۰٪')).toBeDefined();
  });

});
