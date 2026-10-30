import React from 'react';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { memoryDb } from '@/mocks/db/memoryDb';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { BranchId, ServiceTariff } from '@/shared/types';
import { formatToman, toPersianDigits } from '@/shared/utils/formatters';
import { Video, Building2, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

export const Step1BranchService: React.FC = () => {
  const { branchId, serviceId, setBranchId, setServiceId, setStep } = useBookingStore();

  const branches = memoryDb.getAll('branches');
  const availableServices = tariffRepository.getServices(branchId || undefined);

  const selectedService = availableServices.find((s) => s.id === serviceId) || availableServices[0];

  const handleBranchSelect = (id: BranchId) => {
    setBranchId(id);
  };

  const handleServiceSelect = (service: ServiceTariff) => {
    setServiceId(service.id);
  };

  const handleNext = () => {
    if (branchId && selectedService) {
      setStep(2);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* 1. Branch Selector */}
      <section className="space-y-3">
        <label className="block text-sm font-bold text-slate-800">
          ۱. انتخاب شعبه یا نوع ویزیت
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {branches.map((b) => {
            const isSelected = branchId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBranchSelect(b.id)}
                className={`p-4 rounded-xl text-right border-2 transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`p-2 rounded-lg ${
                        b.id === 'ONLINE'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {b.id === 'ONLINE' ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.address}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  ساعت کاری: {b.workingHours}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Service Selector */}
      <section className="space-y-3">
        <label className="block text-sm font-bold text-slate-800">
          ۲. انتخاب خدمت تخصصی
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableServices.map((srv) => {
            const isSelected = selectedService?.id === srv.id;
            return (
              <button
                key={srv.id}
                type="button"
                onClick={() => handleServiceSelect(srv)}
                className={`p-4 rounded-xl text-right border-2 transition flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{srv.name}</span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {srv.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      مدت استاندارد: {toPersianDigits(srv.durationMinutes)} دقیقه
                    </span>
                    <span>•</span>
                    <span className="text-teal-700 font-semibold">
                      تعرفه آزاد: {formatToman(srv.freePrice)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition"
        >
          <span>مرحله بعد: انتخاب پزشک و تقویم</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
