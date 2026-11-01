import '../secretary.css';
import React, { useState, useEffect, useMemo } from 'react';
import { PatientDocument } from '@/shared/types';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { scheduleRepository } from '@/mocks/repositories/scheduleRepository';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import { AppointmentTable } from './AppointmentTable';
import { AppointmentDrawer } from './AppointmentDrawer';
import { InsuranceEditModal } from './InsuranceEditModal';
import { EmergencyUnlockDialog } from './EmergencyUnlockDialog';
import { DocumentZoomModal } from './DocumentZoomModal';
import {
  Building,
  Video,
  Lock,
  CreditCard,
  Search,
  CalendarDays,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

export const SecretaryDashboard: React.FC<{ section?: 'APPOINTMENTS' | 'DOCTOR_LEAVES' }> = ({ section: activeSection = 'APPOINTMENTS' }) => {
  const { currentRole, currentUser } = useAuthStore();

  // Reactive listener to memoryDb updates
  const [, setDbVersion] = useState(0);
  useEffect(() => {
    const unsubscribe = memoryDb.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Filter state
  const secretaryBranch = currentUser.branchId === 'ISFAHAN' ? 'ISFAHAN' : 'TEHRAN';
  const isTehranSecretary = secretaryBranch === 'TEHRAN';
  const branchLabel = isTehranSecretary ? 'تهران' : 'اصفهان';
  const defaultBranch = 'ALL';
  const [selectedBranch, setSelectedBranch] = useState<'ALL' | 'BRANCH' | 'ONLINE'>(
    defaultBranch
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'SOFT_LOCKED' | 'DEBIT' | 'WITH_DOCS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Doctor leaves
  const allLeaves = scheduleRepository.getLeaves();

  // Modals & Drawer State (ID-based to stay synchronously reactive)
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);
  const [insuranceAppId, setInsuranceAppId] = useState<string | null>(null);
  const [unlockAppId, setUnlockAppId] = useState<string | null>(null);
  const [selectedDocForZoom, setSelectedDocForZoom] = useState<PatientDocument | null>(null);

  // Every table, total and selected record stays within this secretary's scope.
  const allAppointments = appointmentRepository.getAll().filter(app => app.branchId === secretaryBranch || app.branchId === 'ONLINE');

  const selectedAppForDrawer = drawerAppId ? allAppointments.find((a) => a.id === drawerAppId) || null : null;
  const selectedAppForInsurance = insuranceAppId ? allAppointments.find((a) => a.id === insuranceAppId) || null : null;
  const selectedAppForUnlock = unlockAppId ? allAppointments.find((a) => a.id === unlockAppId) || null : null;

  // Filter logic
  const filteredAppointments = useMemo(() => {
    return allAppointments.filter((app) => {
      // Branch filter
      if (selectedBranch === 'BRANCH' && app.branchId !== secretaryBranch) return false;
      if (selectedBranch === 'ONLINE' && app.branchId !== 'ONLINE') return false;

      // Status tab filter
      if (statusFilter === 'ONLINE' && app.branchId !== 'ONLINE') return false;
      if (statusFilter === 'SOFT_LOCKED' && !app.isSoftLocked) return false;
      if (statusFilter === 'DEBIT' && app.financialStatus !== 'DEBIT') return false;
      if (statusFilter === 'WITH_DOCS' && app.documents.length === 0) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = app.patientName.toLowerCase().includes(query);
        const matchesMobile = app.patientMobile.includes(query);
        const matchesCode = app.trackingCode.toLowerCase().includes(query);
        const matchesDoctor = app.doctorName.toLowerCase().includes(query);
        if (!matchesName && !matchesMobile && !matchesCode && !matchesDoctor) {
          return false;
        }
      }

      return true;
    });
  }, [allAppointments, selectedBranch, secretaryBranch, statusFilter, searchQuery]);

  // Aggregate KPI metrics
  const relevantAppointments = allAppointments.filter(a => selectedBranch === 'ALL' || a.branchId === (selectedBranch === 'BRANCH' ? secretaryBranch : 'ONLINE'));

  const totalCount = relevantAppointments.length;
  const onlineCount = relevantAppointments.filter((a) => a.branchId === 'ONLINE').length;
  const softLockedCount = relevantAppointments.filter((a) => a.isSoftLocked).length;
  const totalOutstandingDebt = relevantAppointments
    .filter((a) => a.financialStatus === 'DEBIT')
    .reduce((sum, a) => sum + Math.abs(a.debtOrCreditBalance), 0);

  return (
    <div className="reception-workspace space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="reception-heading flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>
                میز کار پذیرش {isTehranSecretary ? 'شعبه مرکزی تهران' : 'شعبه شمس‌آبادی اصفهان'}
              </span>
              <span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-0.5 rounded-full border border-teal-200">
                پذیرش
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              منشی فعال: <strong>{currentUser.name}</strong> • بررسی نوبت‌ها، مدارک، سهم بیمه و وضعیت ورود به ویزیت
            </p>
          </div>
        </div>

        {activeSection === 'APPOINTMENTS' && (
          <div className="reception-branch-filter" role="group" aria-label="فیلتر شعبه">
            {([['ALL', `شعبه ${branchLabel} + آنلاین`], ['BRANCH', `فقط ${branchLabel}`], ['ONLINE', 'فقط آنلاین']] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={selectedBranch === value} onClick={() => setSelectedBranch(value)}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {activeSection === 'DOCTOR_LEAVES' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <div className="reception-leaves-heading flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays aria-hidden="true" className="w-4 h-4 text-teal-600" />
                کارتابل بررسی و تایید مرخصی پزشکان
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                بررسی تداخل نوبت‌ها، تأیید یا رد درخواست و لغو نوبت‌های متأثر با بازگشت کامل وجه
              </p>
            </div>
            <span className="reception-leaves-count text-slate-500">
              کل درخواست‌ها: {toPersianDigits(allLeaves.length)}
            </span>
          </div>

          {allLeaves.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              هیچ درخواست مرخصی در سامانه ثبت نشده است.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allLeaves.map((leave) => {
                const affectedApps = scheduleRepository.getAffectedAppointmentsForLeave(leave.id);
                return (
                  <article key={leave.id} className="reception-leave-card py-4 space-y-3" aria-label={`درخواست مرخصی ${leave.doctorName}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{leave.doctorName}</span>
                          <span className="reception-leave-dates bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                            <span>از <bdi>{toPersianDigits(leave.startDate)}</bdi></span><span>تا <bdi>{toPersianDigits(leave.endDate)}</bdi></span>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
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
                              : 'در انتظار بررسی منشی'}
                          </span>
                        </div>
                        <p className="text-slate-600">علت مرخصی: «{leave.reason}»</p>
                      </div>

                      {/* Review Buttons if Pending */}
                      {leave.status === 'PENDING_APPROVAL' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              scheduleRepository.reviewLeave(
                                leave.id,
                                'APPROVED',
                                currentUser.name,
                                currentRole,
                                'تأیید شد'
                              );
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تأیید مرخصی</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              scheduleRepository.reviewLeave(
                                leave.id,
                                'REJECTED',
                                currentUser.name,
                                currentRole,
                                'به دلیل تداخل کاری و کمبود ظرفیت رد شد'
                              );
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رد درخواست</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {leave.reviewedBy && <p className="text-slate-600">بررسی‌کننده: {leave.reviewedBy} • {leave.reviewComment}</p>}
                    {/* Affected Appointments Alert */}
                    {affectedApps.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            این مرخصی با <strong>{toPersianDigits(affectedApps.length)} نوبت رزروشده</strong> تداخل دارد.
                          </span>
                        </div>
                        {leave.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              const count = scheduleRepository.cancelAffectedAppointmentsForLeave(
                                leave.id,
                                currentUser.name,
                                currentRole
                              );
                              alert(`${count} نوبت با موفقیت توسط کلینیک لغو و ۱۰۰٪ مبالغ به کیف پول بیماران استرداد شد.`);
                            }}
                            className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-1 rounded-lg text-xs font-semibold self-start sm:self-auto transition shadow-xs"
                          >
                            لغو نوبت‌های متأثر توسط کلینیک (۱۰۰٪ استرداد)
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>نوبت‌های در محدوده</span>
            <CalendarCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {toPersianDigits(totalCount)} نوبت
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تمام تاریخ‌ها در محدوده انتخاب‌شده</div>
        </div>

        {/* Online Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>ویزیت‌های آنلاین</span>
            <Video className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {toPersianDigits(onlineCount)} جلسه
          </div>
          <div className="text-[11px] text-slate-400 mt-1">نوبت‌های مشاوره تصویری</div>
        </div>

        {/* Soft-Locked Appointments */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>محدودیت ورود به ویزیت</span>
            <Lock className="w-4 h-4 text-rose-600" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              softLockedCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {toPersianDigits(softLockedCount)} مورد
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ورود به جلسه مسدود</div>
        </div>

        {/* Outstanding Debts */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>کل مانده بدهی معوق</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              totalOutstandingDebt > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {formatToman(totalOutstandingDebt)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">نیازمند تسویه یا بازگشایی</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div role="group" aria-label="فیلتر وضعیت نوبت" className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            aria-pressed={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'ALL'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه نوبت‌ها ({toPersianDigits(relevantAppointments.length)})
          </button>

          <button
            type="button"
            aria-pressed={statusFilter === 'SOFT_LOCKED'}
            onClick={() => setStatusFilter('SOFT_LOCKED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              statusFilter === 'SOFT_LOCKED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>قفل نرم فعال ({toPersianDigits(softLockedCount)})</span>
          </button>

          <button
            type="button"
            aria-pressed={statusFilter === 'DEBIT'}
            onClick={() => setStatusFilter('DEBIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'DEBIT'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            بدهکاران مالی
          </button>

          <button
            type="button"
            aria-pressed={statusFilter === 'WITH_DOCS'}
            onClick={() => setStatusFilter('WITH_DOCS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'WITH_DOCS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            دارای مدارک پزشکی
          </button>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72">
          <label htmlFor="reception-search" className="block text-xs font-semibold text-slate-700 mb-1">جستجوی نوبت‌ها</label>
          <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            id="reception-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="نام بیمار، پزشک، موبایل یا کد نوبت"
            className="w-full text-xs rounded-xl border border-slate-300 pr-9 pl-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="پاک کردن جستجو"
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
          </div>
        </div>
      </div>

      <div className="reception-result-summary">
        <p role="status">{toPersianDigits(filteredAppointments.length)} نوبت در نتیجهٔ جستجو و فیلترها</p>
        <button type="button" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setSelectedBranch(defaultBranch); }}>پاک کردن جستجو و فیلترها</button>
      </div>
      {/* Main Appointment Table */}
      <AppointmentTable
        appointments={filteredAppointments}
        onOpenDrawer={(app) => setDrawerAppId(app.id)}
        onOpenInsuranceModal={(app) => setInsuranceAppId(app.id)}
        onOpenEmergencyUnlock={(app) => setUnlockAppId(app.id)}
      />
      </>
      )}

      {/* Slide-over Drawer for Patient Details & Documents */}
      <AppointmentDrawer
        appointment={selectedAppForDrawer}
        isOpen={Boolean(selectedAppForDrawer)}
        onClose={() => setDrawerAppId(null)}
        onOpenInsuranceModal={(app) => setInsuranceAppId(app.id)}
        onOpenEmergencyUnlock={(app) => setUnlockAppId(app.id)}
        onViewDocument={(doc) => setSelectedDocForZoom(doc)}
      />

      {/* Insurance Manual Edit Modal (INT-04 / AC-03) */}
      <InsuranceEditModal
        appointment={selectedAppForInsurance}
        isOpen={Boolean(selectedAppForInsurance)}
        onClose={() => setInsuranceAppId(null)}
      />

      {/* Emergency Unlock Dialog (AC-04) */}
      <EmergencyUnlockDialog
        appointment={selectedAppForUnlock}
        isOpen={Boolean(selectedAppForUnlock)}
        onClose={() => setUnlockAppId(null)}
      />

      {/* Document Zoom & Inspection Modal */}
      <DocumentZoomModal
        document={selectedDocForZoom}
        isOpen={Boolean(selectedDocForZoom)}
        onClose={() => setSelectedDocForZoom(null)}
      />
    </div>
  );
};
