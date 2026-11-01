import { createPortal } from 'react-dom';
import { useWorkspaceOverlay } from '@/shared/hooks/useWorkspaceOverlay';
import './financial-operations.css';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { scheduleRepository } from '@/mocks/repositories/scheduleRepository';
import {
  parseTariffWorkbook,
  generateSampleTariffWorkbook,
  ParseExcelResult,
} from '../logic/excelTariffParser';
import { toPersianDigits, formatDateTime } from '@/shared/utils/formatters';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileUp,
  Percent,
  PlusCircle,
  Settings,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { BranchId } from '@/shared/types';

export type FinancialDashboardSection = 'TARIFF_EXCEL' | 'SHIFTS' | 'SETTINGS';

interface FinancialDashboardProps {
  section: FinancialDashboardSection;
}

/** Only an explicit confirmed reset discards operation-local drafts. */
export const FinancialDashboard: React.FC<FinancialDashboardProps> = (props) => {
  const resetRevision = useScenarioStore(state => state.resetRevision);
  return <FinancialDashboardContent key={resetRevision} {...props} />;
};

const FinancialDashboardContent: React.FC<FinancialDashboardProps> = ({ section }) => {
  const { currentUser, currentRole } = useAuthStore();
  const [, refresh] = useState(0);

  // Excel state
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [diffFilter, setDiffFilter] = useState<'ALL' | 'MODIFIED_OR_NEW' | 'MODIFIED' | 'NEW'>('ALL');

  // Settings state
  const currentSettings = memoryDb.getSettings();
  const [taxPercent, setTaxPercent] = useState(currentSettings.defaultTaxPercent);
  const [cancelHours, setCancelHours] = useState(currentSettings.cancellationThresholdHours);
  const [penaltyPercent, setPenaltyPercent] = useState(currentSettings.cancellationPenaltyPercent);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    let persistedSettings = memoryDb.getSettings();
    return memoryDb.subscribe(() => {
      const settings = memoryDb.getSettings();
      if (
        settings.defaultTaxPercent !== persistedSettings.defaultTaxPercent ||
        settings.cancellationThresholdHours !== persistedSettings.cancellationThresholdHours ||
        settings.cancellationPenaltyPercent !== persistedSettings.cancellationPenaltyPercent
      ) {
        setTaxPercent(settings.defaultTaxPercent);
        setCancelHours(settings.cancellationThresholdHours);
        setPenaltyPercent(settings.cancellationPenaltyPercent);
        setSettingsSaved(false);
      }
      persistedSettings = settings;
      refresh(version => version + 1);
    });
  }, []);


  // New shift form state
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [newShiftDoctorId, setNewShiftDoctorId] = useState('doc-1');
  const [newShiftBranch, setNewShiftBranch] = useState<BranchId>('ONLINE');
  const [newShiftDay, setNewShiftDay] = useState(0);
  const [newShiftStartTime, setNewShiftStartTime] = useState('۰۹:۰۰');
  const [newShiftEndTime, setNewShiftEndTime] = useState('۱۳:۰۰');
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [shiftView, setShiftView] = useState<'WEEK' | 'LIST'>('WEEK');
  const [shiftSaved, setShiftSaved] = useState(false);
  const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  useEffect(() => {
    if (section !== 'SHIFTS') setShowAddShiftModal(false);
  }, [section]);

  const shiftDialogRef = useWorkspaceOverlay(() => setShowAddShiftModal(false), showAddShiftModal);

  // Repositories data
  const allDoctors = doctorRepository.getAll();
  const allShifts = scheduleRepository.getShifts();

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessingFile(true);
    setFileError(null);
    setParseResult(null);
    setDiffFilter('ALL');
    setApplySuccessMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseTariffWorkbook(buffer);
        setParseResult(result);
      } catch (err: any) {
        setFileError('خطا در تحلیل فایل اکسل: ' + err.message);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.onerror = () => { setFileError('خواندن فایل انجام نشد. دوباره فایل را انتخاب کنید.'); setIsProcessingFile(false); };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Mock sample loader (DEC-FE-03)
  const handleLoadSampleExcel = () => {
    setFileName('قالب نمونهٔ دوشیتی');
    setIsProcessingFile(true);
    setFileError(null);
    setParseResult(null);
    setDiffFilter('ALL');
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
      setShiftSaved(true);
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
    <div data-testid="financial-dashboard" className="financial-operations space-y-6 text-slate-800">
      <header className="operation-page-header">
        <div><p className="operation-eyebrow">امور مالی / {currentUser.name}</p>
          <h2>{section === 'TARIFF_EXCEL' ? 'تعرفه‌ها و قراردادهای بیمه' : section === 'SHIFTS' ? 'برنامهٔ کاری پزشکان' : 'تنظیمات مالی کلینیک'}</h2>
          <p>{section === 'TARIFF_EXCEL' ? 'فایل را دریافت کنید، تغییرات را مقایسه کنید و سپس اعمال کنید.' : section === 'SHIFTS' ? 'الگوی هفتگی شعب و ویزیت آنلاین را یکجا مرور کنید.' : 'پارامترهای مالیات و لغو نوبت را بازبینی و ذخیره کنید.'}</p>
        </div>
        <div className="operation-parameters" aria-label="تنظیمات ذخیره‌شده">
          <span><Percent aria-hidden="true" size={16} />مالیات پزشک: {toPersianDigits(currentSettings.defaultTaxPercent)}٪</span>
          <span><Clock aria-hidden="true" size={16} />مرز لغو: {toPersianDigits(currentSettings.cancellationThresholdHours)} ساعت ({toPersianDigits(currentSettings.cancellationPenaltyPercent)}٪)</span>
        </div>
      </header>

      {/* --- TAB 2: 2-SHEET EXCEL TARIFF UPLOAD & DIFF (FLOW-06 / AC-07) --- */}
      {section === 'TARIFF_EXCEL' && (
        <div className="space-y-6 text-xs">
          <ol className="operation-steps" aria-label="مراحل به‌روزرسانی تعرفه">
            <li><span>۱</span> دریافت قالب</li><li><span>۲</span> انتخاب و مقایسهٔ فایل</li><li><span>۳</span> تأیید و اعمال</li>
          </ol>
          {/* Upload Zone Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet aria-hidden="true" className="w-5 h-5 text-teal-600" />
                  آپلود و تحلیل فایل اکسل تعرفه‌ها (ساختار ۲ شیتی استاندارد)
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  شیت ۱: <strong className="text-slate-700">Services_BaseInsurance</strong> | شیت ۲: <strong className="text-slate-700">Supplementary_Rules</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleWorkbook}
                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <Download aria-hidden="true" className="w-4 h-4" />
                  <span>دانلود قالب اکسل نمونه (.xlsx)</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={handleLoadSampleExcel}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <FileUp aria-hidden="true" className="w-4 h-4" />
                  <span>بارگذاری داده نمونه ماک ۲ شیتی</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Input Area */}
            <div className="operation-upload border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="excel-tariff-file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="operation-file-input"
                disabled={isProcessingFile}
              />
              <label
                htmlFor="excel-tariff-file"
                className="operation-file-label cursor-pointer flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                  <Upload aria-hidden="true" className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-teal-700 text-sm hover:underline">
                    برای انتخاب فایل اکسل کلیک کنید
                  </span>
                  <span className="text-slate-500 text-xs block mt-0.5">
                    فایل دوشیتی با فرمت .xlsx یا .xls؛ پیش از اعمال، پیش‌نمایش نمایش داده می‌شود.
                  </span>
                </div>
              </label>
            </div>

            {fileName && <p className="operation-file-name">فایل انتخاب‌شده: <strong>{fileName}</strong></p>}
            {fileError && <p role="alert" className="operation-error">{fileError}</p>}
            {isProcessingFile && (
              <div role="status" className="p-3 bg-teal-50 text-teal-800 rounded-xl text-center font-semibold animate-pulse">
                در حال خواندن و تحلیل فایل اکسل…
              </div>
            )}

            {applySuccessMessage && (
              <div role="status" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 aria-hidden="true" className="w-5 h-5 text-emerald-600 shrink-0" />
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
                    <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-bold text-[11px]">
                      {parseResult.isValid ? 'ساختار معتبر' : 'ساختار نامعتبر'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    شیت‌های شناسایی‌شده: {parseResult.sheetNames.join(' و ')} • {toPersianDigits(parseResult.parsedServices.length)} خدمت و {toPersianDigits(parseResult.parsedRules.length)} قاعده بیمه تکمیلی
                  </p>
                </div>

                {/* Filter and Apply Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="operation-switch" role="group" aria-label="فیلتر تغییرات">
                    {([['ALL', `همه (${toPersianDigits(parseResult.diffItems.length)})`], ['MODIFIED_OR_NEW', 'فقط تغییرات'], ['MODIFIED', 'ویرایش‌شده'], ['NEW', 'جدید']] as const).map(([filter, label]) => (
                      <button key={filter} type="button" aria-pressed={diffFilter === filter} onClick={() => setDiffFilter(filter)}>{label}</button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyTariffChanges}
                    disabled={!parseResult.isValid || isProcessingFile || !!applySuccessMessage || !parseResult.diffItems.some(item => item.action !== 'UNCHANGED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 aria-hidden="true" className="w-4 h-4" />
                    <span>تأیید و اعمال نهایی در سیستم</span>
                  </button>
                </div>
              </div>

              {parseResult.isValid && <>
                <div className="operation-summary" aria-label="خلاصهٔ مقایسه">
                  <div><span>جدید</span><strong>{toPersianDigits(parseResult.diffItems.filter(item => item.action === 'NEW').length)}</strong></div>
                  <div><span>ویرایش‌شده</span><strong>{toPersianDigits(parseResult.diffItems.filter(item => item.action === 'MODIFIED').length)}</strong></div>
                  <div><span>بدون تغییر</span><strong>{toPersianDigits(parseResult.diffItems.filter(item => item.action === 'UNCHANGED').length)}</strong></div>
                </div>
                {!parseResult.diffItems.some(item => item.action !== 'UNCHANGED') && <p role="status" className="operation-empty">تغییری نسبت به تعرفه‌های فعلی وجود ندارد.</p>}
              </>}
              {!parseResult.isValid && <div role="alert" className="operation-error"><strong>فایل قابل اعمال نیست؛ ساختار دو شیت را اصلاح و دوباره انتخاب کنید.</strong><ul>{parseResult.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
              {/* Diff Items Table */}
              <div className="operation-comparison border border-slate-200 rounded-xl" role="region" aria-label="جدول مقایسه تعرفه‌ها" tabIndex={0}>
                <table className="w-full text-right border-collapse text-xs"><caption className="sr-only">مقایسهٔ مقدار قبلی و جدید خدمات و بیمه؛ مبالغ به تومان</caption>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th scope="col" className="py-2.5 px-3">نوع تغییر</th>
                      <th scope="col" className="py-2.5 px-3">دسته‌بندی</th>
                      <th scope="col" className="py-2.5 px-3">کد خدمت / بیمه</th>
                      <th scope="col" className="py-2.5 px-3">عنوان خدمت یا شرکت بیمه</th>
                      <th scope="col" className="py-2.5 px-3">شعبه / قلمرو</th>
                      <th scope="col" className="py-2.5 px-3">مقدار قبلی در سامانه</th>
                      <th scope="col" className="py-2.5 px-3">مقدار جدید در فایل اکسل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parseResult.isValid && filteredDiffItems.length === 0 && <tr><td colSpan={7} className="operation-empty">ردیفی برای این فیلتر وجود ندارد.</td></tr>}
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
      {section === 'SHIFTS' && (
        <div className="space-y-6 text-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar aria-hidden="true" className="w-5 h-5 text-teal-600" />
                  مدیریت الگوی هفتگی شیفت پزشکان (تهران، اصفهان، آنلاین)
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  زمان هر شیفت و شعبه را پیش از ثبت بررسی کنید؛ تداخل‌های زمانی هنگام ثبت کنترل می‌شوند.
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
                <PlusCircle aria-hidden="true" className="w-4 h-4" />
                <span>تعریف شیفت کاری جدید</span>
              </button>
            </div>

            <div className="operation-toolbar">
              <div role="group" aria-label="نمایش شیفت‌ها" className="operation-switch">
                <button type="button" aria-pressed={shiftView === 'WEEK'} onClick={() => setShiftView('WEEK')}>تقویم هفتگی</button>
                <button type="button" aria-pressed={shiftView === 'LIST'} onClick={() => setShiftView('LIST')}>فهرست شیفت‌ها</button>
              </div>
              <p>{toPersianDigits(allShifts.length)} شیفت تعریف‌شده • الگوی تکرارشوندهٔ هفتگی</p>
            </div>
            {shiftSaved && <p role="status" className="operation-success">شیفت با موفقیت ثبت شد و در برنامه نمایش داده می‌شود.</p>}
            {allShifts.length === 0 && <p className="operation-empty">هنوز شیفتی تعریف نشده است. با «تعریف شیفت کاری جدید» برنامه را آغاز کنید.</p>}
            <div className={shiftView === 'WEEK' ? 'shift-week' : 'shift-list'} >
              {(shiftView === 'WEEK' ? dayNames.map((day, index) => ({ day, shifts: allShifts.filter(shift => shift.dayOfWeek === index) })) : [{ day: '', shifts: allShifts }]).map(group => (
                <section className="shift-day" key={group.day}>
                  {group.day && <h4>{group.day}<span>{toPersianDigits(group.shifts.length)} شیفت</span></h4>}
                  {group.shifts.length === 0 && <p className="shift-day-empty">بدون شیفت</p>}
                  <div role="list" aria-label={shiftView === 'WEEK' ? `شیفت‌های ${group.day}` : 'فهرست شیفت‌ها'}>
                  {group.shifts.map(shift => (
                    <article role="listitem" className="shift-card" key={shift.id}>
                      {shiftView === 'LIST' && <strong>{shift.dayName}</strong>}
                      <div className="shift-card-doctor">{shift.doctorName}</div>
                      <span className="shift-branch">{shift.branchId === 'ONLINE' ? 'ویزیت آنلاین' : shift.branchId === 'TEHRAN' ? 'شعبه تهران' : 'شعبه اصفهان'}</span>
                      <div className="shift-time"><Clock aria-hidden="true" size={14} /><span dir="ltr">{toPersianDigits(shift.startTime)} – {toPersianDigits(shift.endTime)}</span></div>
                      {!shift.isActive && <span>غیرفعال</span>}
                    </article>
                  ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: CLINIC SETTINGS (DEC-FE-03, S17) --- */}
      {section === 'SETTINGS' && (
        <div className="operation-settings space-y-6">
          <form
            onSubmit={handleSaveSettings}
            className="operation-settings-form bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings aria-hidden="true" className="w-5 h-5 text-teal-600" />
                پارامترهای سیستمی مالیات و جریمه لغو نوبت
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                واحد و محدودهٔ مجاز هر مقدار کنار همان فیلد آمده است. تغییرات پس از ذخیره اعمال می‌شوند.
              </p>
            </div>

            <div className="operation-setting-fields space-y-4">
              <div>
                <label htmlFor="finance-tax" className="block font-bold text-slate-800 mb-1">
                  درصد پیش‌فرض کسورات مالیاتی سهم پزشک:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    id="finance-tax" aria-describedby="finance-tax-unit" value={taxPercent}
                    onChange={(e) => { setTaxPercent(Number(e.target.value)); setSettingsSaved(false); }}
                    required
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                  />
                  <span id="finance-tax-unit" className="text-slate-600 font-bold">درصد • ۰ تا ۱۰۰ (پیش‌فرض ۱۰٪)</span>
                </div>
              </div>

              <div>
                <label htmlFor="finance-cancel" className="block font-bold text-slate-800 mb-1">
                  مرز زمانی لغو رایگان توسط بیمار:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    id="finance-cancel" aria-describedby="finance-cancel-unit" value={cancelHours}
                    onChange={(e) => { setCancelHours(Number(e.target.value)); setSettingsSaved(false); }}
                    required
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                  />
                  <span id="finance-cancel-unit" className="text-slate-600 font-bold">ساعت • ۱ تا ۷۲ (پیش‌فرض ۱۲ ساعت)</span>
                </div>
              </div>

              <div>
                <label htmlFor="finance-penalty" className="block font-bold text-slate-800 mb-1">
                  درصد جریمهٔ لغو دیرهنگام:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    id="finance-penalty" aria-describedby="finance-penalty-unit" value={penaltyPercent}
                    onChange={(e) => { setPenaltyPercent(Number(e.target.value)); setSettingsSaved(false); }}
                    required
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold text-sm"
                  />
                  <span id="finance-penalty-unit" className="text-slate-600 font-bold">درصد • ۰ تا ۱۰۰ (پیش‌فرض ۵۰٪)</span>
                </div>
              </div>
            </div>

            {settingsSaved && (
              <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-600" />
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
      {showAddShiftModal && createPortal(
        <div
          ref={shiftDialogRef}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="add-shift-title"
          aria-modal="true"
          className="financial-shift-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-right text-xs space-y-4">
            <h4 id="add-shift-title" className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              تعریف شیفت کاری جدید برای پزشک
            </h4>

            {shiftError && (
              <div id="shift-error" role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-semibold">
                <AlertTriangle aria-hidden="true" className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{shiftError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShift} className="space-y-3">
              <div>
                <label htmlFor="shift-doctor" className="block font-semibold text-slate-700 mb-1">پزشک معالج:</label>
                <select
                  id="shift-doctor" aria-invalid={!!shiftError} aria-describedby={shiftError ? "shift-error" : undefined} value={newShiftDoctorId}
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
                <label htmlFor="shift-branch" className="block font-semibold text-slate-700 mb-1">شعبه یا سامانه:</label>
                <select
                  id="shift-branch" value={newShiftBranch}
                  onChange={(e) => setNewShiftBranch(e.target.value as BranchId)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                >
                  <option value="ONLINE">ویزیت آنلاین سراسری</option>
                  <option value="TEHRAN">شعبه مرکزی تهران</option>
                  <option value="ISFAHAN">شعبه شمس‌آبادی اصفهان</option>
                </select>
              </div>

              <div>
                <label htmlFor="shift-day" className="block font-semibold text-slate-700 mb-1">روز هفته:</label>
                <select
                  id="shift-day" aria-invalid={!!shiftError} aria-describedby={shiftError ? "shift-error" : undefined} value={newShiftDay}
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
                  <label htmlFor="shift-start" className="block font-semibold text-slate-700 mb-1">ساعت شروع:</label>
                  <input
                    type="text"
                    id="shift-start" value={newShiftStartTime}
                    onChange={(e) => setNewShiftStartTime(e.target.value)}
                    required
                    placeholder="۰۹:۰۰"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="shift-end" className="block font-semibold text-slate-700 mb-1">ساعت پایان:</label>
                  <input
                    type="text"
                    id="shift-end" value={newShiftEndTime}
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
        </div>, document.body
      )}
    </div>
  );
};
