import { describe, it, expect } from 'vitest';
import {
  calculateInsurance,
  calculateInsuranceRevisionDelta,
} from '@/features/insurance-engine/logic/calculateInsurance';

describe('WP-01: Tiered Insurance Calculation Engine (TEST-LOGIC-01 to TEST-LOGIC-05)', () => {
  /**
   * TEST-LOGIC-01: Free Patient (No Base, No Supplementary)
   * Input: Free Price 1,000,000 Toman, no base, no supplementary
   * Expected: Base Coverage = 0, Supp Coverage = 0, Patient Share = 1,000,000 Toman
   */
  it('TEST-LOGIC-01: calculates correct payment for uninsured free patient', () => {
    const result = calculateInsurance(1_000_000, null, null);

    expect(result.freePrice).toBe(1_000_000);
    expect(result.baseCoverage).toBe(0);
    expect(result.remainingAfterBase).toBe(1_000_000);
    expect(result.suppCoverage).toBe(0);
    expect(result.totalCoverage).toBe(0);
    expect(result.patientShare).toBe(1_000_000);
  });

  /**
   * TEST-LOGIC-02: Base Percentage + Supp Percentage of Remaining (Uncapped)
   * Input: Free Price 1,000,000, Base 40%, Supp 70% of remaining (uncapped)
   * Calculation:
   *   Base = 1,000,000 * 0.40 = 400,000
   *   Remaining = 1,000,000 - 400,000 = 600,000
   *   Supp = 600,000 * 0.70 = 420,000
   *   Total Coverage = 400,000 + 420,000 = 820,000
   *   Patient Copay = 1,000,000 - 820,000 = 180,000
   */
  it('TEST-LOGIC-02: applies tiered percentage coverage sequentially on remaining amount', () => {
    const result = calculateInsurance(
      1_000_000,
      { code: 'TAMIN', coveragePercent: 40 },
      { code: 'DANA', coveragePercentOfRemaining: 70 }
    );

    expect(result.baseCoverage).toBe(400_000);
    expect(result.remainingAfterBase).toBe(600_000);
    expect(result.suppCoverage).toBe(420_000);
    expect(result.totalCoverage).toBe(820_000);
    expect(result.patientShare).toBe(180_000);
  });

  /**
   * TEST-LOGIC-03: Supplementary Insurance Ceiling Limit
   * Input: Free Price 1,000,000, Base 40%, Supp 70% with 300,000 ceiling
   * Calculation:
   *   Base = 400,000
   *   Remaining = 600,000
   *   Raw Supp = 600,000 * 0.70 = 420,000 -> Capped at 300,000
   *   Total Coverage = 400,000 + 300,000 = 700,000
   *   Patient Copay = 1,000,000 - 700,000 = 300,000
   */
  it('TEST-LOGIC-03: enforces supplementary ceiling limit when raw coverage exceeds cap', () => {
    const result = calculateInsurance(
      1_000_000,
      { code: 'TAMIN', coveragePercent: 0.40 },
      { code: 'DANA', coveragePercentOfRemaining: 0.70, ceilingLimit: 300_000 }
    );

    expect(result.baseCoverage).toBe(400_000);
    expect(result.remainingAfterBase).toBe(600_000);
    expect(result.rawSuppCoverage).toBe(420_000);
    expect(result.suppCoverage).toBe(300_000);
    expect(result.totalCoverage).toBe(700_000);
    expect(result.patientShare).toBe(300_000);
  });

  /**
   * TEST-LOGIC-04: Fixed Base Deduction + Fixed Supplementary Deduction
   * Input: Free Price 800,000, Base Fixed 200,000, Supp Fixed 500,000
   * Calculation:
   *   Base = 200,000
   *   Remaining = 600,000
   *   Supp = 500,000
   *   Patient Copay = 800,000 - 700,000 = 100,000
   */
  it('TEST-LOGIC-04: computes fixed deductions for both base and supplementary policies', () => {
    const result = calculateInsurance(
      800_000,
      { code: 'FIXED_BASE', fixedDeduction: 200_000 },
      { code: 'FIXED_SUPP', fixedDeduction: 500_000 }
    );

    expect(result.baseCoverage).toBe(200_000);
    expect(result.remainingAfterBase).toBe(600_000);
    expect(result.suppCoverage).toBe(500_000);
    expect(result.totalCoverage).toBe(700_000);
    expect(result.patientShare).toBe(100_000);
  });

  /**
   * TEST-LOGIC-05: Overflow Guard (Patient share never negative)
   * Input: Free Price 500,000, Base Fixed 300,000, Supp Fixed 400,000
   * Calculation:
   *   Base = 300,000
   *   Remaining = 200,000
   *   Supp raw = 400,000 -> Constrained to remaining 200,000
   *   Patient Copay = 0 (Never negative)
   */
  it('TEST-LOGIC-05: guards against overflow and guarantees patient copay is never negative', () => {
    const result = calculateInsurance(
      500_000,
      { code: 'FIXED_BASE', fixedDeduction: 300_000 },
      { code: 'FIXED_SUPP', fixedDeduction: 400_000 }
    );

    expect(result.baseCoverage).toBe(300_000);
    expect(result.remainingAfterBase).toBe(200_000);
    expect(result.rawSuppCoverage).toBe(400_000);
    expect(result.suppCoverage).toBe(200_000);
    expect(result.totalCoverage).toBe(500_000);
    expect(result.patientShare).toBe(0);
  });

  /**
   * Additional tests: Secretary Insurance Revision Delta (PRD 9.1(B))
   */
  it('calculates credit delta when revised coverage is higher (patient overpaid)', () => {
    // Patient originally paid 300,000. Revised due is 180,000 -> Delta = +120,000 (Credit)
    const revision = calculateInsuranceRevisionDelta(300_000, 180_000);

    expect(revision.delta).toBe(120_000);
    expect(revision.financialStatus).toBe('CREDIT');
    expect(revision.creditAmount).toBe(120_000);
    expect(revision.debitAmount).toBe(0);
    expect(revision.requiresSoftLock).toBe(false);
  });

  it('calculates debit delta and triggers soft lock requirement when revised coverage is lower', () => {
    // Patient originally paid 180,000. Revised due is 300,000 -> Delta = -120,000 (Debit)
    const revision = calculateInsuranceRevisionDelta(180_000, 300_000);

    expect(revision.delta).toBe(-120_000);
    expect(revision.financialStatus).toBe('DEBIT');
    expect(revision.creditAmount).toBe(0);
    expect(revision.debitAmount).toBe(120_000);
    expect(revision.requiresSoftLock).toBe(true);
  });
});
