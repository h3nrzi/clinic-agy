import React, { useState } from 'react';
import {
  Save,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';
import { useUnsavedChanges } from '@/shared/navigation/UnsavedChanges';
import { ClinicalNote } from '@/shared/types';

interface ClinicalNoteFormProps {
  appointmentId?: string;
  patientName: string;
  initialNote?: Partial<ClinicalNote>;
  onSave: (data: {
    mainComplaint: string;
    findings: string;
    diagnosis: string;
    prescriptions: string;
    followUp: string;
  }) => void;
  isCompleted?: boolean;
}

export const ClinicalNoteForm: React.FC<ClinicalNoteFormProps> = ({
  patientName,
  initialNote,
  onSave,
  isCompleted = false,
}) => {
  const [mainComplaint, setMainComplaint] = useState(initialNote?.mainComplaint || '');
  const [findings, setFindings] = useState(initialNote?.findings || '');
  const [diagnosis, setDiagnosis] = useState(initialNote?.diagnosis || '');
  const [prescriptions, setPrescriptions] = useState(initialNote?.prescriptions || '');
  const [followUp, setFollowUp] = useState(initialNote?.followUp || '');

  const values = [mainComplaint, findings, diagnosis, prescriptions, followUp];
  const [savedValues, setSavedValues] = useState(values);
  const hasUnsavedChanges = values.some((value, index) => value !== savedValues[index]);
  useUnsavedChanges({ dirty: hasUnsavedChanges, onDiscard: () => {
    setMainComplaint(savedValues[0]); setFindings(savedValues[1]); setDiagnosis(savedValues[2]);
    setPrescriptions(savedValues[3]); setFollowUp(savedValues[4]);
  } });
  const [validationError, setValidationError] = useState<string | null>(null);
  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setValidationError(null);
  };

  // Quick populate with AC-05 test standard values
  const handlePopulateSampleAC05 = () => {
    setMainComplaint('سردرد مزمن و احساس خستگی');
    setFindings('فشار خون 13 روی 8');
    setDiagnosis('میگرن ناشی از استرس');
    setPrescriptions('کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی');
    setFollowUp('مراجعه مجدد ۲ هفته دیگر');
    setValidationError(null);
  };

  const handleResetForm = () => {
    setMainComplaint('');
    setFindings('');
    setDiagnosis('');
    setPrescriptions('');
    setFollowUp('');
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainComplaint.trim() && !findings.trim() && !diagnosis.trim() && !prescriptions.trim()) {
      setValidationError('تکمیل حداقل یکی از فیلدهای شکایت، معاینه، تشخیص یا نسخه جهت ثبت نهایی الزامی است.');
      return;
    }

    onSave({
      mainComplaint: mainComplaint.trim(),
      findings: findings.trim(),
      diagnosis: diagnosis.trim(),
      prescriptions: prescriptions.trim(),
      followUp: followUp.trim(),
    });
    setSavedValues(values);
  };

  return (
    <form onSubmit={handleSubmit} className="clinical-form space-y-5 text-xs">
      {/* Header with RBAC notice */}
      <div className="bg-teal-50 border border-teal-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-teal-600" />
            <span>یادداشت بالینی و نسخه</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            پروندهٔ بالینی بیمار: <strong>{patientName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick populate button for testing */}
          <button
            type="button"
            onClick={handlePopulateSampleAC05}
            className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
            title="درج نمونهٔ ساختگی برای ارزیابی فرم"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>درج نمونه یادداشت</span>
          </button>

          <button
            type="button"
            onClick={handleResetForm}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition"
            aria-label="پاک‌کردن فرم"
            title="پاک‌کردن فرم"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Field-Level RBAC Explanation Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-indigo-900 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px] leading-relaxed">
          <span className="font-bold">چه کسانی این اطلاعات را می‌بینند؟</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 text-[10px]">
            <span className="bg-white/80 px-2 py-0.5 rounded border border-indigo-100">
              <strong>پزشک:</strong> دسترسی کامل به هر ۵ فیلد
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded border border-indigo-100">
              <strong>بیمار:</strong> فقط فیلد ۴ (نسخه) و ۵ (پیگیری)
            </span>
            <span className="bg-white/80 px-2 py-0.5 rounded border border-indigo-100">
              <strong>منشی:</strong> فقط فیلد ۵ (دستور پیگیری نوبت)
            </span>
          </div>
        </div>
      </div>

      {/* Error / Validation message */}
      {validationError && (
        <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* The 5 Fields Grid */}
      <div className="space-y-4">
        {/* Field 1: Main Complaint */}
        <div className="space-y-1.5">
          <label htmlFor="field-mainComplaint" className="font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                ۱
              </span>
              شکایت اصلی بیمار (Chief Complaint)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">محرمانه (مخصوص پزشک)</span>
          </label>
          <textarea
            id="field-mainComplaint"
            rows={2}
            value={mainComplaint}
            onChange={(e) => handleChange(setMainComplaint, e.target.value)}
            placeholder="مثال: سردرد مزمن و احساس خستگی از ۲ هفته پیش..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-none resize-none bg-white text-slate-900"
          />
        </div>

        {/* Field 2: Findings & Examination */}
        <div className="space-y-1.5">
          <label htmlFor="field-findings" className="font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                ۲
              </span>
              یافته‌های مهم و معاینه (Clinical Findings & Exam)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">محرمانه (مخصوص پزشک)</span>
          </label>
          <textarea
            id="field-findings"
            rows={2}
            value={findings}
            onChange={(e) => handleChange(setFindings, e.target.value)}
            placeholder="مثال: فشار خون 13 روی 8، ضربان منظم، معاینه عصبی نرمال..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-none resize-none bg-white text-slate-900"
          />
        </div>

        {/* Field 3: Diagnosis */}
        <div className="space-y-1.5">
          <label htmlFor="field-diagnosis" className="font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-mono">
                ۳
              </span>
              تشخیص و تشخیص‌های افتراقی (Diagnosis & Differentials)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">محرمانه (مخصوص پزشک)</span>
          </label>
          <textarea
            id="field-diagnosis"
            rows={2}
            value={diagnosis}
            onChange={(e) => handleChange(setDiagnosis, e.target.value)}
            placeholder="مثال: میگرن ناشی از استرس، افتراق از سردرد تنشی..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition outline-none resize-none bg-white text-slate-900"
          />
        </div>

        {/* Field 4: Prescriptions & Advice */}
        <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/70">
          <label htmlFor="field-prescriptions" className="font-bold text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono">
                ۴
              </span>
              توصیه‌ها، دستورات دارویی و نسخه (Prescriptions & Advice)
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">قابل مشاهده در پنل بیمار</span>
          </label>
          <textarea
            id="field-prescriptions"
            rows={3}
            value={prescriptions}
            onChange={(e) => handleChange(setPrescriptions, e.target.value)}
            placeholder="مثال: کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی و مصرف کافی مایعات..."
            className="w-full px-3 py-2 rounded-xl border border-emerald-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition outline-none resize-none bg-white text-slate-900"
          />
        </div>

        {/* Field 5: Follow-up Orders */}
        <div className="space-y-1.5 bg-blue-50/50 p-3 rounded-xl border border-blue-200/70">
          <label htmlFor="field-followUp" className="font-bold text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                ۵
              </span>
              دستور پیگیری (Follow-up Orders)
            </span>
            <span className="text-[10px] text-blue-700 font-medium">قابل مشاهده برای منشی و بیمار</span>
          </label>
          <textarea
            id="field-followUp"
            rows={2}
            value={followUp}
            onChange={(e) => handleChange(setFollowUp, e.target.value)}
            placeholder="مثال: مراجعه مجدد ۲ هفته دیگر جهت کنترل پاسخ درمانی..."
            className="w-full px-3 py-2 rounded-xl border border-blue-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition outline-none resize-none bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="clinical-save-bar pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          {hasUnsavedChanges && (
            <span className="text-amber-600 font-medium">تغییرات ذخیره‌نشده...</span>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>{isCompleted ? 'به‌روزرسانی پرونده بالینی' : 'ثبت نهایی و خاتمه ویزیت'}</span>
        </button>
      </div>
    </form>
  );
};
