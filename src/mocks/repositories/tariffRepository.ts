import { memoryDb } from '../db/memoryDb';
import { ServiceTariff, BaseInsurance, SupplementaryInsurance, BranchId, UserRole } from '@/shared/types';

export const tariffRepository = {
  getServices(branchId?: BranchId): ServiceTariff[] {
    const list = memoryDb.getAll('services');
    if (!branchId) return list;
    return list.filter((s) => s.branch === 'ALL' || s.branch === branchId);
  },

  getServiceById(id: string): ServiceTariff | undefined {
    return memoryDb.getById('services', id);
  },

  getBaseInsurances(): BaseInsurance[] {
    return memoryDb.getAll('baseInsurances');
  },

  getBaseInsuranceById(id: string): BaseInsurance | undefined {
    return memoryDb.getById('baseInsurances', id);
  },

  getSupplementaryInsurances(): SupplementaryInsurance[] {
    return memoryDb.getAll('supplementaryInsurances');
  },

  getSupplementaryInsuranceById(id: string): SupplementaryInsurance | undefined {
    return memoryDb.getById('supplementaryInsurances', id);
  },

  updateService(id: string, partial: Partial<ServiceTariff>): ServiceTariff {
    return memoryDb.update('services', id, partial);
  },

  /**
   * Applies updates from 2-Sheet Excel import (FLOW-06 / AC-07)
   */
  applyTariffUpdates(
    newOrUpdatedServices: ServiceTariff[],
    newOrUpdatedSuppRules: SupplementaryInsurance[],
    appliedBy: string,
    role: UserRole = 'ADMIN_FINANCE'
  ): { appliedCount: number; timestamp: string } {
    const currentServices = memoryDb.getAll('services');
    const currentSupp = memoryDb.getAll('supplementaryInsurances');
    let count = 0;

    // Apply Services
    for (const srv of newOrUpdatedServices) {
      const existing = currentServices.find((s) => s.code === srv.code);
      if (existing) {
        memoryDb.update('services', existing.id, srv);
      } else {
        memoryDb.insert('services', srv);
      }
      count++;
    }

    // Apply Supplementary Rules
    for (const rule of newOrUpdatedSuppRules) {
      const existing = currentSupp.find((r) => r.code === rule.code);
      if (existing) {
        memoryDb.update('supplementaryInsurances', existing.id, rule);
      } else {
        memoryDb.insert('supplementaryInsurances', rule);
      }
      count++;
    }

    const timestamp = new Date().toISOString();
    memoryDb.insert('auditLogs', {
      id: `log-${Date.now()}`,
      actorRole: role,
      actorName: appliedBy,
      action: 'EXCEL_TARIFF_APPLIED',
      details: `اعمال نهایی فایل اکسل تعرفه‌ها شامل ${newOrUpdatedServices.length} خدمت و ${newOrUpdatedSuppRules.length} قاعده تکمیلی`,
      timestamp,
    });

    return { appliedCount: count, timestamp };
  },
};

