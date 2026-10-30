import {
  Branch,
  Doctor,
  ServiceTariff,
  BaseInsurance,
  SupplementaryInsurance,
  PatientProfile,
  Wallet,
  Appointment,
  AuditLogEntry,
  DoctorShift,
  DoctorLeave,
  ClinicSettings,
} from '@/shared/types';
import {
  SEED_BRANCHES,
  SEED_DOCTORS,
  SEED_SERVICES,
  SEED_BASE_INSURANCES,
  SEED_SUPPLEMENTARY_INSURANCES,
  SEED_PATIENTS,
  SEED_WALLETS,
  SEED_APPOINTMENTS,
  SEED_AUDIT_LOGS,
  SEED_DOCTOR_SHIFTS,
  SEED_DOCTOR_LEAVES,
  SEED_CLINIC_SETTINGS,
} from './seedData';

export interface DbSchema {
  branches: Branch[];
  doctors: Doctor[];
  services: ServiceTariff[];
  baseInsurances: BaseInsurance[];
  supplementaryInsurances: SupplementaryInsurance[];
  patients: PatientProfile[];
  wallets: Wallet[];
  appointments: Appointment[];
  auditLogs: AuditLogEntry[];
  doctorShifts: DoctorShift[];
  doctorLeaves: DoctorLeave[];
  clinicSettings: ClinicSettings;
}

export type CollectionName =
  | 'branches'
  | 'doctors'
  | 'services'
  | 'baseInsurances'
  | 'supplementaryInsurances'
  | 'patients'
  | 'wallets'
  | 'appointments'
  | 'auditLogs'
  | 'doctorShifts'
  | 'doctorLeaves';


const STORAGE_KEY = 'clinic_agy_db_v1';

class MemoryDatabase {
  private data: DbSchema;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadInitialData();
  }

  private getInitialSeed(): DbSchema {
    return {
      branches: JSON.parse(JSON.stringify(SEED_BRANCHES)),
      doctors: JSON.parse(JSON.stringify(SEED_DOCTORS)),
      services: JSON.parse(JSON.stringify(SEED_SERVICES)),
      baseInsurances: JSON.parse(JSON.stringify(SEED_BASE_INSURANCES)),
      supplementaryInsurances: JSON.parse(JSON.stringify(SEED_SUPPLEMENTARY_INSURANCES)),
      patients: JSON.parse(JSON.stringify(SEED_PATIENTS)),
      wallets: JSON.parse(JSON.stringify(SEED_WALLETS)),
      appointments: JSON.parse(JSON.stringify(SEED_APPOINTMENTS)),
      auditLogs: JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)),
      doctorShifts: JSON.parse(JSON.stringify(SEED_DOCTOR_SHIFTS)),
      doctorLeaves: JSON.parse(JSON.stringify(SEED_DOCTOR_LEAVES)),
      clinicSettings: JSON.parse(JSON.stringify(SEED_CLINIC_SETTINGS)),
    };
  }

  private loadInitialData(): DbSchema {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object' && parsed.appointments) {
            // Ensure newly added fields exist if upgrading from older local storage
            return {
              ...this.getInitialSeed(),
              ...parsed,
              doctorShifts: parsed.doctorShifts || JSON.parse(JSON.stringify(SEED_DOCTOR_SHIFTS)),
              doctorLeaves: parsed.doctorLeaves || JSON.parse(JSON.stringify(SEED_DOCTOR_LEAVES)),
              clinicSettings: parsed.clinicSettings || JSON.parse(JSON.stringify(SEED_CLINIC_SETTINGS)),
            };
          }
        }
      } catch (err) {
        console.warn('Failed to load clinic database from localStorage, initializing fresh seed.', err);
      }
    }
    const seed = this.getInitialSeed();
    this.persist(seed);
    return seed;
  }

  private persist(data: DbSchema): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to persist database to localStorage', err);
      }
    }
  }

  private notify(): void {
    this.persist(this.data);
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in database subscriber', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getAll<K extends CollectionName>(collection: K): DbSchema[K] {
    return (this.data[collection] || []) as DbSchema[K];
  }

  public getById<K extends CollectionName>(
    collection: K,
    id: string
  ): DbSchema[K][number] | undefined {
    const list = this.data[collection] as Array<{ id: string }>;
    return list.find((item) => item.id === id) as DbSchema[K][number] | undefined;
  }

  public insert<K extends CollectionName>(
    collection: K,
    item: DbSchema[K][number]
  ): DbSchema[K][number] {
    const list = this.data[collection] as Array<DbSchema[K][number]>;
    list.push(item);
    this.notify();
    return item;
  }

  public update<K extends CollectionName>(
    collection: K,
    id: string,
    partial: Partial<DbSchema[K][number]>
  ): DbSchema[K][number] {
    const list = this.data[collection] as Array<{ id: string }>;
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Record with id ${id} not found in collection ${String(collection)}`);
    }
    const updated = { ...list[index], ...partial };
    list[index] = updated;
    this.notify();
    return updated as DbSchema[K][number];
  }

  public delete<K extends CollectionName>(collection: K, id: string): boolean {
    const list = this.data[collection] as Array<{ id: string }>;
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.notify();
    return true;
  }

  public getSettings(): ClinicSettings {
    return { ...this.data.clinicSettings };
  }

  public updateSettings(partial: Partial<ClinicSettings>): ClinicSettings {
    this.data.clinicSettings = { ...this.data.clinicSettings, ...partial };
    this.notify();
    return { ...this.data.clinicSettings };
  }

  public resetToFactoryDefaults(): void {
    this.data = this.getInitialSeed();
    this.notify();
  }

  public exportSnapshot(): DbSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public importSnapshot(snapshot: DbSchema): void {
    this.data = JSON.parse(JSON.stringify(snapshot));
    this.notify();
  }
}

export const memoryDb = new MemoryDatabase();
