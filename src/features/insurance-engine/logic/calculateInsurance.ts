/**
 * Tiered Insurance Calculation Engine
 * Implements PRD Section 9.1(A) & 9.1(B) and TEST-LOGIC-01 through TEST-LOGIC-05
 */

import { BaseInsurance, SupplementaryInsurance, ServiceTariff } from '@/shared/types';

export interface BaseInsuranceInput {
  id?: string;
  code?: string;
  name?: string;
  coveragePercent?: number; // Either percentage (e.g. 40) or fraction (e.g. 0.40)
  fixedDeduction?: number;  // Fixed Toman deduction
  isDefault?: boolean;
}

export interface SuppInsuranceInput {
  id?: string;
  code?: string;
  name?: string;
  coveragePercentOfRemaining?: number; // Either percentage (e.g. 70) or fraction (e.g. 0.70)
  fixedDeduction?: number;             // Fixed Toman amount
  ceilingLimit?: number;               // Max cap in Toman (0 or undefined = uncapped)
  isDefault?: boolean;
}

export interface InsuranceCalculationResult {
  freePrice: number;
  baseCoverage: number;          // I_base
  remainingAfterBase: number;    // R_1 = freePrice - baseCoverage
  rawSuppCoverage: number;       // I_supp_raw before ceiling/overflow cap
  suppCoverage: number;          // I_supp after ceiling and remainder limit
  totalCoverage: number;         // I_total = baseCoverage + suppCoverage
  patientShare: number;          // P_patient = freePrice - totalCoverage (>= 0)
}

/**
 * Normalizes percentage values allowing both 40 and 0.40 representations
 */
function normalizePercent(val: number | undefined): number {
  if (val === undefined || val === null || isNaN(val) || val <= 0) return 0;
  // If > 1, assume whole percentage (e.g. 40 -> 0.40)
  if (val > 1) return val / 100;
  return val;
}

/**
 * Calculates tiered insurance breakdown according to PRD section 9.1(A)
 *
 * Step 1: Base insurance deduction (fixed amount priority, else percentage of freePrice)
 * Step 2: Remainder calculation (R1 = freePrice - baseCoverage)
 * Step 3: Supplementary insurance deduction on remainder R1 with ceiling & overflow guard
 * Step 4: Final patient copay guarantee (never negative)
 */
export function calculateInsurance(
  serviceOrPrice: number | ServiceTariff | { freePrice: number },
  baseInsurance?: BaseInsurance | BaseInsuranceInput | null,
  suppInsurance?: SupplementaryInsurance | SuppInsuranceInput | null
): InsuranceCalculationResult {
  const freePrice = typeof serviceOrPrice === 'number' ? serviceOrPrice : serviceOrPrice.freePrice;
  const safeFreePrice = Math.max(0, Math.round(freePrice));

  // Step 1: Base Insurance (I_base)
  let baseCoverage = 0;
  if (baseInsurance && baseInsurance.code !== 'FREE' && baseInsurance.code !== 'NONE') {
    const fixedBase = baseInsurance.fixedDeduction || 0;
    if (fixedBase > 0) {
      // Fixed amount priority
      baseCoverage = Math.min(safeFreePrice, fixedBase);
    } else {
      const basePercent = normalizePercent(baseInsurance.coveragePercent);
      baseCoverage = Math.round(safeFreePrice * basePercent);
    }
  }
  baseCoverage = Math.max(0, Math.min(safeFreePrice, baseCoverage));

  // Step 2: Remainder after Base (R_1)
  const remainingAfterBase = Math.max(0, safeFreePrice - baseCoverage);

  // Step 3: Supplementary Insurance on Remainder (I_supp)
  let rawSuppCoverage = 0;
  let suppCoverage = 0;

  if (suppInsurance && suppInsurance.code !== 'NONE' && suppInsurance.code !== 'FREE') {
    const fixedSupp = suppInsurance.fixedDeduction || 0;
    if (fixedSupp > 0) {
      rawSuppCoverage = fixedSupp;
    } else {
      const suppPercent = normalizePercent(suppInsurance.coveragePercentOfRemaining);
      rawSuppCoverage = Math.round(remainingAfterBase * suppPercent);
    }

    // Apply ceiling and remainder overflow limit
    const ceiling = suppInsurance.ceilingLimit && suppInsurance.ceilingLimit > 0
      ? suppInsurance.ceilingLimit
      : Infinity;

    suppCoverage = Math.min(remainingAfterBase, rawSuppCoverage, ceiling);
  }

  rawSuppCoverage = Math.max(0, Math.round(rawSuppCoverage));
  suppCoverage = Math.max(0, Math.round(suppCoverage));

  // Step 4: Final Patient Share & Totals
  const totalCoverage = baseCoverage + suppCoverage;
  const patientShare = Math.max(0, safeFreePrice - totalCoverage);

  return {
    freePrice: safeFreePrice,
    baseCoverage,
    remainingAfterBase,
    rawSuppCoverage,
    suppCoverage,
    totalCoverage,
    patientShare,
  };
}

/**
 * Calculates Delta when secretary modifies insurance coverage (PRD Section 9.1(B))
 * Delta = initialPatientPaid - revisedPatientDue
 * Delta > 0: Overpaid -> Credit wallet
 * Delta < 0: Underpaid -> Debit balance & Soft lock on video entrance
 */
export function calculateInsuranceRevisionDelta(
  initialPatientPaid: number,
  revisedPatientDue: number
): {
  delta: number;
  financialStatus: 'SETTLED' | 'CREDIT' | 'DEBIT';
  creditAmount: number;
  debitAmount: number;
  requiresSoftLock: boolean;
} {
  const delta = Math.round(initialPatientPaid - revisedPatientDue);

  if (delta > 0) {
    return {
      delta,
      financialStatus: 'CREDIT',
      creditAmount: delta,
      debitAmount: 0,
      requiresSoftLock: false,
    };
  } else if (delta < 0) {
    return {
      delta,
      financialStatus: 'DEBIT',
      creditAmount: 0,
      debitAmount: Math.abs(delta),
      requiresSoftLock: true,
    };
  }

  return {
    delta: 0,
    financialStatus: 'SETTLED',
    creditAmount: 0,
    debitAmount: 0,
    requiresSoftLock: false,
  };
}
