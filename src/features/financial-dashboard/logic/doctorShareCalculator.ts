/**
 * Doctor Share and Clinic Revenue Calculator
 * Implements PRD Section 9.1(C), DEC-FE-03 (10% default tax), and TEST-LOGIC-06, TEST-LOGIC-07
 */

export interface DoctorShareInput {
  grossAmount: number;     // Rev_total (e.g. service fee or patient paid + revised insurance)
  consumables?: number;    // C_consumables (default: 0)
  docPercent?: number;     // Doctor share percentage (e.g. 60 or 0.60)
  taxPercent?: number;     // Statutory tax deduction percentage (default: 10% per DEC-FE-03)
}

export interface DoctorShareResult {
  grossAmount: number;         // Total revenue
  consumables: number;         // Consumable deductions
  distributableAmount: number; // Rev_distributable = Rev_total - C_consumables
  docGrossShare: number;       // Share_doc_gross = Rev_distributable * (docPercent / 100)
  taxAmount: number;           // Tax_doc = Share_doc_gross * (taxPercent / 100)
  docNetShare: number;         // Share_doc_net = Share_doc_gross - Tax_doc
  clinicShare: number;         // Share_clinic = Rev_distributable - Share_doc_gross
}

function normalizeRatio(val: number | undefined, defaultRatio: number): number {
  if (val === undefined || val === null || isNaN(val)) return defaultRatio;
  if (val > 1) return val / 100;
  if (val < 0) return 0;
  return val;
}

/**
 * Calculates doctor share, statutory tax withholding, and clinic revenue.
 * Supports both positional parameters and object parameter format.
 */
export function calculateDoctorShare(
  grossAmountOrInput: number | DoctorShareInput,
  consumablesArg: number = 0,
  docPercentArg: number = 60,
  taxPercentArg: number = 10
): DoctorShareResult {
  let grossAmount: number;
  let consumables: number;
  let docPercent: number;
  let taxPercent: number;

  if (typeof grossAmountOrInput === 'object') {
    grossAmount = grossAmountOrInput.grossAmount;
    consumables = grossAmountOrInput.consumables ?? 0;
    docPercent = grossAmountOrInput.docPercent ?? 60;
    taxPercent = grossAmountOrInput.taxPercent ?? 10;
  } else {
    grossAmount = grossAmountOrInput;
    consumables = consumablesArg;
    docPercent = docPercentArg;
    taxPercent = taxPercentArg;
  }

  const safeGross = Math.max(0, Math.round(grossAmount));
  const safeConsumables = Math.max(0, Math.round(consumables));
  const docRatio = normalizeRatio(docPercent, 0.60);
  const taxRatio = normalizeRatio(taxPercent, 0.10);

  // 1. Distributable revenue after consumables
  const distributableAmount = Math.max(0, safeGross - safeConsumables);

  // 2. Doctor gross share
  const docGrossShare = Math.round(distributableAmount * docRatio);

  // 3. Tax deduction
  const taxAmount = Math.round(docGrossShare * taxRatio);

  // 4. Doctor net share
  const docNetShare = Math.max(0, docGrossShare - taxAmount);

  // 5. Clinic share
  const clinicShare = Math.max(0, distributableAmount - docGrossShare);

  return {
    grossAmount: safeGross,
    consumables: safeConsumables,
    distributableAmount,
    docGrossShare,
    taxAmount,
    docNetShare,
    clinicShare,
  };
}
