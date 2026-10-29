import { memoryDb } from '../db/memoryDb';
import { Doctor, BranchId } from '@/shared/types';

export const doctorRepository = {
  getAll(): Doctor[] {
    return memoryDb.getAll('doctors');
  },

  getById(id: string): Doctor | undefined {
    return memoryDb.getById('doctors', id);
  },

  getByBranch(branchId: BranchId): Doctor[] {
    return memoryDb.getAll('doctors').filter((doc) => doc.branches.includes(branchId));
  },
};
