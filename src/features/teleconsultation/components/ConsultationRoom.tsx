import React, { useState } from 'react';
import {
  ArrowRight,
  User,
  FileText,
  CheckCircle2,
  ClipboardList,
  Layers,
  Eye,
} from 'lucide-react';
import { Appointment, PatientDocument } from '@/shared/types';
import { appointmentRepository } from '@/mocks/repositories/appointmentRepository';
import { formatToman, formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import { VideoCallSimulator } from './VideoCallSimulator';
import { ClinicalNoteForm } from './ClinicalNoteForm';
import { DocumentZoomModal } from '@/features/secretary/components/DocumentZoomModal';

interface ConsultationRoomProps {
  appointment: Appointment;
  doctorName: string;
  onBack: () => void;
  onConsultationCompleted?: () => void;
}

export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  appointment,
  doctorName,
  onBack,
  onConsultationCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'CLINICAL_NOTE' | 'DOCUMENTS' | 'DETAILS'>('CLINICAL_NOTE');
  const [selectedDocForZoom, setSelectedDocForZoom] = useState<PatientDocument | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleSaveClinicalNote = (noteData: {
    mainComplaint: string;
    findings: string;
    diagnosis: string;
    prescriptions: string;
    followUp: string;
  }) => {
    appointmentRepository.saveClinicalNote(appointment.id, appointment.doctorId, noteData);
    setIsSuccessModalOpen(true);
  };

  return (
    <div
      data-testid="doctor-consultation-room"
      className="space-y-6"
    >
      {/* Top Banner Navigation & Patient Info Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            aria-label="بازگشت به کارتابل پزشک"
            title="بازگشت به کارتابل پزشک"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
            <User className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">{appointment.patientName}</h2>
              <span className="font-mono text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold text-slate-700">
                {appointment.trackingCode}
              </span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                اتاق ویزیت ویدیویی زنده (FLOW-04)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              خدمت: <strong>{appointment.serviceName}</strong> • زمان: {formatDateTime(appointment.dateTime)}
            </p>
          </div>
        </div>

        {/* Doctor and Session Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="text-left sm:text-right hidden sm:block">
            <div className="font-bold text-slate-800">{doctorName}</div>
            <div className="text-[11px] text-teal-600 font-medium">پزشک معالج آنلاین</div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
          >
            خروج از اتاق ویزیت
          </button>
        </div>
      </div>

      {/* Side-by-Side Dual Column Layout (DEC-FE-02) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Video Call Stream & Media Controls */}
        <div className="lg:col-span-5 space-y-4">
          <VideoCallSimulator
            doctorName={doctorName}
            patientName={appointment.patientName}
            isDoctorView={true}
            onEndCall={onBack}
            initialMinutes={appointment.durationMinutes || 15}
          />

          {/* Quick Context Card Under Video */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">نوع نوبت:</span>
              <span className="font-semibold text-slate-900">ویزیت تخصصی آنلاین</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">تعرفه و پرداخت بیمار:</span>
              <span className="font-semibold text-slate-900">{formatToman(appointment.initialPatientPaid)} تومان</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">وضعیت حساب:</span>
              <span className={`font-semibold ${appointment.isSoftLocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                {appointment.isSoftLocked ? 'دارای بدهی' : 'تسویه کامل'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Tabs for Clinical Note, Documents, and Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Tab Navigation Headers */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('CLINICAL_NOTE')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 font-bold transition whitespace-nowrap ${
                activeTab === 'CLINICAL_NOTE'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>فرم شرح‌حال ۵ فیلدی (FLOW-04)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 font-bold transition whitespace-nowrap ${
                activeTab === 'DOCUMENTS'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>مدارک و آزمایش‌های بیمار ({toPersianDigits(appointment.documents.length)})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DETAILS')}
              className={`flex items-center gap-1.5 pb-3 px-3 border-b-2 font-bold transition whitespace-nowrap ${
                activeTab === 'DETAILS'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>مشخصات مالی و بیمه</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-5 sm:p-6">
            {activeTab === 'CLINICAL_NOTE' && (
              <ClinicalNoteForm
                appointmentId={appointment.id}
                patientName={appointment.patientName}
                initialNote={appointment.clinicalNote}
                onSave={handleSaveClinicalNote}
                isCompleted={appointment.status === 'COMPLETED'}
              />
            )}

            {activeTab === 'DOCUMENTS' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    مدارک و پرونده‌های ارسالی بیمار
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    تعداد: {toPersianDigits(appointment.documents.length)} مدرک
                  </span>
                </div>

                {appointment.documents.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 bg-slate-50">
                    بیمار مدرک یا آزمایشی برای این نوبت آپلود نکرده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {appointment.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="truncate">
                            <div className="font-bold text-slate-800 truncate">{doc.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {formatDateTime(doc.uploadedAt)}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedDocForZoom(doc)}
                          className="inline-flex items-center gap-1 bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg font-semibold transition shrink-0"
                          title="مشاهده بزرگ‌نمایی تصویر"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>زوم</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'DETAILS' && (
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-slate-800 text-sm">جزئیات مالی، پوشش بیمه و لاگ نوبت</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">تعرفه آزاد خدمت:</span>
                    <span className="font-semibold text-slate-800">{formatToman(appointment.freePrice)} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">سهم بیمه پایه:</span>
                    <span className="font-semibold text-slate-800">{formatToman(appointment.baseInsuranceCoverage)} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">سهم بیمه تکمیلی:</span>
                    <span className="font-semibold text-slate-800">{formatToman(appointment.suppInsuranceCoverage)} تومان</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <span className="text-slate-700">مبلغ پرداختی بیمار در درگاه:</span>
                    <span className="text-teal-700">{formatToman(appointment.initialPatientPaid)} تومان</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal for Documents */}
      <DocumentZoomModal
        document={selectedDocForZoom}
        isOpen={!!selectedDocForZoom}
        onClose={() => setSelectedDocForZoom(null)}
      />

      {/* Success Confirmation Modal */}
      {isSuccessModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-900 text-base">پرونده بالینی با موفقیت ثبت شد</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                یادداشت ۵ فیلدی بیمار <strong>{appointment.patientName}</strong> در دیتابیس ثبت و وضعیت نوبت به حالت <strong>تکمیل‌شده (COMPLETED)</strong> تغییر یافت.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 text-right space-y-1">
              <div className="font-bold text-slate-800">اعمال ماتریس محرمانگی AC-05:</div>
              <div>• بیمار فقط نسخه و دستور پیگیری را مشاهده خواهد کرد.</div>
              <div>• منشی فقط دستور پیگیری را مشاهده خواهد کرد.</div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  if (onConsultationCompleted) onConsultationCompleted();
                  onBack();
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm w-full"
              >
                بازگشت به کارتابل نوبت‌ها
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
