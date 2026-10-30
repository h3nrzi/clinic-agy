import { calculateDoctorShare } from '@/features/financial-dashboard/logic/doctorShareCalculator';
import { memoryDb } from '@/mocks/db/memoryDb';
import { formatToman } from '@/shared/utils/formatters';
import type { Appointment, Doctor } from '@/shared/types';
export function DoctorFinancialSummary({appointments,doctor}:{appointments:Appointment[];doctor:Doctor}) {
  const eligible=appointments.filter(a=>a.status==='COMPLETED'||a.status==='CONFIRMED');
  const share=calculateDoctorShare({grossAmount:eligible.reduce((n,a)=>n+a.freePrice,0),consumables:eligible.reduce((n,a)=>n+(memoryDb.getAll('services').find(s=>s.id===a.serviceId)?.consumableCost||0),0),docPercent:doctor.sharePercentage*100,taxPercent:memoryDb.getSettings().defaultTaxPercent});
  return <section className="doctor-finance" aria-label="خلاصه مالی پزشک"><div><h3>خلاصه کارکرد شما</h3><p>نوبت‌های تأییدشده و تکمیل‌شده • تمام تاریخ‌ها</p></div><dl><div><dt>سهم ناخالص</dt><dd>{formatToman(share.docGrossShare)}</dd></div><div><dt>مالیات کسرشده</dt><dd>{formatToman(share.taxAmount)}</dd></div><div><dt>خالص قابل پرداخت</dt><dd>{formatToman(share.docNetShare)}</dd></div></dl></section>;
}
