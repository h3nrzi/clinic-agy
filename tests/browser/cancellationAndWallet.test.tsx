import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';

describe('WP-05: Appointment Cancellation, 12-Hour Rule & Wallet Refund (FLOW-05, AC-06)', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
    useBookingStore.getState().resetBooking();
  });

  it('allows patient to cancel an appointment >= 12 hours before visit with 0% penalty and 100% wallet refund (AC-06 free cancellation)', async () => {
    // app-future-safe is seeded 24 hours in the future with initialPatientPaid: 200,000
    const safeApp = appointmentRepository.getById('app-future-safe')!;
    expect(safeApp).toBeDefined();
    expect(safeApp.status).toBe('CONFIRMED');

    const initialWallet = walletRepository.getByPatientId('pat-1')!.balance;

    renderApp();

    // In Patient Dashboard, locate app-future-safe card
    const trackingBadge = screen.getByText('AGY-10188');
    expect(trackingBadge).toBeDefined();

    // Click "لغو نوبت" within that specific appointment card
    const appCard = trackingBadge.closest('.hover\\:bg-slate-50\\/60') || trackingBadge.parentElement?.parentElement?.parentElement!;
    const cancelBtn = within(appCard as HTMLElement).getByRole('button', { name: /لغو نوبت/ });
    fireEvent.click(cancelBtn);

    // Verify Cancellation Modal opens with >= 12h policy
    expect(screen.getByRole('dialog', { name: /لغو نوبت و استرداد وجه/ })).toBeDefined();
    expect(screen.getByText(/لغو رایگان و بدون جریمه/)).toBeDefined();

    // Confirm Cancellation
    const confirmBtn = screen.getByRole('button', { name: /تأیید لغو و برگشت ۱۰۰٪ وجه/ });
    fireEvent.click(confirmBtn);

    // Verify success confirmation in modal
    expect(screen.getByText('نوبت با موفقیت لغو شد')).toBeDefined();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /متوجه شدم و بستن/ });
    fireEvent.click(closeBtn);

    // Verify appointment status updated in repository
    const updatedApp = appointmentRepository.getById('app-future-safe');
    expect(updatedApp?.status).toBe('CANCELLED_BY_PATIENT');

    // Verify patient wallet was credited 100% of 200,000 Toman
    const updatedWallet = walletRepository.getByPatientId('pat-1')!.balance;
    expect(updatedWallet).toBe(initialWallet + 200000);
  });

  it('enforces 50% clinic penalty when patient cancels < 12 hours before visit (AC-06 late cancellation)', async () => {
    // app-future-urgent is seeded 4 hours in the future with initialPatientPaid: 200,000
    const urgentApp = appointmentRepository.getById('app-future-urgent')!;
    expect(urgentApp).toBeDefined();
    expect(urgentApp.status).toBe('CONFIRMED');

    const initialWallet = walletRepository.getByPatientId('pat-1')!.balance;

    renderApp();

    // Locate urgent appointment
    expect(screen.getByText('AGY-10189')).toBeDefined();

    // Directly evaluate and cancel via repository to assert exact policy calculation
    const cancelRes = appointmentRepository.cancelAppointment('app-future-urgent', 'PATIENT');

    expect(cancelRes.evaluation.isLateCancellation).toBe(true);
    expect(cancelRes.evaluation.penaltyPercent).toBe(50);
    expect(cancelRes.evaluation.penaltyAmount).toBe(100000); // 50% of 200,000
    expect(cancelRes.evaluation.walletCreditAmount).toBe(100000); // 50% refunded

    const updatedApp = appointmentRepository.getById('app-future-urgent');
    expect(updatedApp?.status).toBe('CANCELLED_BY_PATIENT');

    // Wallet only increased by 50%
    const updatedWallet = walletRepository.getByPatientId('pat-1')!.balance;
    expect(updatedWallet).toBe(initialWallet + 100000);
  });

  it('refunds 100% with 0 penalty when clinic cancels at any time', async () => {
    const initialWallet = walletRepository.getByPatientId('pat-1')!.balance;
    const cancelRes = appointmentRepository.cancelAppointment('app-future-urgent', 'CLINIC');

    expect(cancelRes.evaluation.isLateCancellation).toBe(false);
    expect(cancelRes.evaluation.penaltyAmount).toBe(0);
    expect(cancelRes.evaluation.walletCreditAmount).toBe(200000); // 100% refund

    const updatedApp = appointmentRepository.getById('app-future-urgent');
    expect(updatedApp?.status).toBe('CANCELLED_BY_CLINIC');
    expect(walletRepository.getByPatientId('pat-1')!.balance).toBe(initialWallet + 200000);
  });
});
