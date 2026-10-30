import React, { useState, useEffect } from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { walletRepository } from '@/mocks/repositories/walletRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { calculateInsurance } from '@/features/insurance-engine/logic/calculateInsurance';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

export const GatewaySimulator: React.FC = () => {
  const {
    serviceId,
    baseInsuranceId,
    suppInsuranceId,
    gatewayError,
    setGatewayError,
    submitSuccessfulBooking,
    setStep,
  } = useBookingStore();

  const currentUser = useAuthStore((s) => s.currentUser);

  // Card form state
  const [cardNumber, setCardNumber] = useState('۶۰۳۷-۹۹۱۸-۴۳۲۱-۵۵۴۴');
  const [cvv2, setCvv2] = useState('۵۴۳');
  const [expMonth, setExpMonth] = useState('۰۸');
  const [expYear, setExpYear] = useState('۰۶');
  const [dynamicPassword, setDynamicPassword] = useState('۷۴۸۳۹');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  // 10-minute countdown timer
  const [secondsLeft, setSecondsLeft] = useState(600);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${toPersianDigits(mins)}:${toPersianDigits(secs < 10 ? `0${secs}` : secs)}`;
  };

  // Financial calculation
  const service = tariffRepository.getServiceById(serviceId || 'srv-1');
  const baseIns = tariffRepository.getBaseInsuranceById(baseInsuranceId);
  const suppIns = tariffRepository.getSupplementaryInsuranceById(suppInsuranceId);
  const freePrice = service?.freePrice || 280000;
  const calc = calculateInsurance(freePrice, baseIns, suppIns);

  const patientWallet = walletRepository.getByPatientId(currentUser.id);
  const walletCredit = patientWallet && patientWallet.balance > 0 ? patientWallet.balance : 0;
  const creditApplied = Math.min(walletCredit, calc.patientShare);
  const finalPayable = Math.max(0, calc.patientShare - creditApplied);

  const handleSimulateSuccess = () => {
    setGatewayError(null);
    submitSuccessfulBooking();
  };

  const handleSimulateFailure = () => {
    setGatewayError('خطای درگاه بانکی (کد ۵۱): موجودی حساب کافی نیست یا رمز دوم اینترنتی منقضی شده است.');
  };

  const handleCancelPayment = () => {
    setGatewayError(null);
    setStep(4);
  };

  const handleRequestOtp = () => {
    setIsRequestingOtp(true);
    setTimeout(() => {
      setIsRequestingOtp(false);
      setOtpSentNotice(true);
      setDynamicPassword(String(Math.floor(10000 + Math.random() * 90000)));
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Mock Shaparak Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-teal-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  شبیه‌ساز درگاه شاپرک
                </span>
                <span className="text-xs text-slate-300">پرداخت الکترونیک امن</span>
              </div>
              <h2 className="text-lg font-bold mt-1">سامانه پرداخت اینترنتی به پرداخت ملت / شاپرک</h2>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/80 px-4 py-2 rounded-xl text-left font-mono">
            <div className="text-[10px] text-slate-400">زمان باقی‌مانده جلسه:</div>
            <div className="text-base font-bold text-amber-400 flex items-center gap-1.5 justify-end">
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Card Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
        {/* Merchant & Order Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">پذیرنده:</span>
            <span className="font-bold text-slate-800">کلینیک سلامت زنجیره‌ای آژی</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">شماره پایانه:</span>
            <span className="font-mono font-semibold text-slate-700">TRM-8894102</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">شناسه پرداخت:</span>
            <span className="font-mono font-semibold text-slate-700">PAY-981240</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">مبلغ تراکنش:</span>
            <span className="font-bold text-teal-700 text-sm">{formatToman(finalPayable)}</span>
          </div>
        </div>

        {/* Error notification if failure was simulated */}
        {gatewayError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3 text-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1 font-semibold">{gatewayError}</div>
          </div>
        )}

        {/* Card Inputs */}
        <div className="space-y-4 max-w-lg mx-auto">
          {/* Card Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              شماره کارت بانکی ۱۶ رقمی
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-center font-mono text-sm font-bold text-slate-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500"
                dir="ltr"
              />
              <CreditCard className="w-5 h-5 text-slate-400 absolute right-3 top-3" />
            </div>
          </div>

          {/* CVV2 and Expiration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">کد امنیتی CVV2</label>
              <input
                type="text"
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">تاریخ انقضا (ماه / سال)</label>
              <div className="flex items-center gap-1.5" dir="ltr">
                <input
                  type="text"
                  value={expMonth}
                  onChange={(e) => setExpMonth(e.target.value)}
                  placeholder="ماه"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-center font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-slate-400 font-bold">/</span>
                <input
                  type="text"
                  value={expYear}
                  onChange={(e) => setExpYear(e.target.value)}
                  placeholder="سال"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-center font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">رمز دوم پویا (OTP)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dynamicPassword}
                onChange={(e) => setDynamicPassword(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-center font-mono text-sm font-bold text-slate-800 tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500"
                dir="ltr"
              />
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isRequestingOtp}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition"
              >
                {isRequestingOtp ? 'ارسال...' : 'دریافت رمز پویا'}
              </button>
            </div>
            {otpSentNotice && (
              <p className="text-[11px] text-emerald-600">رمز پویا به صورت خودکار در کادر وارد شد.</p>
            )}
          </div>
        </div>

        {/* Evaluation Simulation Buttons (INT-03) */}
        <div className="pt-6 border-t border-slate-200 space-y-3">
          <div className="text-center text-xs text-slate-500 font-medium">
            کلیدهای کنترل ارزیابی فرانت‌اند (Deterministic Mock Trigger):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Simulate Success */}
            <button
              type="button"
              onClick={handleSimulateSuccess}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold text-xs shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>پرداخت موفق (تایید قطعی نوبت)</span>
            </button>

            {/* 2. Simulate Failure */}
            <button
              type="button"
              onClick={handleSimulateFailure}
              className="flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 p-3 rounded-xl font-bold text-xs transition"
            >
              <XCircle className="w-4 h-4" />
              <span>تراکنش ناموفق (موجودی ناکافی)</span>
            </button>

            {/* 3. Cancel */}
            <button
              type="button"
              onClick={handleCancelPayment}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 p-3 rounded-xl font-bold text-xs transition"
            >
              <ArrowRight className="w-4 h-4" />
              <span>انصراف و بازگشت</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
