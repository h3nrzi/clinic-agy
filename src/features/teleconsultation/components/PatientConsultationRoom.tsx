import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Video,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Appointment } from '@/shared/types';
import { formatDateTime } from '@/shared/utils/formatters';
import { VideoCallSimulator } from './VideoCallSimulator';

interface PatientConsultationRoomProps {
  appointment: Appointment;
  onExit: () => void;
}

export const PatientConsultationRoom: React.FC<PatientConsultationRoomProps> = ({
  appointment,
  onExit,
}) => {
  return (
    <div
      data-testid="patient-consultation-room"
      className="space-y-6"
    >
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            aria-label="بازگشت به داشبورد نوبت‌های من"
            title="بازگشت به داشبورد نوبت‌های من"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Video className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">اتاق ویزیت و مشاوره آنلاین</h2>
              <span className="font-mono text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">
                {appointment.trackingCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              پزشک معالج: <strong>{appointment.doctorName}</strong> • {formatDateTime(appointment.dateTime)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition self-start md:self-auto"
        >
          خروج از اتاق ویزیت
        </button>
      </div>

      {/* Main Grid: Video Stream and Clinical Notes / Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Video Area (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <VideoCallSimulator
            doctorName={appointment.doctorName}
            patientName={appointment.patientName}
            isDoctorView={false}
            onEndCall={onExit}
            initialMinutes={appointment.durationMinutes || 15}
          />
        </div>

        {/* Right Info Area (4 cols): Prescription & Advice (AC-05 Compliant) */}
        <div className="lg:col-span-4 space-y-4 text-xs">
          {/* Active Doctor Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                👩‍⚕️
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{appointment.doctorName}</h4>
                <p className="text-[11px] text-teal-600 font-medium">متخصص آنلاین کلینیک آژی</p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/60 text-teal-900 text-[11px] leading-relaxed flex items-start gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                جلسه به‌صورت رمزنگاری‌شده و بدون ضبط ویدیویی برگزار می‌شود. نسخه‌ها و دستورات پزشک در پایان ویزیت در همین صفحه و پروفایل شما ثبت می‌شوند.
              </span>
            </div>
          </div>

          {/* Clinical Note Preview (AC-05: Only prescriptions & followUp rendered) */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>نسخه و دستورات پزشک (پورتال بیمار)</span>
            </h4>

            {appointment.clinicalNote ? (
              <div className="space-y-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>توصیه‌ها، نسخه و دستورات دارویی:</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {appointment.clinicalNote.prescriptions || 'توصیه دارویی ثبت نشده است.'}
                  </p>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-1">
                  <div className="font-bold text-blue-900">دستور پیگیری:</div>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {appointment.clinicalNote.followUp || 'دستور پیگیری ثبت نشده است.'}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  مطابق بند AC-05 ماتریس محرمانگی، فیلدهای تشخیصی برای حفظ حریم بالینی در پورتال بیمار رندر نمی‌شوند.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400">
                پزشک در حال تکمیل پرونده و ثبت نسخه است. پس از ذخیره نهایی، جزئیات در این بخش نمایش می‌یابد.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
