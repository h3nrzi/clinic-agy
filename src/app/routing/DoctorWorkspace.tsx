import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { DoctorDashboard } from '@/features/teleconsultation';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { memoryDb } from '@/mocks/db/memoryDb';

export function DoctorWorkspace({ section }: { section: 'APPOINTMENTS' | 'SHIFTS_AND_LEAVES' }) {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  useEffect(() => memoryDb.subscribe(() => {
    refresh(v => v + 1);
  }), []);
  return <DoctorDashboard section={section} doctorName={currentUser.name} appointments={appointmentRepository.getAll().filter(a => a.doctorId === currentUser.id || !a.doctorId)} onStartConsultation={appointment => navigate(`/doctor/consultations/${encodeURIComponent(appointment.id)}`)} />;
}
