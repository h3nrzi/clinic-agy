import { describe, it, expect } from 'vitest';
import { evaluateCancellation } from '@/features/patient-portal/logic/cancellationRules';

describe('WP-01: Appointment Cancellation & Rescheduling Rules Engine (TEST-LOGIC-08 to TEST-LOGIC-10)', () => {
  const baseTime = new Date('2026-11-01T10:00:00.000Z').getTime();

  /**
   * TEST-LOGIC-08: Patient cancellation >= 12 hours before appointment
   * Inputs: Paid 200,000 Toman, diff = 15 hours
   * Expected: Penalty = 0, Wallet Credit = 200,000 Toman (100% refund), Can reschedule online = true
   */
  it('TEST-LOGIC-08: waives penalty and refunds 100% when patient cancels >= 12 hours before', () => {
    const cancelTime = baseTime;
    const appointmentTime = baseTime + 15 * 60 * 60 * 1000; // +15 hours

    const result = evaluateCancellation(
      appointmentTime,
      cancelTime,
      'PATIENT',
      200_000
    );

    expect(result.hoursUntilAppointment).toBe(15);
    expect(result.isLateCancellation).toBe(false);
    expect(result.penaltyPercent).toBe(0);
    expect(result.penaltyAmount).toBe(0);
    expect(result.walletCreditAmount).toBe(200_000);
    expect(result.canRescheduleOnline).toBe(true);
  });

  /**
   * TEST-LOGIC-09: Patient cancellation < 12 hours before appointment (late cancellation)
   * Inputs: Paid 200,000 Toman, diff = 4 hours
   * Expected: Clinic penalty = 100,000 Toman (50%), Wallet Credit = 100,000 Toman (50%), Can reschedule online = false
   */
  it('TEST-LOGIC-09: imposes 50% clinic penalty when patient cancels < 12 hours before', () => {
    const cancelTime = baseTime;
    const appointmentTime = baseTime + 4 * 60 * 60 * 1000; // +4 hours

    const result = evaluateCancellation(
      appointmentTime,
      cancelTime,
      'PATIENT',
      200_000
    );

    expect(result.hoursUntilAppointment).toBe(4);
    expect(result.isLateCancellation).toBe(true);
    expect(result.penaltyPercent).toBe(50);
    expect(result.penaltyAmount).toBe(100_000);
    expect(result.walletCreditAmount).toBe(100_000);
    expect(result.canRescheduleOnline).toBe(false);
  });

  /**
   * TEST-LOGIC-10: Cancellation by clinic or secretary at any time
   * Inputs: Paid 300,000 Toman, diff = 1 hour, actor = 'CLINIC' or 'SECRETARY'
   * Expected: Penalty = 0, Wallet Credit = 300,000 Toman (100% refund), Can reschedule online = true
   */
  it('TEST-LOGIC-10: refunds 100% without penalty at any time when cancelled by clinic or secretary', () => {
    const cancelTime = baseTime;
    const appointmentTime = baseTime + 1 * 60 * 60 * 1000; // +1 hour

    const clinicResult = evaluateCancellation(
      appointmentTime,
      cancelTime,
      'CLINIC',
      300_000
    );

    expect(clinicResult.hoursUntilAppointment).toBe(1);
    expect(clinicResult.isLateCancellation).toBe(false);
    expect(clinicResult.penaltyPercent).toBe(0);
    expect(clinicResult.penaltyAmount).toBe(0);
    expect(clinicResult.walletCreditAmount).toBe(300_000);
    expect(clinicResult.canRescheduleOnline).toBe(true);

    const secretaryResult = evaluateCancellation(
      appointmentTime,
      cancelTime,
      'SECRETARY',
      300_000
    );

    expect(secretaryResult.penaltyAmount).toBe(0);
    expect(secretaryResult.walletCreditAmount).toBe(300_000);
  });

  /**
   * Additional boundary & format tests
   */
  it('treats exact 12-hour boundary as eligible for 100% penalty-free refund', () => {
    const cancelTime = baseTime;
    const appointmentTime = baseTime + 12 * 60 * 60 * 1000; // Exactly 12 hours

    const result = evaluateCancellation(
      appointmentTime,
      cancelTime,
      'PATIENT',
      150_000
    );

    expect(result.hoursUntilAppointment).toBe(12);
    expect(result.isLateCancellation).toBe(false);
    expect(result.penaltyAmount).toBe(0);
    expect(result.walletCreditAmount).toBe(150_000);
  });

  it('supports ISO date strings as input parameters', () => {
    const cancelTime = '2026-11-01T08:00:00.000Z';
    const appointmentTime = '2026-11-01T14:00:00.000Z'; // 6 hours later (< 12h)

    const result = evaluateCancellation({
      appointmentTime,
      cancelTime,
      cancelledBy: 'PATIENT',
      patientPaidAmount: 400_000,
    });

    expect(result.hoursUntilAppointment).toBe(6);
    expect(result.isLateCancellation).toBe(true);
    expect(result.penaltyAmount).toBe(200_000);
    expect(result.walletCreditAmount).toBe(200_000);
  });
});
