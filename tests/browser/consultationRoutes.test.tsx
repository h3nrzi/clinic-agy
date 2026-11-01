import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';

describe('Independent authorized consultation URLs', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); useAuthStore.getState().switchRole('DOCTOR'); });
  it('opens the doctor room directly from the appointment URL', () => {
    renderApp('/doctor/consultations/app-1');
    expect(screen.getByTestId('doctor-consultation-room')).toBeDefined();
    expect(screen.getByText('AGY-10142')).toBeDefined();
  });
});

describe('Resource privacy before any room content', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); useAuthStore.getState().switchRole('PATIENT'); });
  it('opens and reopens the patient room with the same authorized session', () => {
    const view = renderApp('/patient/consultations/app-1');
    expect(screen.getByTestId('patient-consultation-room')).toBeDefined();
    view.unmount();
    renderApp('/patient/consultations/app-1');
    expect(screen.getByText('AGY-10142')).toBeDefined();
  });
  it.each([
    ['missing', {}], ['app-1', {patientId:'pat-other'}], ['app-1', {isSoftLocked:true}],
    ['app-1', {branchId:'TEHRAN'}], ['app-1', {status:'COMPLETED'}], ['app-1', {status:'IN_CONSULTATION'}],
  ])('denies an unavailable patient room %s %j', (id, patch) => {
    if (id === 'app-1') memoryDb.update('appointments', id, patch);
    renderApp(`/patient/consultations/${id}`);
    expect(screen.getByRole('heading', {name:'اتاق ویزیت در دسترس نیست'})).toBeDefined();
    expect(screen.queryByText('AGY-10142')).toBeNull();
    expect(screen.queryByTestId('patient-consultation-room')).toBeNull();
  });
  it('does not switch an active account from a room URL for another role', () => {
    renderApp('/doctor/consultations/app-1');
    expect(screen.getByRole('heading', {name:'به این صفحه دسترسی ندارید'})).toBeDefined();
    expect(screen.queryByText('AGY-10142')).toBeNull();
  });
  it('rejects another doctor but preserves completed and legacy unassigned visits', () => {
    useAuthStore.getState().switchRole('DOCTOR');
    memoryDb.update('appointments', 'app-1', {doctorId:'doc-other'});
    const view = renderApp('/doctor/consultations/app-1');
    expect(screen.queryByText('AGY-10142')).toBeNull();
    view.unmount();
    memoryDb.update('appointments', 'app-1', {doctorId:'', status:'COMPLETED'});
    renderApp('/doctor/consultations/app-1');
    expect(screen.getByTestId('doctor-consultation-room')).toBeDefined();
    expect(screen.getByRole('button', {name:'به‌روزرسانی پرونده بالینی'})).toBeDefined();
  });
});
