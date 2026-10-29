import { memoryDb } from '../db/memoryDb';
import { Wallet } from '@/shared/types';

export const walletRepository = {
  getByPatientId(patientId: string): Wallet | undefined {
    return memoryDb.getAll('wallets').find((w) => w.patientId === patientId);
  },

  adjustBalance(
    patientId: string,
    delta: number, // Positive adds credit, negative adds debit
    _description: string,
    _appointmentId?: string
  ): Wallet {
    const wallets = memoryDb.getAll('wallets');
    let wallet = wallets.find((w) => w.patientId === patientId);

    if (!wallet) {
      wallet = {
        id: `wal-${Date.now()}`,
        patientId,
        balance: delta,
        currency: 'TOMAN',
      };
      return memoryDb.insert('wallets', wallet);
    }

    const newBalance = wallet.balance + delta;
    return memoryDb.update('wallets', wallet.id, { balance: newBalance });
  },
};
