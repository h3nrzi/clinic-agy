import { memoryDb } from '../db/memoryDb';
import { ServiceTariff, BaseInsurance, SupplementaryInsurance, BranchId } from '@/shared/types';

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
};
