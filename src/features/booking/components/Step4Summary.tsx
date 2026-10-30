import React from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { calculateInsurance } from '@/features/insurance-engine/logic/calculateInsurance';
import { formatDateTime, formatToman, toPersianDigits } from '@/shared/utils/formatters';
import {
  CreditCard,
  Building,
  User,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export const Step4Summary: React.FC = () => {
  const {
    branchId,
    serviceId,
    doctorId,
    slotDateTime,
    baseInsuranceId,
    suppInsuranceId,
    documents,
    setStep,
  } = useBookingStore();

  const currentUser = useAuthStore((s) => s.currentUser);

  const branches = memoryDb.getAll('branches');
  const branch = branches.find((b) => b.id === branchId) || branches[2];
  const service = tariffRepository.getServiceById(serviceId || 'srv-1');
  const doctor = doctorRepository.getById(doctorId || 'doc-1');
  const baseIns = tariffRepository.getBaseInsuranceById(baseInsuranceId);
  const suppIns = tariffRepository.getSupplementaryInsuranceById(suppInsuranceId);

  const freePrice = service?.freePrice || 280000;
  const calc = calculateInsurance(freePrice, baseIns, suppIns);

  const patientWallet = walletRepository.getByPatientId(currentUser.id);
  const walletCredit = patientWallet && patientWallet.balance > 0 ? patientWallet.balance : 0;
  const creditApplied = Math.min(walletCredit, calc.patientShare);
  const finalPayable = Math.max(0, calc.patientShare - creditApplied);

  const handleProceedToPayment = () => {
    setStep('GATEWAY');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Overview Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">پیش‌فاکتور شفاف و خلاصه نوبت</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              لطفاً مشخصات نوبت و جزئیات پرداخت را پیش از انتقال به درگاه شاپرک بررسی فرمایید.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full">
          در انتظار تایید و پرداخت
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Appointment Information */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">
            مشخصات نوبت ویزیت
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">بیمار:</span>
              <span className="font-semibold text-slate-900">
                {currentUser.name} ({currentUser.mobile})
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">شعبه / بستر:</span>
              <span className="font-semibold text-slate-900">{branch?.name}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <User className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-slate-500">پزشک معالج:</span>
              <span className="font-semibold text-slate-900">{doctor?.name}</span>
              <span className="text-[11px] text-slate-500">({doctor?.specialty})</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">خدمت تخصصی:</span>
              <span className="font-semibold text-slate-900">{service?.name}</span>
              <span className="text-[11px] text-slate-500">({toPersianDigits(service?.durationMinutes || 15)} دقیقه)</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-slate-500">زمان نوبت:</span>
              <span className="font-bold text-indigo-900">
                {slotDateTime ? formatDateTime(slotDateTime) : 'فردا - ساعت ۱۰:۰۰'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-500">بیمه اظهارشده:</span>
              <span className="font-medium text-slate-900">
                پایه: {baseIns?.name || 'آزاد'} | تکمیلی: {suppIns?.name || 'فاقد تکمیلی'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">مدارک پیوست‌شده:</span>
              <span className="font-medium text-slate-900">
                {documents.length > 0
                  ? `${toPersianDigits(documents.length)} فایل بارگذاری شد`
                  : 'بدون مدرک پیوست'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-invoice Financial Breakdown (SCREEN-03) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">
              ریز صورت‌حساب مالی (پیش‌فاکتور شفاف)
            </h4>

            <div className="divide-y divide-slate-100 text-xs mt-3">
              <div className="py-2.5 flex justify-between text-slate-600">
                <span>تعرفه آزاد خدمت:</span>
                <span className="font-semibold text-slate-800">{formatToman(freePrice)}</span>
              </div>

              <div className="py-2.5 flex justify-between text-slate-600">
                <span>کسر سهم بیمه پایه ({baseIns?.name}):</span>
                <span className="font-semibold text-emerald-700">
                  {calc.baseCoverage > 0 ? `-${formatToman(calc.baseCoverage)}` : '۰ تومان'}
                </span>
              </div>

              <div className="py-2.5 flex justify-between text-slate-600">
                <span>کسر سهم بیمه تکمیلی ({suppIns?.name}):</span>
                <span className="font-semibold text-emerald-700">
                  {calc.suppCoverage > 0 ? `-${formatToman(calc.suppCoverage)}` : '۰ تومان'}
                </span>
              </div>

              {creditApplied > 0 && (
                <div className="py-2.5 flex justify-between text-indigo-700 bg-indigo-50/60 px-2 rounded font-medium">
                  <span>کسر خودکار از بستانکاری کیف پول:</span>
                  <span className="font-bold">-{formatToman(creditApplied)}</span>
                </div>
              )}

              <div className="pt-3 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900">مبلغ نهایی قابل پرداخت:</span>
                <span className="text-teal-700 text-lg font-black">
                  {formatToman(finalPayable)}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              نوبت بلافاصله پس از تراکنش بانکی با وضعیت CONFIRMED قطعی شده و کد رهگیری صادر خواهد شد.
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مرحله قبل: ویرایش بیمه و مدارک</span>
        </button>

        <button
          type="button"
          onClick={handleProceedToPayment}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition"
        >
          <CreditCard className="w-4 h-4" />
          <span>انتقال به درگاه پرداخت شاپرک ({formatToman(finalPayable)})</span>
        </button>
      </div>
    </div>
  );
};
