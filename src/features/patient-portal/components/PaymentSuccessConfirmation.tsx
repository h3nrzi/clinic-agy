import React, { useState } from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { formatDateTime, formatToman } from '@/shared/utils/formatters';
import {
  CheckCircle2,
  Calendar,
  Building,
  User,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  Video,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';

interface Props {
  onViewAppointments: () => void;
  onBookAnother: () => void;
}

export const PaymentSuccessConfirmation: React.FC<Props> = ({
  onViewAppointments,
  onBookAnother,
}) => {
  const { lastConfirmedAppointment, transactionRef } = useBookingStore();
  const [copied, setCopied] = useState(false);

  if (!lastConfirmedAppointment) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(lastConfirmedAppointment.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Card */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
            وضعیت نوبت: قطعی‌شده (CONFIRMED)
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            پرداخت با موفقیت انجام شد و نوبت شما ثبت گردید
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            نیازی به تماس تلفنی یا تایید منشی نیست؛ نوبت شما در سیستم قطعی است.
          </p>
        </div>

        {/* Tracking Code Highlight Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">کد رهگیری اختصاصی نوبت:</span>
            <span className="text-xl font-black font-mono text-teal-800 tracking-wider">
              {lastConfirmedAppointment.trackingCode}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی کد رهگیری</span>
              </>
            )}
          </button>
        </div>

        {/* Appointment Details Grid */}
        <div className="bg-slate-50/60 rounded-xl p-4 text-xs space-y-2.5 text-right border border-slate-200">
          <div className="flex justify-between text-slate-700">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> پزشک معالج:
            </span>
            <span className="font-semibold text-slate-900">{lastConfirmedAppointment.doctorName}</span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> تاریخ و ساعت:
            </span>
            <span className="font-semibold text-slate-900">
              {formatDateTime(lastConfirmedAppointment.dateTime)}
            </span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span className="text-slate-500 flex items-center gap-1.5">
              {lastConfirmedAppointment.branchId === 'ONLINE' ? (
                <Video className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <Building className="w-3.5 h-3.5 text-blue-600" />
              )}
              نوع نوبت:
            </span>
            <span className="font-semibold text-slate-900">
              {lastConfirmedAppointment.branchId === 'ONLINE'
                ? 'ویزیت آنلاین تصویری (اتاق تله‌مدیسین)'
                : `حضوری - شعبه ${
                    lastConfirmedAppointment.branchId === 'TEHRAN' ? 'تهران' : 'اصفهان'
                  }`}
            </span>
          </div>

          <div className="flex justify-between text-slate-700">
            <span className="text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" /> مبلغ پرداختی در درگاه:
            </span>
            <span className="font-bold text-teal-800">
              {formatToman(lastConfirmedAppointment.initialPatientPaid)}
            </span>
          </div>

          {transactionRef && (
            <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-200">
              <span>شماره مرجع بانکی (RRN):</span>
              <span className="font-mono text-slate-700">{transactionRef}</span>
            </div>
          )}
        </div>

        {/* Simulated SMS Notification Banner */}
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-right flex items-start gap-2.5 text-xs text-teal-900">
          <MessageSquare className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">پیامک تایید به شماره همراه ارسال شد (شبیه‌ساز پیامک):</div>
            <div className="text-slate-600 mt-0.5 text-[11px]">
              «نوبت شما نزد {lastConfirmedAppointment.doctorName} در تاریخ{' '}
              {formatDateTime(lastConfirmedAppointment.dateTime)} با کد رهگیری{' '}
              {lastConfirmedAppointment.trackingCode} با موفقیت ثبت شد. کلینیک سلامت آژی»
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onViewAppointments}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
          >
            <span>مشاهده در نوبت‌های من</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onBookAnother}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-6 py-2.5 rounded-xl font-bold text-xs transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>رزرو نوبت آنلاین دیگر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
