import { describe, it, expect, beforeEach } from 'vitest';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';

describe('WP-00: In-Memory Mock Database & Repository Layer', () => {
  beforeEach(() => {
    // Ensure clean state before each test
    memoryDb.resetToFactoryDefaults();
  });

  it('initializes seed data correctly', () => {
    const branches = memoryDb.getAll('branches');
    expect(branches.length).toBe(3);
    expect(branches.map((b) => b.id)).toEqual(['TEHRAN', 'ISFAHAN', 'ONLINE']);

    const doctors = doctorRepository.getAll();
    expect(doctors.length).toBe(4);
    expect(doctors[0].name).toBe('دکتر مریم احمدی');

    const services = tariffRepository.getServices();
    expect(services.length).toBeGreaterThanOrEqual(4);

    const appointments = appointmentRepository.getAll();
    expect(appointments.length).toBeGreaterThanOrEqual(4);

    const wallets = memoryDb.getAll('wallets');
    expect(wallets.length).toBe(3);
  });

  it('performs CRUD operations and persists changes', () => {
    // 1. Insert
    const newService = {
      id: 'srv-test-99',
      name: 'آزمایش تست تیروئید',
      code: 'SRV-TEST-99',
      category: 'PARAMEDICAL' as const,
      branch: 'ALL' as const,
      durationMinutes: 10,
      freePrice: 150000,
      consumableCost: 20000,
      isActive: true,
    };
    memoryDb.insert('services', newService);
    expect(tariffRepository.getServiceById('srv-test-99')).toBeDefined();

    // 2. Update
    memoryDb.update('services', 'srv-test-99', { freePrice: 180000 });
    const updated = tariffRepository.getServiceById('srv-test-99');
    expect(updated?.freePrice).toBe(180000);

    // 3. Delete
    const deleted = memoryDb.delete('services', 'srv-test-99');
    expect(deleted).toBe(true);
    expect(tariffRepository.getServiceById('srv-test-99')).toBeUndefined();
  });

  it('corrects insurance manually and calculates correct delta and financial status', () => {
    // Initial appointment AGY-10142: FreePrice 280,000, Paid 58,800
    const app = appointmentRepository.getById('app-1');
    expect(app).toBeDefined();

    // Secretary corrects base coverage to 50,000 and supp to 0
    // newPatientDue = 280,000 - 50,000 = 230,000
    // delta = initialPaid (58,800) - newPatientDue (230,000) = -171,200 (debit)
    const result = appointmentRepository.correctInsurance('app-1', 50000, 0, 'منشی تست');
    expect(result.delta).toBe(-171200);
    expect(result.appointment.financialStatus).toBe('DEBIT');
    expect(result.appointment.debtOrCreditBalance).toBe(-171200);
    expect(result.appointment.isSoftLocked).toBe(true); // online appointment becomes soft-locked

    // Verify audit log entry was recorded
    const logs = memoryDb.getAll('auditLogs');
    const latestLog = logs[logs.length - 1];
    expect(latestLog.action).toBe('INSURANCE_CORRECTION');
    expect(latestLog.actorName).toBe('منشی تست');
  });

  it('executes emergency unlock for soft-locked appointments with mandatory reason', () => {
    // App-2 is initially soft-locked (Mehdi Saeidi debit)
    const appBefore = appointmentRepository.getById('app-2');
    expect(appBefore?.isSoftLocked).toBe(true);

    const unlocked = appointmentRepository.emergencyUnlock(
      'app-2',
      'بیمار سالمند با همراهی فرزند، هماهنگی پرداخت انجام شد',
      'منشی شعبه تهران'
    );

    expect(unlocked.isSoftLocked).toBe(false);
    expect(unlocked.emergencyUnlocked).toBe(true);
    expect(unlocked.emergencyUnlockReason).toContain('بیمار سالمند');

    // Verify audit log
    const logs = memoryDb.getAll('auditLogs');
    const unlockLog = logs.find((l) => l.action === 'EMERGENCY_UNLOCK');
    expect(unlockLog).toBeDefined();
    expect(unlockLog?.actorRole).toBe('SECRETARY_TEHRAN');
  });

  it('adjusts wallet balance accurately for patient', () => {
    // Patient 1 starts with 0
    const initialWallet = walletRepository.getByPatientId('pat-1');
    expect(initialWallet?.balance).toBe(0);

    // Add credit of 50,000
    const credited = walletRepository.adjustBalance('pat-1', 50000, 'واریز بستانکاری تست');
    expect(credited.balance).toBe(50000);

    // Apply debit of 20,000
    const debited = walletRepository.adjustBalance('pat-1', -20000, 'کسر هزینه تست');
    expect(debited.balance).toBe(30000);
  });

  it('performs factory reset and wipes modifications back to seed state', () => {
    // Add temporary record
    memoryDb.insert('doctors', {
      id: 'doc-temp',
      name: 'پزشک موقت',
      medicalCouncilNumber: '99999',
      specialty: 'عمومی',
      branches: ['TEHRAN'],
      consultationFee: 100000,
      sharePercentage: 0.5,
      avatar: '',
      isAvailable: true,
    });
    expect(doctorRepository.getById('doc-temp')).toBeDefined();

    // Trigger factory reset
    memoryDb.resetToFactoryDefaults();

    // Verify doc-temp is gone
    expect(doctorRepository.getById('doc-temp')).toBeUndefined();
    // Verify doctors count is restored to 4
    expect(doctorRepository.getAll().length).toBe(4);
  });
});
