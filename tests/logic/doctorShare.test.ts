import { describe, it, expect } from 'vitest';
import { calculateDoctorShare } from '@/features/financial-dashboard/logic/doctorShareCalculator';

describe('WP-01: Doctor Share & Clinic Revenue Calculator (TEST-LOGIC-06 & TEST-LOGIC-07)', () => {
  /**
   * TEST-LOGIC-06: Standard calculation with consumables and statutory tax
   * Inputs: Gross 1,000,000 Toman, Consumables 100,000 Toman, Doctor 60%, Tax 10%
   * Expected:
   *   Distributable = 900,000 Toman
   *   Doc Gross Share = 540,000 Toman
   *   Statutory Tax = 54,000 Toman
   *   Doc Net Share = 486,000 Toman
   *   Clinic Share = 360,000 Toman
   */
  it('TEST-LOGIC-06: accurately calculates doctor share, consumables deduction, and 10% tax', () => {
    const result = calculateDoctorShare(1_000_000, 100_000, 60, 10);

    expect(result.grossAmount).toBe(1_000_000);
    expect(result.consumables).toBe(100_000);
    expect(result.distributableAmount).toBe(900_000);
    expect(result.docGrossShare).toBe(540_000);
    expect(result.taxAmount).toBe(54_000);
    expect(result.docNetShare).toBe(486_000);
    expect(result.clinicShare).toBe(360_000);
  });

  /**
   * TEST-LOGIC-07: Service with zero consumables and zero tax
   * Inputs: Fee 500,000 Toman, Consumables 0, Doctor 70%, Tax 0%
   * Expected:
   *   Distributable = 500,000 Toman
   *   Doc Gross Share = 350,000 Toman
   *   Tax = 0 Toman
   *   Doc Net Share = 350,000 Toman
   *   Clinic Share = 150,000 Toman
   */
  it('TEST-LOGIC-07: calculates share correctly when consumables and tax are zero', () => {
    const result = calculateDoctorShare({
      grossAmount: 500_000,
      consumables: 0,
      docPercent: 70,
      taxPercent: 0,
    });

    expect(result.grossAmount).toBe(500_000);
    expect(result.consumables).toBe(0);
    expect(result.distributableAmount).toBe(500_000);
    expect(result.docGrossShare).toBe(350_000);
    expect(result.taxAmount).toBe(0);
    expect(result.docNetShare).toBe(350_000);
    expect(result.clinicShare).toBe(150_000);
  });

  /**
   * Additional tests: Edge cases & fraction/decimal percentages
   */
  it('handles decimal ratios (0.60 for 60% and 0.10 for 10%) identically', () => {
    const result = calculateDoctorShare(1_000_000, 100_000, 0.60, 0.10);

    expect(result.docGrossShare).toBe(540_000);
    expect(result.taxAmount).toBe(54_000);
    expect(result.docNetShare).toBe(486_000);
    expect(result.clinicShare).toBe(360_000);
  });

  it('safely handles consumables greater than gross amount without negative values', () => {
    const result = calculateDoctorShare(50_000, 100_000, 60, 10);

    expect(result.distributableAmount).toBe(0);
    expect(result.docGrossShare).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.docNetShare).toBe(0);
    expect(result.clinicShare).toBe(0);
  });
});
