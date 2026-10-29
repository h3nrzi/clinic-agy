/**
 * Appointment Cancellation and Rescheduling Rules Engine
 * Implements PRD Section 9.3 and TEST-LOGIC-08 through TEST-LOGIC-10
 */

export type CancellationActor = 'PATIENT' | 'CLINIC' | 'SECRETARY' | 'ADMIN';

export interface CancellationInput {
  appointmentTime: string | Date | number;
  cancelTime?: string | Date | number;
  cancelledBy: CancellationActor;
  patientPaidAmount: number;
  thresholdHours?: number;   // Default: 12 hours (S17)
  penaltyPercent?: number;   // Default: 50% (S17)
}

export interface CancellationResult {
  hoursUntilAppointment: number;
  isLateCancellation: boolean;
  penaltyPercent: number;          // 0 or 50% (configurable)
  penaltyAmount: number;           // Clinic cancellation penalty fee
  walletCreditAmount: number;      // Refund amount credited to patient wallet
  canRescheduleOnline: boolean;    // Whether patient can reschedule autonomously
  message: string;
}

/**
 * Parses diverse date inputs to milliseconds timestamp
 */
function toTimestamp(dateInput: string | Date | number): number {
  if (typeof dateInput === 'number') return dateInput;
  if (dateInput instanceof Date) return dateInput.getTime();
  return new Date(dateInput).getTime();
}

/**
 * Evaluates cancellation impact, fee calculation, and wallet credit allocation.
 *
 * Rule 1: Clinic / Secretary cancellation at any time -> 0% penalty, 100% refund to wallet.
 * Rule 2: Patient cancellation >= 12 hours before -> 0% penalty, 100% refund to wallet.
 * Rule 3: Patient cancellation < 12 hours before -> 50% clinic penalty, 50% refund to wallet,
 *         autonomous rescheduling disabled (requires secretary contact).
 */
export function evaluateCancellation(
  appointmentTimeOrInput: string | Date | number | CancellationInput,
  cancelTimeArg?: string | Date | number,
  cancelledByArg: CancellationActor = 'PATIENT',
  patientPaidAmountArg: number = 0,
  thresholdHoursArg: number = 12,
  penaltyPercentArg: number = 50
): CancellationResult {
  let appointmentTime: string | Date | number;
  let cancelTime: string | Date | number;
  let cancelledBy: CancellationActor;
  let patientPaidAmount: number;
  let thresholdHours: number;
  let penaltyPercentConfig: number;

  if (typeof appointmentTimeOrInput === 'object' && !(appointmentTimeOrInput instanceof Date)) {
    appointmentTime = appointmentTimeOrInput.appointmentTime;
    cancelTime = appointmentTimeOrInput.cancelTime ?? new Date();
    cancelledBy = appointmentTimeOrInput.cancelledBy;
    patientPaidAmount = appointmentTimeOrInput.patientPaidAmount ?? 0;
    thresholdHours = appointmentTimeOrInput.thresholdHours ?? 12;
    penaltyPercentConfig = appointmentTimeOrInput.penaltyPercent ?? 50;
  } else {
    appointmentTime = appointmentTimeOrInput;
    cancelTime = cancelTimeArg ?? new Date();
    cancelledBy = cancelledByArg;
    patientPaidAmount = patientPaidAmountArg;
    thresholdHours = thresholdHoursArg;
    penaltyPercentConfig = penaltyPercentArg;
  }

  const apptTs = toTimestamp(appointmentTime);
  const cancelTs = toTimestamp(cancelTime);
  const diffHours = (apptTs - cancelTs) / (1000 * 60 * 60);
  const safePaidAmount = Math.max(0, Math.round(patientPaidAmount));

  // If clinic or secretary cancels (at any time): 100% refund, 0% penalty
  if (cancelledBy !== 'PATIENT') {
    return {
      hoursUntilAppointment: diffHours,
      isLateCancellation: false,
      penaltyPercent: 0,
      penaltyAmount: 0,
      walletCreditAmount: safePaidAmount,
      canRescheduleOnline: true,
      message: 'لغو توسط کلینیک — بازگشت ۱۰۰٪ وجه به کیف پول بیمار بدون جریمه',
    };
  }

  // If patient cancels >= thresholdHours (12h): 100% refund, 0% penalty
  if (diffHours >= thresholdHours) {
    return {
      hoursUntilAppointment: diffHours,
      isLateCancellation: false,
      penaltyPercent: 0,
      penaltyAmount: 0,
      walletCreditAmount: safePaidAmount,
      canRescheduleOnline: true,
      message: 'لغو نوبت با رعایت مهلت ۱۲ ساعته — بازگشت ۱۰۰٪ وجه به کیف پول بیمار',
    };
  }

  // Late cancellation (< 12h) by patient: 50% penalty, 50% wallet credit
  const penaltyAmount = Math.round(safePaidAmount * (penaltyPercentConfig / 100));
  const walletCreditAmount = Math.max(0, safePaidAmount - penaltyAmount);

  return {
    hoursUntilAppointment: diffHours,
    isLateCancellation: true,
    penaltyPercent: penaltyPercentConfig,
    penaltyAmount,
    walletCreditAmount,
    canRescheduleOnline: false,
    message: 'لغو نوبت کمتر از ۱۲ ساعت مانده به ویزیت — کسر ۵۰٪ جریمه کلینیک و واریز ۵۰٪ به کیف پول',
  };
}
