import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { calculateDoctorShare } from '../logic/doctorShareCalculator';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import { Clock, Coins, Percent, Receipt, TrendingUp, UserCheck, Users } from 'lucide-react';
import { OperationsOverview } from './OperationsOverview';

export const FinanceOverview: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [, refresh] = useState(0);
  useEffect(() => memoryDb.subscribe(() => refresh(version => version + 1)), []);
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
    (a) => a.status === 'COMPLETED' || a.status === 'CONFIRMED'
  );

  const totalGrossRevenue = completedOrConfirmed.reduce((sum, a) => sum + a.freePrice, 0);

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

  const aggregateDoctorGross = doctorFinancialRows.reduce((sum, r) => sum + r.shareResult.docGrossShare, 0);
  const aggregateTaxWithheld = doctorFinancialRows.reduce((sum, r) => sum + r.shareResult.taxAmount, 0);
  const aggregateDoctorNetPayable = doctorFinancialRows.reduce((sum, r) => sum + r.shareResult.docNetShare, 0);
  const aggregateClinicShare = doctorFinancialRows.reduce((sum, r) => sum + r.shareResult.clinicShare, 0);

  return (
    <div data-testid="financial-dashboard" className="space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                مدیریت مالی و عملکرد کلینیک
              </h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full border border-indigo-200 font-semibold">
                گزارش عملیاتی
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مدیر مالی / ادمین: <strong>{currentUser.name}</strong> • گزارش کارکرد پزشکان، مدیریت تعرفه‌ها و برنامه‌ریزی شیفت‌ها
            </p>
          </div>
        </div>

        {/* Global Settings Quick Status */}
        <div className="flex items-center gap-2 text-xs self-start md:self-auto">
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 font-semibold">
            <Percent className="w-3.5 h-3.5 text-teal-600" />
            <span>مالیات پزشک: {toPersianDigits(taxPercent)}٪</span>
          </span>
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>مرز لغو: {toPersianDigits(cancelHours)} ساعت ({toPersianDigits(penaltyPercent)}٪)</span>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>کل درآمد ناخالص خدمات</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {formatToman(totalGrossRevenue)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              از {toPersianDigits(completedOrConfirmed.length)} نوبت تأییدشده
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>مجموع سهم ناخالص پزشکان</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-700">
              {formatToman(aggregateDoctorGross)}
            </div>
            <div className="text-[11px] text-indigo-600/80 mt-1">
              بر اساس فرمول: (درآمد - مصرفی) × درصد
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>مالیات کسرشده</span>
              <Percent className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-700">
              {formatToman(aggregateTaxWithheld)}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1">
              کسورات قانونی نمایشی در گزارش
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>خالص پرداختی به پزشکان</span>
              <Receipt className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-700">
              {formatToman(aggregateDoctorNetPayable)}
            </div>
            <div className="text-[11px] text-emerald-600/80 mt-1">
              سهم کلینیک: {formatToman(aggregateClinicShare)}
            </div>
          </div>
        </div>

        <OperationsOverview appointments={allAppointments} />
        {/* Doctor Performance & Share Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-600" />
                جدول تفکیک کارکرد و سهم مالی پزشکان
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                فرمول: سهم ناخالص = (مجموع تعرفه خدمت - مواد مصرفی) × درصد توافقی | خالص = ناخالص - مالیات ۱۰٪
              </p>
            </div>

            <span className="text-slate-500 text-xs">
              {toPersianDigits(allDoctors.length)} پزشک فعال
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">نام پزشک معالج</th>
                  <th className="py-3 px-4">تخصص و نظام</th>
                  <th className="py-3 px-4">درصد سهم</th>
                  <th className="py-3 px-4">تعداد ویزیت</th>
                  <th className="py-3 px-4">درآمد کل</th>
                  <th className="py-3 px-4">مواد مصرفی</th>
                  <th className="py-3 px-4">سهم ناخالص پزشک</th>
                  <th className="py-3 px-4">مالیات ۱۰٪</th>
                  <th className="py-3 px-4">خالص پرداختی پزشک</th>
                  <th className="py-3 px-4">سهم کلینیک</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {doctorFinancialRows.map(({ doctor, visitCount, grossDocTotal, consumablesTotal, shareResult }) => (
                  <tr key={doctor.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {doctor.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {doctor.specialty}
                    </td>
                    <td className="py-3 px-4 font-bold text-teal-700 font-mono">
                      {toPersianDigits(Math.round(doctor.sharePercentage * 100))}٪
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {toPersianDigits(visitCount)} نوبت
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {formatToman(grossDocTotal)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatToman(consumablesTotal)}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {formatToman(shareResult.docGrossShare)}
                    </td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">
                      {formatToman(shareResult.taxAmount)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700 text-sm">
                      {formatToman(shareResult.docNetShare)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {formatToman(shareResult.clinicShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
