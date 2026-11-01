import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Appointment } from '@/shared/types';
import { useWorkspaceOverlay } from '@/shared/hooks/useWorkspaceOverlay';
import { formatDateTime } from '@/shared/utils/formatters';

interface PrescriptionModalProps {
  appointment: Pick<Appointment, 'trackingCode' | 'doctorName' | 'dateTime'>;
  note: Pick<NonNullable<Appointment['clinicalNote']>, 'prescriptions' | 'followUp'>;
  onClose: () => void;
}

export function PrescriptionModal({ appointment, note, onClose }: PrescriptionModalProps) {
  const dialogRef = useWorkspaceOverlay(onClose, true);
  return createPortal(<div className="patient-cancel-dialog" onClick={onClose}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="patient-prescription-title" tabIndex={-1} className="patient-cancel-panel patient-prescription-panel" dir="rtl" onClick={event => event.stopPropagation()}>
      <div className="patient-prescription-heading">
        <h2 id="patient-prescription-title">نسخه و توصیه‌های پزشک</h2>
        <button type="button" className="patient-cancel-close" aria-label="بستن نسخه" onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </div>
      <p>{appointment.doctorName}</p>
      <p className="patient-prescription-context">{formatDateTime(appointment.dateTime)} · <bdi>{appointment.trackingCode}</bdi></p>
      <section className="patient-prescription" aria-label="نسخه و توصیه‌های پزشک">
        <dl>
          <div><dt>دارو و نسخه:</dt><dd>{note.prescriptions || 'نسخه‌ای ثبت نشده است.'}</dd></div>
          <div><dt>دستور پیگیری:</dt><dd>{note.followUp || 'دستور پیگیری ثبت نشده است.'}</dd></div>
        </dl>
      </section>
      <p className="patient-prescription-context">اطلاعات این بخش فقط شامل نسخه و دستور پیگیری شماست.</p>
      <button type="button" className="patient-button patient-prescription-done" onClick={onClose}>بستن</button>
    </div>
  </div>, document.body);
}
