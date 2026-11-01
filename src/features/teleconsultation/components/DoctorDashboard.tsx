import './teleconsultation.css';
import { DoctorFinancialSummary } from './DoctorFinancialSummary';
import React, { useState } from 'react';
import {
  UserCheck,
  Video,
  Calendar,
  CheckCircle2,
  Building,
  Search,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '@/shared/types';
import { formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import { scheduleRepository } from '@/mocks/repositories/scheduleRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { DoctorLeaveRequestModal } from './DoctorLeaveRequestModal';

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'آماده پذیرش',
  IN_CONSULTATION: 'در حال ویزیت',
  COMPLETED: 'ویزیت تکمیل‌شده',
  CANCELLED_BY_PATIENT: 'لغوشده توسط بیمار',
  CANCELLED_BY_CLINIC: 'لغوشده توسط کلینیک',
};

interface DoctorDashboardProps {
  section?: 'APPOINTMENTS' | 'SHIFTS_AND_LEAVES';
  doctorName: string;
  medicalCouncilNumber?: string;
  specialty?: string;
  appointments: Appointment[];
  onStartConsultation: (appointment: Appointment) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorName,
  section: activeTab = 'APPOINTMENTS',
  medicalCouncilNumber = '۱۲۳۴۵-ن',
  specialty = 'متخصص داخلی و تله‌مدیسین',
  appointments,
  onStartConsultation,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'ONLINE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Find doctor record
  const allDocs = doctorRepository.getAll();
  const currentDoc = allDocs.find((d) => d.name === doctorName) || allDocs[0];
  const doctorShifts = scheduleRepository.getShifts({ doctorId: currentDoc?.id });
  const doctorLeaves = scheduleRepository.getLeaves({ doctorId: currentDoc?.id });

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
  const pendingCount = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'IN_CONSULTATION').length;

  return (
    <div
      data-testid="doctor-dashboard"
      className="doctor-workspace space-y-6 text-slate-800"
    >
      {/* Doctor Profile Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center text-white shadow-md">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-lg">{activeTab === 'APPOINTMENTS' ? 'کارتابل پزشک' : 'شیفت‌ها و مرخصی'}</h1><p className="doctor-name">{doctorName}</p>
              <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-medium">
                {specialty}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              شماره نظام پزشکی: <strong className="font-mono text-slate-700">{medicalCouncilNumber}</strong> • شعبهٔ فعال: آنلاین و تهران
            </p>
          </div>
        </div>
      </div>

      {currentDoc && <DoctorFinancialSummary doctor={currentDoc} appointments={appointments} />}
      {activeTab === 'SHIFTS_AND_LEAVES' ? (
        <div className="doctor-schedule-grid">
          {/* Shifts Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="doctor-schedule-header border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  برنامهٔ شیفت‌های ثابت هفتگی (مصوب ادمین و منشی ارشد)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الگوی زمانی حضور در شعب تهران، اصفهان یا سامانه ویزیت آنلاین
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {toPersianDigits(doctorShifts.length)} روز در هفته
              </span>
            </div>

            <div className="doctor-shift-list">
              {doctorShifts.length === 0 && (
                <p className="doctor-empty-state">شیفتی برای شما ثبت نشده است. برنامه پس از ثبت مسئول پذیرش یا مدیر اینجا نمایش داده می‌شود.</p>
              )}
              {doctorShifts.map((shift) => (
                <article
                  key={shift.id}
                  aria-label={`شیفت ${shift.dayName}`}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition text-xs space-y-2"
                >
                  <div className="doctor-shift-heading">
                    <span className="font-bold text-slate-900 text-sm">{shift.dayName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        shift.branchId === 'ONLINE'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {shift.branchId === 'ONLINE'
                        ? 'ویزیت آنلاین'
                        : shift.branchId === 'TEHRAN'
                        ? 'شعبه تهران'
                        : 'شعبه اصفهان'}
                    </span>
                  </div>

                  <div className="doctor-shift-time text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ساعت کاری:</span>
                    <span className="doctor-time-range">
                      <strong>{toPersianDigits(shift.startTime)}</strong> تا <strong>{toPersianDigits(shift.endTime)}</strong>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Leaves Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="doctor-schedule-header border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  درخواست‌های مرخصی و تغییر شیفت من
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  پیگیری وضعیت بررسی توسط منشی ارشد و ادمین سیستم
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                + درخواست جدید
              </button>
            </div>

            {doctorLeaves.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                هیچ درخواست مرخصی ثبت نشده است.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {doctorLeaves.map((leave) => (
                  <article key={leave.id} aria-label={`درخواست مرخصی از ${leave.startDate} تا ${leave.endDate}`} className="doctor-leave-item py-4 text-sm">
                    <div className="space-y-2">
                      <div className="doctor-leave-heading">
                        <span className="font-bold text-slate-900">
                          از <bdi dir="ltr">{toPersianDigits(leave.startDate)}</bdi> تا <bdi dir="ltr">{toPersianDigits(leave.endDate)}</bdi>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            leave.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : leave.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {leave.status === 'APPROVED'
                            ? 'تأییدشده'
                            : leave.status === 'REJECTED'
                            ? 'ردشده'
                            : 'در انتظار تأیید منشی'}
                        </span>
                      </div>
                      <p className="text-slate-600">علت: {leave.reason}</p>
                      {leave.reviewComment && (
                        <p className="text-[11px] text-slate-500">
                          توضیحات بررسی‌کننده ({leave.reviewedBy}): «{leave.reviewComment}»
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div className="doctor-metrics grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">کل نوبت‌های ثبت‌شده</div>
              <div className="text-2xl font-bold text-slate-900 mt-2">{toPersianDigits(totalToday)}</div>
              <div className="text-[11px] text-slate-400 mt-1">حضوری و آنلاین</div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">ویزیت‌های تصویری آنلاین</div>
              <div className="text-2xl font-bold text-teal-700 mt-2">{toPersianDigits(onlineCount)}</div>
              <div className="text-[11px] text-teal-600/80 mt-1">برگزاری ویزیت از راه دور</div>
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
          <div className="doctor-filters bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={filterType === 'ALL'}
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
                aria-pressed={filterType === 'ONLINE'}
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
                aria-pressed={filterType === 'COMPLETED'}
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
                aria-label="جستجوی نوبت‌های پزشک"
                placeholder="جستجوی نام بیمار یا کد رهگیری..."
                className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-500 text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>
          </div>

          {/* Appointments List / Table */}
          <div className="doctor-queue bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>کارتابل نوبت‌های پزشک</span>
              </h3>
              <span className="text-xs text-slate-500">
                نمایش {toPersianDigits(filteredAppointments.length)} از {toPersianDigits(appointments.length)}
              </span>
            </div>

            <div className="doctor-appointment-grid">
              {filteredAppointments.length === 0 ? (
                <div className="doctor-queue-empty p-8 text-center text-slate-400 text-xs">
                  نوبتی با این مشخصات یافت نشد.
                </div>
              ) : (
                filteredAppointments.map((app) => (
                  <div
                    key={app.id}
                    className="doctor-queue-row"
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
                          <span className={`border text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            app.status === 'CANCELLED_BY_PATIENT' || app.status === 'CANCELLED_BY_CLINIC'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {appointmentStatusLabels[app.status]}
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
                        (app.status === 'COMPLETED' ||
                          ((app.status === 'CONFIRMED' || app.status === 'IN_CONSULTATION') &&
                            new Date(app.dateTime).getTime() <= Date.now())) && <button
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
        </>
      )}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <DoctorLeaveRequestModal
          doctorId={currentDoc.id}
          doctorName={doctorName}
          onClose={() => setShowLeaveModal(false)}
          onRequestSubmitted={() => setShowLeaveModal(false)}
        />
      )}
    </div>
  );
};

