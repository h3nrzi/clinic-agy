import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { memoryDb } from '@/mocks/db/memoryDb';
import { ConsultationRoom, PatientConsultationRoom } from '@/features/teleconsultation';
import { dashboardPath } from './roleRoutes';
import { canOpenConsultation } from './consultationAccess';

export function ConsultationRoute() {
  const { appointmentId } = useParams();
  const { currentRole, currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  useEffect(() => memoryDb.subscribe(() => refresh(value => value + 1)), []);
  const appointment = appointmentRepository.getById(appointmentId || '');
  const back = dashboardPath(currentRole);
  if (!appointment || !canOpenConsultation(appointment, currentRole, currentUser.id)) return (
    <section className="access-message" dir="rtl">
      <h1>اتاق ویزیت در دسترس نیست</h1>
      <p>نوبت پیدا نشد یا شرایط ورود با حساب شما برقرار نیست.</p>
      <Link className="public-primary" to={back}>بازگشت به فضای کار من</Link>
    </section>
  );
  const key = `${currentUser.id}:${appointment.id}`;
  return currentRole === 'DOCTOR'
    ? <ConsultationRoom key={key} appointment={appointment} doctorName={currentUser.name} onBack={() => navigate(back)} />
    : <PatientConsultationRoom key={key} appointment={appointment} onExit={() => navigate(back)} />;
}
