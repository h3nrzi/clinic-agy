import { useState } from 'react';
import type { Appointment, BranchId } from '@/shared/types';
import { memoryDb } from '@/mocks/db/memoryDb';
import {
  formatToman,
  toPersianDigits,
  formatDateTime,
} from '@/shared/utils/formatters';
import { Panel } from '@/shared/ui/Panel';

export function OperationsOverview({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [branch, setBranch] = useState<BranchId | 'ALL'>('ALL');
  const filtered = appointments.filter(
    (a) => branch === 'ALL' || a.branchId === branch,
  );
  const eligible = filtered.filter(
    (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED',
  );
  const branches = [
    { id: 'TEHRAN', name: 'تهران' },
    { id: 'ISFAHAN', name: 'اصفهان' },
    { id: 'ONLINE', name: 'آنلاین' },
  ];
  const revenue = branches.map((b) => ({
    ...b,
    value: eligible
      .filter((a) => a.branchId === b.id)
      .reduce((n, a) => n + a.freePrice, 0),
  }));
  const max = Math.max(1, ...revenue.map((b) => b.value));
  const insurance = eligible.reduce(
    (n, a) => n + a.baseInsuranceCoverage + a.suppInsuranceCoverage,
    0,
  );
  const balances = filtered.reduce(
    (n, a) => n + Math.max(0, -a.debtOrCreditBalance),
    0,
  );
  const credits = memoryDb
    .getAll('wallets')
    .reduce((n, w) => n + Math.max(0, w.balance), 0);
  const days = [...new Set(eligible.map((a) => a.dateTime.slice(0, 10)))]
    .sort()
    .slice(-7);
  const daily = days.map((day) => ({
    day,
    value: eligible
      .filter((a) => a.dateTime.startsWith(day))
      .reduce((n, a) => n + a.freePrice, 0),
  }));
  const dailyMax = Math.max(1, ...daily.map((d) => d.value));
  const scope = branches.find((b) => b.id === branch)?.name ?? 'همه شعب';
  const statuses: Record<Appointment['status'], string> = {
    IN_CONSULTATION: 'در حال ویزیت',
    CONFIRMED: 'تأییدشده',
    COMPLETED: 'تکمیل‌شده',
    PENDING_PAYMENT: 'در انتظار پرداخت',
    CANCELLED_BY_PATIENT: 'لغو توسط بیمار',
    CANCELLED_BY_CLINIC: 'لغو توسط کلینیک',
  };
  return (
    <section className="finance-operations" aria-label="تحلیل عملکرد کلینیک">
      <div className="analytics-heading">
        <div>
          <h2>نبض عملکرد کلینیک</h2>
          <p>
            تمام تاریخ‌های ثبت‌شده • درآمد خدمات تأییدشده و تکمیل‌شده، پیش از
            کسورات
          </p>
        </div>
        <label>
          محدوده گزارش
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as BranchId | 'ALL')}
          >
            <option value="ALL">همه شعب</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="finance-scope" role="status">
        محدوده فعلی: {scope}
      </p>
      <div className="analytics-metrics">
        {[
          {
            label: 'سهم بیمه در خدمات',
            value: insurance,
            note: 'نوبت‌های تأییدشده و تکمیل‌شده؛ پوشش محاسبه‌شده، وصول ثبت نمی‌شود',
          },
          {
            label: 'مانده بدهی نوبت‌ها',
            value: balances,
            note: 'تمام وضعیت‌های نوبت در شعبه انتخاب‌شده',
          },
          {
            label: 'اعتبار کیف پول بیماران',
            value: credits,
            note: 'کل کلینیک • مستقل از فیلتر شعبه',
          },
        ].map((m) => (
          <article key={m.label}>
            <p>{m.label}</p>
            <strong>{formatToman(m.value)}</strong>
            <small>{m.note}</small>
          </article>
        ))}
      </div>
      <div className="analytics-grid">
        <Panel
          title="درآمد خدمات به تفکیک تاریخ"
          description="آخرین ۷ تاریخ ثبت‌شده دارای نوبت واجد شرایط؛ نه یک هفته تقویمی • تومان"
        >
          {daily.length ? (
            <ol
              className="finance-daily-chart"
              aria-label="درآمد در آخرین تاریخ‌های ثبت‌شده"
            >
              {daily.map((d) => (
                <li key={d.day}>
                  <time dateTime={d.day}>
                    {new Date(`${d.day}T12:00:00`).toLocaleDateString('fa-IR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                  <div className="finance-daily-track" aria-hidden="true">
                    <div
                      style={{
                        width: `${Math.max(0, (d.value / dailyMax) * 100)}%`,
                      }}
                    />
                  </div>
                  <strong>{formatToman(d.value)}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="analytics-empty">
              در این محدوده درآمدی ثبت نشده است.
            </p>
          )}
        </Panel>
        <Panel
          title="مقایسه عملکرد شعب"
          description="ارزش ناخالص خدمات تأییدشده و تکمیل‌شده • در محدوده انتخاب‌شده"
        >
          <div className="branch-bars">
            {revenue.map((b) => (
              <div key={b.id}>
                <div>
                  <span>{b.name}</span>
                  <strong>{formatToman(b.value)}</strong>
                </div>
                <meter
                  min={0}
                  max={max}
                  value={b.value}
                  aria-label={`درآمد ${b.name}`}
                />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="analytics-grid">
        <Panel
          title="آخرین نوبت‌های مالی"
          description="مبالغ پرداخت اولیه؛ این فهرست دفتر تراکنش بانکی نیست"
        >
          <div
            className="finance-table-scroll"
            role="region"
            aria-label="آخرین نوبت‌های مالی"
            tabIndex={0}
          >
            <table className="finance-recent-table">
              <caption>
                پنج نوبت اخیر بر اساس زمان ایجاد در محدوده انتخاب‌شده
              </caption>
              <thead>
                <tr>
                  <th scope="col">کد پیگیری</th>
                  <th scope="col">تاریخ نوبت</th>
                  <th scope="col">وضعیت نوبت</th>
                  <th scope="col">پرداخت اولیه (تومان)</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .slice(0, 5)
                  .map((a) => (
                    <tr key={a.id}>
                      <td>
                        <bdi>{a.trackingCode}</bdi>
                      </td>
                      <td>{formatDateTime(a.dateTime)}</td>
                      <td>
                        <span className="finance-status">
                          {statuses[a.status]}
                        </span>
                      </td>
                      <td>{formatToman(a.initialPatientPaid)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!filtered.length && (
              <p className="analytics-empty">
                نوبتی در این محدوده ثبت نشده است.
              </p>
            )}
          </div>
        </Panel>
        <Panel
          title="موارد نیازمند پیگیری"
          description="وضعیت جاری در محدوده گزارش"
        >
          <ul className="operations-list">
            <li>
              <span>نوبت‌های دارای قفل بدهکاری</span>
              <strong>
                {toPersianDigits(filtered.filter((a) => a.isSoftLocked).length)}
              </strong>
            </li>
            <li>
              <span>نوبت‌های در انتظار پرداخت</span>
              <strong>
                {toPersianDigits(
                  filtered.filter((a) => a.status === 'PENDING_PAYMENT').length,
                )}
              </strong>
            </li>
            <li>
              <span>
                درخواست مرخصی در انتظار بررسی • کل کلینیک، مستقل از فیلتر
              </span>
              <strong>
                {toPersianDigits(
                  memoryDb
                    .getAll('doctorLeaves')
                    .filter((l) => l.status === 'PENDING_APPROVAL').length,
                )}
              </strong>
            </li>
          </ul>
        </Panel>
      </div>
    </section>
  );
}
