/**
 * Core Domain Types for Clinic Agy
 * Based on PRD v2.0 and Frontend Specification
 */

export type Role = 
  | 'PATIENT' 
  | 'SECRETARY_TEHRAN' 
  | 'SECRETARY_ISFAHAN' 
  | 'DOCTOR' 
  | 'ADMIN_FINANCE';

export type UserRole = Role;

export type BranchId = 'TEHRAN' | 'ISFAHAN' | 'ONLINE';

export interface Branch {
  id: BranchId;
  name: string;
  city: string;
  address: string;
  phone: string;
  isOnline: boolean;
  workingHours: string;
}

export interface Doctor {
  id: string;
  name: string;
  medicalCouncilNumber: string;
  specialty: string;
  branches: BranchId[];
  consultationFee: number;
  sharePercentage: number; // e.g. 0.60 for 60%
  avatar: string;
  isAvailable: boolean;
}

export type ServiceCategory = 'CONSULTATION' | 'PARAMEDICAL' | 'SCREENING';

export interface ServiceTariff {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  branch: BranchId | 'ALL';
  durationMinutes: number;
  freePrice: number; // in Toman
  consumableCost: number; // in Toman
  isActive: boolean;
}

export interface BaseInsurance {
  id: string;
  name: string;
  code: string;
  coveragePercent: number; // e.g. 0.30 for 30%
  fixedDeduction: number; // 0 if percentage-based, or fixed amount
  isDefault: boolean;
}

export interface SupplementaryInsurance {
  id: string;
  name: string;
  code: string;
  coveragePercentOfRemaining: number; // e.g. 0.70 for 70% of remainder
  fixedDeduction?: number; // 0 if percentage-based, or fixed amount
  ceilingLimit: number; // max cap in Toman
  isDefault: boolean;
}

export interface PatientProfile {
  id: string;
  nationalCode: string;
  mobile: string;
  fullName: string;
  baseInsuranceId: string;
  supplementaryInsuranceId: string;
  consentGiven: boolean;
  consentTimestamp?: string;
}

export interface Wallet {
  id: string;
  patientId: string;
  balance: number; // Positive = credit (بستانکار), Negative = debit (بدهکار)
  currency: 'TOMAN';
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  patientId: string;
  appointmentId?: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  timestamp: string;
}

export type AppointmentStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'IN_CONSULTATION' 
  | 'COMPLETED' 
  | 'CANCELLED_BY_PATIENT' 
  | 'CANCELLED_BY_CLINIC';

export type FinancialStatus = 'SETTLED' | 'CREDIT' | 'DEBIT';

export interface MedicalDocument {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  sizeBytes: number;
}

export type PatientDocument = MedicalDocument;

/**
 * 5-Field Clinical Note as mandated by S12, S15, FLOW-04
 * Subject to Field-Level RBAC:
 * - DOCTOR: Can view and edit all 5 fields
 * - PATIENT: Can ONLY view fields 4 (prescriptions) and 5 (followUp)
 * - SECRETARY: Can ONLY view field 5 (followUp)
 */
export interface ClinicalNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  // Field 1: شکایت اصلی بیمار
  mainComplaint: string;
  // Field 2: یافته‌های مهم / معاینه
  findings: string;
  // Field 3: تشخیص / تشخیص‌های افتراقی
  diagnosis: string;
  // Field 4: توصیه‌ها و نسخه (قابل مشاهده برای بیمار و پزشک)
  prescriptions: string;
  // Field 5: دستور پیگیری (قابل مشاهده برای منشی، بیمار و پزشک)
  followUp: string;
  savedAt: string;
}

export interface Appointment {
  id: string;
  trackingCode: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  branchId: BranchId;
  dateTime: string; // ISO string
  durationMinutes: number;
  status: AppointmentStatus;
  financialStatus: FinancialStatus;
  
  // Financial calculation breakdown
  freePrice: number;
  baseInsuranceCoverage: number;
  suppInsuranceCoverage: number;
  walletCreditApplied: number;
  initialPatientPaid: number;
  revisedPatientDue: number;
  debtOrCreditBalance: number; // Negative = debit, Positive = credit
  
  // Soft lock & emergency unlock controls
  isSoftLocked: boolean;
  emergencyUnlocked: boolean;
  emergencyUnlockReason?: string;
  emergencyUnlockedBy?: string;
  emergencyUnlockedAt?: string;

  // Documents and notes
  documents: MedicalDocument[];
  clinicalNote?: ClinicalNote;

  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorRole: Role;
  actorName: string;
  action: string;
  details: string;
  timestamp: string;
}

/**
 * Weekly doctor shift schedule (FLOW-05, S17)
 */
export interface DoctorShift {
  id: string;
  doctorId: string;
  doctorName: string;
  branchId: BranchId;
  dayOfWeek: number; // 0: شنبه, 1: یکشنبه, ..., 6: جمعه
  dayName: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "13:00"
  isActive: boolean;
}

/**
 * Doctor leave / shift modification request (FLOW-05, S17)
 */
export type LeaveStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface DoctorLeave {
  id: string;
  doctorId: string;
  doctorName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  affectedAppointmentsCount?: number;
}

/**
 * Clinic global settings for financial calculations and cancellation policies (DEC-FE-03, S17)
 */
export interface ClinicSettings {
  defaultTaxPercent: number;        // default: 10%
  cancellationThresholdHours: number; // default: 12h
  cancellationPenaltyPercent: number; // default: 50%
}

/**
 * Diff item representing changes between existing database tariffs and uploaded Excel
 */
export type DiffAction = 'NEW' | 'MODIFIED' | 'UNCHANGED';
export type DiffCategory = 'SERVICE' | 'SUPPLEMENTARY_RULE';

export interface TariffDiffItem {
  id: string;
  category: DiffCategory;
  action: DiffAction;
  code: string;
  title: string;
  branchOrDetails: string;
  oldValueDescription?: string;
  newValueDescription: string;
  rawNewData: any;
}

