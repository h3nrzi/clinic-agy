import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DoctorDashboard } from '@/features/teleconsultation/components/DoctorDashboard';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import type { AppointmentStatus } from '@/shared/types';

const now = new Date('2026-11-01T12:00:00Z');

beforeEach(() => {
  memoryDb.resetToFactoryDefaults();
  vi.spyOn(Date, 'now').mockReturnValue(now.getTime());
});
afterEach(() => vi.restoreAllMocks());

function showAppointment(status: AppointmentStatus, dateTime: string) {
  const base = appointmentRepository.getById('app-1');
  if (!base) throw new Error('Missing seeded appointment');
  const appointment = { ...base, status, dateTime };
  const onStartConsultation = vi.fn();
  render(<DoctorDashboard doctorName={base.doctorName} appointments={[appointment]} onStartConsultation={onStartConsultation} />);
  return { appointment, onStartConsultation };
}

describe('doctor consultation actions', () => {
  it.each<AppointmentStatus>(['CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'PENDING_PAYMENT'])(
    'hides the start action for %s appointments even after their scheduled time', status => {
      showAppointment(status, '2026-11-01T11:00:00Z');
      expect(screen.queryByRole('button', { name: 'شروع ویزیت تصویری' })).toBeNull();
    },
  );
  it.each<AppointmentStatus>(['CONFIRMED', 'IN_CONSULTATION'])(
    'hides the start action before the scheduled time for %s', status => {
      showAppointment(status, '2026-11-01T12:00:01Z');
      expect(screen.queryByRole('button', { name: 'شروع ویزیت تصویری' })).toBeNull();
    },
  );
  it.each(['2026-11-01T12:00:00Z', '2026-11-01T11:00:00Z', '2026-11-01T15:30:00+03:30'])(
    'starts a confirmed appointment at or after its scheduled time (%s)', dateTime => {
      const { appointment, onStartConsultation } = showAppointment('CONFIRMED', dateTime);
      fireEvent.click(screen.getByRole('button', { name: 'شروع ویزیت تصویری' }));
      expect(onStartConsultation).toHaveBeenCalledWith(appointment);
    },
  );
  it('keeps completed clinical records available', () => {
    showAppointment('COMPLETED', '2026-11-01T11:00:00Z');
    expect(screen.queryByRole('button', { name: 'شروع ویزیت تصویری' })).toBeNull();
    expect(screen.getByRole('button', { name: 'مشاهده / ویرایش پرونده' })).toBeDefined();
  });
  it('hides the start action for an invalid scheduled time', () => {
    showAppointment('CONFIRMED', 'invalid');
    expect(screen.queryByRole('button', { name: 'شروع ویزیت تصویری' })).toBeNull();
  });
});
