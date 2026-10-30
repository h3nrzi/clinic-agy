import { useWorkspaceSection } from '@/shared/stores/useWorkspaceStore';
import { OperationsOverview } from './OperationsOverview';
import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { scheduleRepository } from '@/mocks/repositories/scheduleRepository';
import { calculateDoctorShare } from '../logic/doctorShareCalculator';
import {
  parseTariffWorkbook,
  generateSampleTariffWorkbook,
  ParseExcelResult,
} from '../logic/excelTariffParser';
import { formatToman, toPersianDigits, formatDateTime } from '@/shared/utils/formatters';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileSpreadsheet,
  FileUp,
  Percent,
  PlusCircle,
  Receipt,
  Settings,
  TrendingUp,
  Upload,
  UserCheck,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { BranchId } from '@/shared/types';

export const FinancialDashboard: React.FC = () => {
  const { currentUser, currentRole } = useAuthStore();
  const [activeTab, setActiveTab] = useWorkspaceSection<'FINANCE' | 'TARIFF_EXCEL' | 'SHIFTS' | 'SETTINGS'>('FINANCE');

  // Excel state
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<'ALL' | 'MODIFIED_OR_NEW' | 'MODIFIED' | 'NEW'>('ALL');

  // Settings state
  const currentSettings = memoryDb.getSettings();
  const [taxPercent, setTaxPercent] = useState(currentSettings.defaultTaxPercent);
  const [cancelHours, setCancelHours] = useState(currentSettings.cancellationThresholdHours);
  const [penaltyPercent, setPenaltyPercent] = useState(currentSettings.cancellationPenaltyPercent);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // New shift form state
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [newShiftDoctorId, setNewShiftDoctorId] = useState('doc-1');
  const [newShiftBranch, setNewShiftBranch] = useState<BranchId>('ONLINE');
  const [newShiftDay, setNewShiftDay] = useState(0);
  const [newShiftStartTime, setNewShiftStartTime] = useState('۰۹:۰۰');
  const [newShiftEndTime, setNewShiftEndTime] = useState('۱۳:۰۰');
  const [shiftError, setShiftError] = useState<string | null>(null);

  // Repositories data
  const allAppointments = appointmentRepository.getAll();
  const allDoctors = doctorRepository.getAll();
  const allServices = tariffRepository.getServices();
  const allShifts = scheduleRepository.getShifts();

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

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setApplySuccessMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseTariffWorkbook(buffer);
        setParseResult(result);
      } catch (err: any) {
        alert('خطا در تحلیل فایل اکسل: ' + err.message);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Mock sample loader (DEC-FE-03)
  const handleLoadSampleExcel = () => {
    setIsProcessingFile(true);
    setApplySuccessMessage(null);
    setTimeout(() => {
      const sampleBuffer = generateSampleTariffWorkbook();
      const result = parseTariffWorkbook(sampleBuffer);
      setParseResult(result);
      setIsProcessingFile(false);
    }, 200);
  };

  // Download sample workbook
  const handleDownloadSampleWorkbook = () => {
    const buf = generateSampleTariffWorkbook();
    const blob = new Blob([new Uint8Array(buf).buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Clinic_Agy_Tariff_Template_v2.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply changes to database
  const handleApplyTariffChanges = () => {
    if (!parseResult || !parseResult.isValid) return;

    const res = tariffRepository.applyTariffUpdates(
      parseResult.parsedServices,
      parseResult.parsedRules,
      currentUser.name,
      currentRole
    );

    setApplySuccessMessage(
      `تعرفه‌های جدید با موفقیت اعمال شدند (${toPersianDigits(res.appliedCount)} ردیف به‌روزرسانی شد). زمان اعمال: ${formatDateTime(res.timestamp)}`
    );
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    memoryDb.updateSettings({
      defaultTaxPercent: Number(taxPercent),
      cancellationThresholdHours: Number(cancelHours),
      cancellationPenaltyPercent: Number(penaltyPercent),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Add Shift
  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setShiftError(null);
    try {
      const doc = allDoctors.find((d) => d.id === newShiftDoctorId);
      const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

      scheduleRepository.addShift({
        doctorId: newShiftDoctorId,
        doctorName: doc ? doc.name : 'پزشک',
        branchId: newShiftBranch,
        dayOfWeek: Number(newShiftDay),
        dayName: dayNames[Number(newShiftDay)],
        startTime: newShiftStartTime,
        endTime: newShiftEndTime,
        isActive: true,
      });

      setShowAddShiftModal(false);
    } catch (err: any) {
      setShiftError(err.message || 'خطا در ثبت شیفت');
    }
  };

  // Filtered diff items
  const filteredDiffItems = useMemo(() => {
    if (!parseResult) return [];
    if (diffFilter === 'ALL') return parseResult.diffItems;
    if (diffFilter === 'MODIFIED_OR_NEW') {
      return parseResult.diffItems.filter((d) => d.action === 'NEW' || d.action === 'MODIFIED');
    }
    return parseResult.diffItems.filter((d) => d.action === diffFilter);
  }, [parseResult, diffFilter]);

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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('FINANCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'FINANCE'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>داشبورد مالی و سهم پزشکان</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TARIFF_EXCEL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'TARIFF_EXCEL'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>آپلود اکسل ۲ شیتی و جدول Diff</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SHIFTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'SHIFTS'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>تقویم هفتگی شیفت‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === 'SETTINGS'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات درصد مالیات و جریمه لغو</span>
        </button>
      </div>

      {/* --- TAB 1: FINANCIAL OVERVIEW & DOCTOR SHARES --- */}
      {activeTab === 'FINANCE' && (
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
      )}

      {/* --- TAB 2: 2-SHEET EXCEL TARIFF UPLOAD & DIFF (FLOW-06 / AC-07) --- */}
      {activeTab === 'TARIFF_EXCEL' && (
        <div className="space-y-6 text-xs">
          {/* Upload Zone Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  آپلود و تحلیل فایل اکسل تعرفه‌ها (ساختار ۲ شیتی استاندارد)
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  شیت ۱: <strong className="text-slate-700">Services_BaseInsurance</strong> | شیت ۲: <strong className="text-slate-700">Supplementary_Rules</strong> (مطابق بند ۹.۲ سند مرجع محصول)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleWorkbook}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود قالب اکسل نمونه (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleExcel}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <FileUp className="w-4 h-4" />
                  <span>بارگذاری داده نمونه ماک ۲ شیتی</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Input Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="excel-tariff-file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="excel-tariff-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-teal-700 text-sm hover:underline">
                    برای انتخاب فایل اکسل کلیک کنید
                  </span>
                  <span className="text-slate-500 text-xs block mt-0.5">
                    یا فایل اکسل تعرفه‌ها را در این کادر بکشید و رها کنید (فرمت .xlsx)
                  </span>
                </div>
              </label>
            </div>

            {isProcessingFile && (
              <div className="p-3 bg-teal-50 text-teal-800 rounded-xl text-center font-semibold animate-pulse">
                در حال خواندن و تحلیل شیت‌های اکسل با کتابخانه SheetJS...
              </div>
            )}

            {applySuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{applySuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Analysis & Diff Table Result */}
          {parseResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      پیش‌نمایش تغییرات و جدول مقایسه‌ای Diff
                    </h4>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      ساختار معتبر ✅
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    شیت‌های شناسایی‌شده: {parseResult.sheetNames.join(' و ')} • {toPersianDigits(parseResult.parsedServices.length)} خدمت و {toPersianDigits(parseResult.parsedRules.length)} قاعده بیمه تکمیلی
                  </p>
                </div>

                {/* Filter and Apply Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDiffFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        diffFilter === 'ALL'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      همه ({toPersianDigits(parseResult.diffItems.length)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiffFilter('MODIFIED_OR_NEW')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        diffFilter === 'MODIFIED_OR_NEW'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      فقط تغییرات
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyTariffChanges}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأیید و اعمال نهایی در سیستم</span>
                  </button>
                </div>
              </div>

              {/* Diff Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">نوع تغییر</th>
                      <th className="py-2.5 px-3">دسته‌بندی</th>
                      <th className="py-2.5 px-3">کد خدمت / بیمه</th>
                      <th className="py-2.5 px-3">عنوان خدمت یا شرکت بیمه</th>
                      <th className="py-2.5 px-3">شعبه / قلمرو</th>
                      <th className="py-2.5 px-3">مقدار قبلی در سامانه</th>
                      <th className="py-2.5 px-3">مقدار جدید در فایل اکسل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDiffItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3">
                          {item.action === 'NEW' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              + خدمت جدید
                            </span>
                          ) : item.action === 'MODIFIED' ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full text-[11px]">
                              ویرایش تعرفه
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full text-[11px]">
                              بدون تغییر
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">
                          {item.category === 'SERVICE' ? 'خدمت و تعرفه' : 'قاعده تکمیلی'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {item.code}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {item.title}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.branchOrDetails}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {item.oldValueDescription || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {item.newValueDescription}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: SHIFT SCHEDULE MANAGEMENT (FLOW-05) --- */}
      {activeTab === 'SHIFTS' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  مدیریت الگوی هفتگی شیفت پزشکان (تهران، اصفهان، آنلاین)
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  تنظیم ظرفیت‌های نوبت‌دهی و پیشگیری سیستمی از تداخل بازه‌های زمانی (S17)
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShiftError(null);
                  setShowAddShiftModal(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تعریف شیفت کاری جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {allShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{shift.dayName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
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

                  <div className="font-bold text-slate-800">{shift.doctorName}</div>

                  <div className="text-slate-600 flex items-center gap-1.5 pt-1 border-t border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {toPersianDigits(shift.startTime)} الی {toPersianDigits(shift.endTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: CLINIC SETTINGS (DEC-FE-03, S17) --- */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6 text-xs max-w-2xl">
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600" />
                پارامترهای سیستمی مالیات و جریمه لغو نوبت
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                مقادیر مصوب اولیه مطابق DEC-FE-03 و بند ۹.۳ سند مرجع محصول
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  درصد پیش‌فرض کسورات مالیاتی سهم پزشک (Tax Percent):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    required
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                  />
                  <span className="text-slate-600 font-bold">درصد (پیش‌فرض ۱۰٪ مصوب DEC-FE-03)</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  مرز زمانی لغو رایگان توسط بیمار (Cancellation Threshold Hours):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={cancelHours}
                    onChange={(e) => setCancelHours(Number(e.target.value))}
                    required
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                  />
                  <span className="text-slate-600 font-bold">ساعت (پیش‌فرض ۱۲ ساعت)</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  درصد جریمهٔ لغو دیرهنگام (Cancellation Penalty Percent):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={penaltyPercent}
                    onChange={(e) => setPenaltyPercent(Number(e.target.value))}
                    required
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                  />
                  <span className="text-slate-600 font-bold">درصد (پیش‌فرض ۵۰٪ جریمه کلینیک)</span>
                </div>
              </div>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تنظیمات با موفقیت ذخیره و در محاسبات سامانه اعمال شد.</span>
              </div>
            )}

            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm"
            >
              ذخیره تنظیمات
            </button>
          </form>
        </div>
      )}

      {/* Add Shift Modal */}
      {showAddShiftModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right text-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              تعریف شیفت کاری جدید برای پزشک
            </h4>

            {shiftError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{shiftError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShift} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">پزشک معالج:</label>
                <select
                  value={newShiftDoctorId}
                  onChange={(e) => setNewShiftDoctorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                >
                  {allDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">شعبه یا سامانه:</label>
                <select
                  value={newShiftBranch}
                  onChange={(e) => setNewShiftBranch(e.target.value as BranchId)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                >
                  <option value="ONLINE">ویزیت آنلاین سراسری</option>
                  <option value="TEHRAN">شعبه مرکزی تهران</option>
                  <option value="ISFAHAN">شعبه شمس‌آبادی اصفهان</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">روز هفته:</label>
                <select
                  value={newShiftDay}
                  onChange={(e) => setNewShiftDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                >
                  <option value={0}>شنبه</option>
                  <option value={1}>یکشنبه</option>
                  <option value={2}>دوشنبه</option>
                  <option value={3}>سه‌شنبه</option>
                  <option value={4}>چهارشنبه</option>
                  <option value={5}>پنج‌شنبه</option>
                  <option value={6}>جمعه</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ساعت شروع:</label>
                  <input
                    type="text"
                    value={newShiftStartTime}
                    onChange={(e) => setNewShiftStartTime(e.target.value)}
                    required
                    placeholder="۰۹:۰۰"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ساعت پایان:</label>
                  <input
                    type="text"
                    value={newShiftEndTime}
                    onChange={(e) => setNewShiftEndTime(e.target.value)}
                    required
                    placeholder="۱۳:۰۰"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  ثبت شیفت در تقویم
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddShiftModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
