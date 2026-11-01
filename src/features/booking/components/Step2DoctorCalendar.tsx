import React, { useMemo } from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { doctorRepository } from '@/mocks/repositories/doctorRepository';
import { formatDateTime, toPersianDigits } from '@/shared/utils/formatters';
import { ArrowLeft, ArrowRight, Calendar, Clock, UserCheck, CheckCircle2 } from 'lucide-react';

export const Step2DoctorCalendar: React.FC = () => {
  const { branchId, doctorId, slotDateTime, setDoctorId, setSlotDateTime, setDefaultSlotDateTime, setStep } =
    useBookingStore();

  const doctors = doctorRepository.getByBranch(branchId || 'ONLINE');
  const selectedDoctor = doctors.find((d) => d.id === doctorId) || doctors[0];

  // Generate upcoming slots for the selected doctor
  const availableSlots = useMemo(() => {
    const slots: { label: string; dateStr: string; slots: { id: string; iso: string; time: string }[] }[] = [];

    // Next 3 days
    for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);

      const dayTitle =
        dayOffset === 1
          ? 'فردا'
          : dayOffset === 2
          ? 'پس‌فردا'
          : d.toLocaleDateString('fa-IR', { weekday: 'long' });

      const dateLabel = d.toLocaleDateString('fa-IR', {
        month: 'long',
        day: 'numeric',
      });

      const times = ['10:00', '11:30', '14:00', '16:30', '18:00'];
      const daySlots = times.map((t, idx) => {
        const [hours, minutes] = t.split(':').map((x) => parseInt(x, 10));
        const slotDate = new Date(d);
        slotDate.setHours(hours, minutes, 0, 0);
        return {
          id: `slot-${dayOffset}-${idx}`,
          iso: slotDate.toISOString(),
          time: t,
        };
      });

      slots.push({
        label: `${dayTitle} (${dateLabel})`,
        dateStr: d.toISOString().split('T')[0],
        slots: daySlots,
      });
    }

    return slots;
  }, []);

  // Capture the actual automatic default; manual choices do not change its baseline.
  React.useEffect(() => {
    if (!slotDateTime && availableSlots[0]?.slots[0]) setDefaultSlotDateTime(availableSlots[0].slots[0].iso);
  }, [slotDateTime, availableSlots, setDefaultSlotDateTime]);

  const handleNext = () => {
    if (selectedDoctor && slotDateTime) {
      setStep(3);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 1. Doctor Selection */}
      <section className="space-y-3">
        <h3 className="block text-sm font-bold text-slate-800">
          ۱. انتخاب پزشک معالج
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doctors.map((doc) => {
            const isSelected = selectedDoctor?.id === doc.id;
            return (
              <button
                key={doc.id}
                aria-pressed={isSelected}
                type="button"
                onClick={() => setDoctorId(doc.id)}
                className={`p-4 rounded-xl text-right border-2 transition flex items-center gap-4 ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <img
                  src={doc.avatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    شماره نظام پزشکی: {toPersianDigits(doc.medicalCouncilNumber)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Slot Selection */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="block text-sm font-bold text-slate-800">
            ۲. انتخاب زمان ویزیت
          </h3>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            ظرفیت نوبت‌های فعال
          </span>
        </div>

        <div className="space-y-4">
          {availableSlots.map((group) => (
            <div key={group.dateStr} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h5 className="font-semibold text-xs text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                {group.label}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {group.slots.map((slot) => {
                  const isSelected = slotDateTime === slot.iso;
                  return (
                    <button
                      key={slot.id}
                      aria-pressed={isSelected}
                      aria-label={`${group.label}، ساعت ${toPersianDigits(slot.time)}`}
                      type="button"
                      onClick={() => setSlotDateTime(slot.iso)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                      }`}
                    >
                      ساعت {toPersianDigits(slot.time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Selected slot recap */}
      {slotDateTime && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex items-center gap-3 text-xs text-teal-900">
          <UserCheck className="w-5 h-5 text-teal-700 shrink-0" />
          <div>
            <span>نوبت انتخابی شما: </span>
            <strong>{selectedDoctor?.name}</strong>
            <span> در </span>
            <strong>{formatDateTime(slotDateTime)}</strong>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="booking-actions">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مرحله قبل</span>
        </button>

        <button
          type="button"
          disabled={!slotDateTime}
          onClick={handleNext}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
        >
          <span>مرحله بعد: محاسبه بیمه و مدارک</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
