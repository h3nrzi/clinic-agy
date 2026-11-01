import { useEffect, useState } from 'react';
import { DoctorDashboard, ConsultationRoom } from '@/features/teleconsultation';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { memoryDb } from '@/mocks/db/memoryDb';
import type { Appointment } from '@/shared/types';

export function DoctorWorkspace({ section }: { section: 'APPOINTMENTS' | 'SHIFTS_AND_LEAVES' }) {
  const { currentUser } = useAuthStore();
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [, refresh] = useState(0);
  useEffect(() => memoryDb.subscribe(() => {
    refresh(v => v + 1);
    setActiveAppointment(current => current ? appointmentRepository.getById(current.id) || null : null);
  }), []);
  if (activeAppointment && section === 'APPOINTMENTS') return <ConsultationRoom appointment={activeAppointment} doctorName={currentUser.name} onBack={() => setActiveAppointment(null)} />;
  return <DoctorDashboard section={section} doctorName={currentUser.name} appointments={appointmentRepository.getAll().filter(a => a.doctorId === currentUser.id || !a.doctorId)} onStartConsultation={setActiveAppointment} />;
}
