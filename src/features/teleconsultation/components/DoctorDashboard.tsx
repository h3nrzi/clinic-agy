import React, { useState } from 'react';
import {
  UserCheck,
  Video,
  Calendar,
  CheckCircle2,
  Building,
  Search,
} from 'lucide-react';
import { Appointment } from '@/shared/types';
import { formatDateTime, toPersianDigits } from '@/shared/utils/formatters';

interface DoctorDashboardProps {
  doctorName: string;
  medicalCouncilNumber?: string;
  specialty?: string;
  appointments: Appointment[];
  onStartConsultation: (appointment: Appointment) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorName,
  medicalCouncilNumber = '۱۲۳۴۵-ن',
  specialty = 'متخصص داخلی و تله‌مدیسین',
  appointments,
  onStartConsultation,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ONLINE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = appointments.filter((app) => {
    if (filterType === 'ONLINE' && app.branchId !== 'ONLINE') return false;
    if (filterType === 'COMPLETED' && app.status !== 'COMPLETED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.patientName.toLowerCase().includes(q);
      const matchTrack = app.trackingCode.toLowerCase().includes(q);
      if (!matchName && !matchTrack) return false;
    }
    return true;
  });

  const totalToday = appointments.length;
  const onlineCount = appointments.filter((a) => a.branchId === 'ONLINE').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const pendingCount = totalToday - completedCount;

  return (
    <div
      data-testid="doctor-dashboard"
      className="space-y-6 text-slate-800"
    >
      {/* Doctor Profile Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-lg">{doctorName}</h2>
              <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {specialty}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              شماره نظام پزشکی: <strong className="font-mono text-slate-700">{medicalCouncilNumber}</strong> • شعبهٔ فعال: آنلاین و تهران
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            اتاق ویزیت فعال و آماده (WP-04)
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">کل نوبت‌های امروز</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{toPersianDigits(totalToday)}</div>
          <div className="text-[11px] text-slate-400 mt-1">حضوری و آنلاین</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">ویزیت‌های تصویری آنلاین</div>
          <div className="text-2xl font-bold text-teal-700 mt-2">{toPersianDigits(onlineCount)}</div>
          <div className="text-[11px] text-teal-600/80 mt-1">تله‌مدیسین بدون ضبط</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">ویزیت‌های تکمیل‌شده</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{toPersianDigits(completedCount)}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1">دارای پرونده بالینی ۵ فیلدی</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">در انتظار ویزیت</div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{toPersianDigits(pendingCount)}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">آماده پذیرش</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'ALL'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه نوبت‌ها ({toPersianDigits(totalToday)})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('ONLINE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'ONLINE'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            فقط ویزیت آنلاین ({toPersianDigits(onlineCount)})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'COMPLETED'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            تکمیل‌شده‌ها ({toPersianDigits(completedCount)})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام بیمار یا کد رهگیری..."
            className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>لیست نوبت‌های کارتابل پزشک (SCREEN-06)</span>
          </h3>
          <span className="text-xs text-slate-500">
            نمایش {toPersianDigits(filteredAppointments.length)} از {toPersianDigits(appointments.length)}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              نوبتی با این مشخصات یافت نشد.
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div
                key={app.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{app.patientName}</span>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                      {app.trackingCode}
                    </span>
                    {app.branchId === 'ONLINE' ? (
                      <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                        <Video className="w-3 h-3" /> ویزیت آنلاین
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                        <Building className="w-3 h-3" /> حضوری
                      </span>
                    )}

                    {app.status === 'COMPLETED' ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ویزیت تکمیل‌شده
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
                        {app.status === 'CONFIRMED' ? 'آماده پذیرش' : app.status}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>خدمت: <strong>{app.serviceName}</strong></span>
                    <span>•</span>
                    <span>زمان: <strong>{formatDateTime(app.dateTime)}</strong></span>
                    <span>•</span>
                    <span>مدارک ارسالی: <strong>{toPersianDigits(app.documents.length)} مدرک</strong></span>
                  </div>

                  {/* Summary of Clinical Note if completed */}
                  {app.clinicalNote && (
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                      <div>
                        <strong>تشخیص پزشک:</strong> {app.clinicalNote.diagnosis}
                      </div>
                      <div className="text-slate-600">
                        <strong>نسخه:</strong> {app.clinicalNote.prescriptions}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0 flex items-center gap-2">
                  {app.branchId === 'ONLINE' ? (
                    <button
                      type="button"
                      onClick={() => onStartConsultation(app)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                        app.status === 'COMPLETED'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{app.status === 'COMPLETED' ? 'مشاهده / ویرایش پرونده' : 'شروع ویزیت تصویری'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="bg-slate-100 text-slate-400 px-3 py-2 rounded-xl text-xs font-semibold cursor-not-allowed"
                    >
                      ویزیت حضوری شعبه
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
