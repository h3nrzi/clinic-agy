import React, { useState } from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { calculateInsurance } from '@/features/insurance-engine/logic/calculateInsurance';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import { MedicalDocument } from '@/shared/types';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  Trash2,
  Wallet,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const Step3InsuranceDocuments: React.FC = () => {
  const {
    serviceId,
    baseInsuranceId,
    suppInsuranceId,
    documents,
    pendingDocumentReads,
    setBaseInsuranceId,
    setSuppInsuranceId,
    addDocument,
    removeDocument,
    setStep,
  } = useBookingStore();

  const currentUser = useAuthStore((s) => s.currentUser);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const service = tariffRepository.getServiceById(serviceId || 'srv-1');
  const baseInsurances = tariffRepository.getBaseInsurances();
  const suppInsurances = tariffRepository.getSupplementaryInsurances();

  const selectedBase = tariffRepository.getBaseInsuranceById(baseInsuranceId);
  const selectedSupp = tariffRepository.getSupplementaryInsuranceById(suppInsuranceId);

  // Real-time tiered calculation
  const freePrice = service?.freePrice || 280000;
  const calc = calculateInsurance(freePrice, selectedBase, selectedSupp);

  // Patient wallet
  const patientWallet = walletRepository.getByPatientId(currentUser.id);
  const walletCredit = patientWallet && patientWallet.balance > 0 ? patientWallet.balance : 0;
  const creditApplied = Math.min(walletCredit, calc.patientShare);
  const finalPayable = Math.max(0, calc.patientShare - creditApplied);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (file.size > maxSizeBytes) {
      setUploadError('حجم فایل نباید بیش از ۵ مگابایت باشد.');
      return;
    }

    const draftRevision = useBookingStore.getState().startDocumentRead();
    const reader = new FileReader();
    reader.onload = () => {
      // A pending file read must never populate an abandoned or another account’s booking.
      const current = useBookingStore.getState();
      if (!current.finishDocumentRead(draftRevision) || current.step === 'CONFIRMED') return;

      const newDoc: MedicalDocument = {
        id: `doc-${Date.now()}`,
        title: file.name,
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
        sizeBytes: file.size,
      };
      addDocument(newDoc);
    };
    reader.onerror = () => {
      if (useBookingStore.getState().finishDocumentRead(draftRevision)) {
        setUploadError('خواندن فایل انجام نشد. لطفاً فایل را دوباره انتخاب کنید.');
      }
    };
    reader.onabort = () => { useBookingStore.getState().finishDocumentRead(draftRevision); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 1. Insurance Selection */}
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            ۱. وضعیت پوشش بیمهٔ پایه و تکمیلی
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            محاسبهٔ پلکانی سهم بیمه به صورت بلادرنگ بر اساس ضوابط مصوب کلینیک انجام می‌شود.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Base Insurance Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="booking-base-insurance" className="block text-xs font-semibold text-slate-700">
              بیمه پایه (درمانی اول)
            </label>
            <select id="booking-base-insurance"
              value={baseInsuranceId}
              onChange={(e) => setBaseInsuranceId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {baseInsurances.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.coveragePercent > 0 ? `(${Math.round(b.coveragePercent * 100)}٪ پوشش)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Supplementary Insurance Dropdown */}
          <div className="space-y-1.5">
            <label htmlFor="booking-supp-insurance" className="block text-xs font-semibold text-slate-700">
              بیمه تکمیلی (درمانی دوم)
            </label>
            <select id="booking-supp-insurance"
              value={suppInsuranceId}
              onChange={(e) => setSuppInsuranceId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {suppInsurances.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{' '}
                  {s.coveragePercentOfRemaining > 0
                    ? `(${Math.round(s.coveragePercentOfRemaining * 100)}٪ از باقی‌مانده - سقف ${s.ceilingLimit.toLocaleString('fa-IR')} تومان)`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Real-time Calculation Breakdown Card (AC-01) */}
        <div className="booking-invoice bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800">
              ریز محاسبات مالی پلکانی
            </span>
            <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-semibold">
              محاسبه آنی
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>تعرفه آزاد خدمت:</span>
              <span className="font-semibold text-slate-800">{formatToman(freePrice)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>کسر سهم بیمه پایه ({selectedBase?.name || 'آزاد'}):</span>
              <span className="font-semibold text-emerald-700">
                {calc.baseCoverage > 0 ? `-${formatToman(calc.baseCoverage)}` : '۰ تومان'}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>
                کسر سهم بیمه تکمیلی ({selectedSupp?.name || 'فاقد تکمیلی'}):
              </span>
              <span className="font-semibold text-emerald-700">
                {calc.suppCoverage > 0 ? `-${formatToman(calc.suppCoverage)}` : '۰ تومان'}
              </span>
            </div>

            {walletCredit > 0 && (
              <div className="flex justify-between text-indigo-700 bg-indigo-50/70 px-2 py-1.5 rounded-lg font-medium">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" />
                  کسر از بستانکاری کیف پول بیمار ({formatToman(walletCredit)} موجودی):
                </span>
                <span className="font-bold">-{formatToman(creditApplied)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">مبلغ نهایی قابل پرداخت در درگاه:</span>
              <span className="font-extrabold text-teal-800 text-base">
                {formatToman(finalPayable)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Medical Document Upload (INT-02) */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-teal-600" />
            ۲. آپلود مدارک پزشکی اختیاری (نسخه، آزمایش، سونوگرافی)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            پزشک معالج پیش از جلسه یا در حین ویزیت، مدارک بارگذاری‌شده را بررسی خواهد کرد.
          </p>
        </div>

        {pendingDocumentReads > 0 && <p role="status">در حال آماده‌سازی {toPersianDigits(pendingDocumentReads)} مدرک…</p>}
        {uploadError && (
          <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="booking-upload border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-5 text-center transition bg-white">
          <input
            type="file"
            id="medical-doc-input"
            accept="image/png,image/jpeg,image/jpg,application/pdf"
            onChange={handleFileUpload}
            aria-describedby="booking-upload-help"
          />
          <label
            htmlFor="medical-doc-input"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-slate-700">
              انتخاب مدرک پزشکی (اختیاری)
            </div>
            <div id="booking-upload-help" className="text-[11px] text-slate-400">
              فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۵ مگابایت)
            </div>
          </label>
        </div>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-700">مدارک پیوست‌شده ({toPersianDigits(documents.length)} مدرک):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {doc.url.startsWith('data:image') ? (
                      <img
                        src={doc.url}
                        alt={doc.title}
                        className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {Math.round(doc.sizeBytes / 1024)} کیلوبایت
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeDocument(doc.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    title="حذف فایل"
                    aria-label={`حذف ${doc.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Action Footer */}
      <div className="booking-actions">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مرحله قبل</span>
        </button>

        <button
          type="button"
          onClick={() => setStep(4)}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
        >
          <span>مرحله بعد: بررسی پیش‌فاکتور</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
