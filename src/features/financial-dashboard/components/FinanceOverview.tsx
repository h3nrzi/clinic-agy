import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { calculateDoctorShare } from '../logic/doctorShareCalculator';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import { Coins } from 'lucide-react';
import './financeReports.css';
import { OperationsOverview } from './OperationsOverview';

export const FinanceOverview: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [, refresh] = useState(0);
  useEffect(
    () => memoryDb.subscribe(() => refresh((version) => version + 1)),
    [],
  );
  const {
    defaultTaxPercent: taxPercent,
    cancellationThresholdHours: cancelHours,
    cancellationPenaltyPercent: penaltyPercent,
  } = memoryDb.getSettings();
  const allAppointments = appointmentRepository.getAll();
  const allDoctors = doctorRepository.getAll();
  const allServices = tariffRepository.getServices();

  // Financial KPI calculations
  const completedOrConfirmed = allAppointments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED',
  );

  const totalGrossRevenue = completedOrConfirmed.reduce(
    (sum, a) => sum + a.freePrice,
    0,
  );

  // Calculate doctor-by-doctor performance
  const doctorFinancialRows = useMemo(() => {
    return allDoctors.map((doc) => {
      const docApps = completedOrConfirmed.filter((a) => a.doctorId === doc.id);
      const visitCount = docApps.length;

      let grossDocTotal = 0;
      let consumablesTotal = 0;

      for (const app of docApps) {
        grossDocTotal += app.freePrice;
        const srv = allServices.find((s) => s.id === app.serviceId);
        consumablesTotal += srv ? srv.consumableCost : 0;
      }

      const shareResult = calculateDoctorShare({
        grossAmount: grossDocTotal,
        consumables: consumablesTotal,
        docPercent: doc.sharePercentage * 100,
        taxPercent: taxPercent,
      });

      return {
        doctor: doc,
        visitCount,
        grossDocTotal,
        consumablesTotal,
        shareResult,
      };
    });
  }, [allDoctors, completedOrConfirmed, allServices, taxPercent]);

  const aggregateDoctorGross = doctorFinancialRows.reduce(
    (sum, r) => sum + r.shareResult.docGrossShare,
    0,
  );
  const aggregateTaxWithheld = doctorFinancialRows.reduce(
    (sum, r) => sum + r.shareResult.taxAmount,
    0,
  );
  const aggregateDoctorNetPayable = doctorFinancialRows.reduce(
    (sum, r) => sum + r.shareResult.docNetShare,
    0,
  );
  const aggregateClinicShare = doctorFinancialRows.reduce(
    (sum, r) => sum + r.shareResult.clinicShare,
    0,
  );

  const metrics = [
    {
      label: 'کل درآمد ناخالص خدمات',
      value: totalGrossRevenue,
      note: `از ${toPersianDigits(completedOrConfirmed.length)} نوبت تأییدشده یا تکمیل‌شده`,
    },
    {
      label: 'مجموع سهم ناخالص پزشکان',
      value: aggregateDoctorGross,
      note: '(درآمد − مصرفی) × درصد توافقی',
    },
    {
      label: 'مالیات کسرشده',
      value: aggregateTaxWithheld,
      note: `${toPersianDigits(taxPercent)}٪ از سهم ناخالص پزشک؛ محاسبه نمایشی`,
    },
    {
      label: 'خالص پرداختی به پزشکان',
      value: aggregateDoctorNetPayable,
      note: 'مبلغ قابل پرداخت محاسبه‌شده؛ پس از کسر مالیات',
    },
  ];
  return (
    <div data-testid="financial-dashboard" className="finance-reports">
      <header className="finance-report-heading">
        <div>
          <p className="finance-eyebrow">
            <Coins size={18} aria-hidden="true" /> گزارش عملیاتی / مدیر مالی:{' '}
            {currentUser.name}
          </p>
          <h2>مدیریت مالی و عملکرد کلینیک</h2>
          <p>درآمد خدمات، تعهدات و سهم پزشکان در یک نگاه</p>
        </div>
        <div className="finance-settings">
          <span>مالیات پزشک: {toPersianDigits(taxPercent)}٪</span>
          <span>
            مرز لغو: {toPersianDigits(cancelHours)} ساعت (
            {toPersianDigits(penaltyPercent)}٪)
          </span>
        </div>
      </header>
      <section
        aria-label="خلاصه مالی کل کلینیک"
        className="finance-clinic-summary"
      >
        <div className="finance-section-heading">
          <h3>خلاصه مالی کل کلینیک</h3>
          <p>
            همه شعب • تمام تاریخ‌های ثبت‌شده • مستقل از فیلتر شعبه • واحد مبالغ:
            تومان
          </p>
        </div>
        <div className="finance-kpis">
          {metrics.map((m) => (
            <article key={m.label}>
              <h4>{m.label}</h4>
              <strong>{formatToman(m.value)}</strong>
              <p>{m.note}</p>
            </article>
          ))}
        </div>
        <p className="finance-summary-note">
          سهم کلینیک پس از کسر مصرفی و سهم پزشکان:{' '}
          <strong>{formatToman(aggregateClinicShare)}</strong>
        </p>
      </section>
      <OperationsOverview appointments={allAppointments} />
      <section
        aria-label="سهم پزشکان کل کلینیک"
        className="finance-doctor-panel"
      >
        <div className="finance-section-heading">
          <div>
            <h3>جدول تفکیک کارکرد و سهم مالی پزشکان</h3>
            <p>
              کل کلینیک • همه شعب • تمام تاریخ‌های ثبت‌شده • مستقل از فیلتر شعبه
            </p>
          </div>
          <span>{toPersianDigits(allDoctors.length)} پزشک</span>
        </div>
        <p className="finance-formula">
          سهم ناخالص = (مجموع تعرفه خدمت − مواد مصرفی) × درصد توافقی؛ خالص =
          ناخالص − مالیات {toPersianDigits(taxPercent)}٪
        </p>
        {!completedOrConfirmed.length && (
          <p className="analytics-empty">
            هنوز نوبت تأییدشده یا تکمیل‌شده‌ای برای محاسبه سهم ثبت نشده است.
          </p>
        )}
        <p id="finance-table-help" className="finance-table-help">
          مبالغ به تومان است. در نمایشگر کوچک، جدول را افقی پیمایش کنید.
        </p>
        <div
          className="finance-table-scroll"
          role="region"
          aria-label="جدول سهم پزشکان"
          aria-describedby="finance-table-help"
          tabIndex={0}
        >
          <table className="finance-doctor-table">
            <caption>
              کارکرد نوبت‌های تأییدشده و تکمیل‌شده • مبالغ به تومان
            </caption>
            <thead>
              <tr>
                {[
                  'نام پزشک معالج',
                  'تخصص',
                  'درصد سهم',
                  'تعداد ویزیت',
                  'درآمد کل',
                  'مواد مصرفی',
                  'سهم ناخالص پزشک',
                  `مالیات ${toPersianDigits(taxPercent)}٪`,
                  'خالص پرداختی پزشک',
                  'سهم کلینیک',
                ].map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctorFinancialRows.map(
                ({
                  doctor,
                  visitCount,
                  grossDocTotal,
                  consumablesTotal,
                  shareResult,
                }) => (
                  <tr key={doctor.id}>
                    <th scope="row">{doctor.name}</th>
                    <td>{doctor.specialty}</td>
                    <td>
                      {toPersianDigits(
                        Math.round(doctor.sharePercentage * 100),
                      )}
                      ٪
                    </td>
                    <td>{toPersianDigits(visitCount)} نوبت</td>
                    <td>{formatToman(grossDocTotal)}</td>
                    <td>{formatToman(consumablesTotal)}</td>
                    <td>{formatToman(shareResult.docGrossShare)}</td>
                    <td>{formatToman(shareResult.taxAmount)}</td>
                    <td className="finance-net">
                      {formatToman(shareResult.docNetShare)}
                    </td>
                    <td>{formatToman(shareResult.clinicShare)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
