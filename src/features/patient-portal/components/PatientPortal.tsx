import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useBookingStore } from "@/shared/stores/useBookingStore";
import { memoryDb } from "@/mocks/db/memoryDb";
import { appointmentRepository } from "@/mocks/repositories/appointmentRepository";
import { walletRepository } from "@/mocks/repositories/walletRepository";
import {
  formatToman,
  formatDateTime,
  toPersianDigits,
} from "@/shared/utils/formatters";
import { PrescriptionModal } from "./PrescriptionModal";
import { CancelAppointmentModal } from "./CancelAppointmentModal";
import type { Appointment } from "@/shared/types";
import {
  Calendar,
  CreditCard,
  Video,
  Lock,
  Unlock,
  PlusCircle,
  FileText,
} from "lucide-react";
import "./patient-portal.css";

/** The identity key clears private room and dialog state when the demo account changes. */
export function PatientPortal() {
  const patientId = useAuthStore((state) => state.currentUser.id);
  return <PatientPortalContent key={patientId} />;
}

const appointmentLabels: Record<Appointment["status"], string> = {
  CONFIRMED: "قطعی‌شده",
  IN_CONSULTATION: "در حال ویزیت",
  PENDING_PAYMENT: "در انتظار پرداخت",
  COMPLETED: "ویزیت تکمیل‌شده",
  CANCELLED_BY_PATIENT: "لغو شده توسط بیمار",
  CANCELLED_BY_CLINIC: "لغو شده توسط کلینیک",
};

function visitLocation(app: Appointment) {
  return app.branchId === "ONLINE"
    ? "ویزیت آنلاین"
    : `شعبه ${app.branchId === "TEHRAN" ? "تهران" : "اصفهان"}`;
}

function PatientPortalContent() {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const resetBooking = useBookingStore((s) => s.resetBooking);
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);
  const [, refresh] = useState(0);
  useEffect(
    () =>
      memoryDb.subscribe(() => {
        refresh((v) => v + 1);
      }),
    [],
  );
  const patientAppointments = appointmentRepository
    .getAll()
    .filter((a) => a.patientId === currentUser.id);
  const prescriptionAppointment = patientAppointments.find(app => app.id === prescriptionId && app.clinicalNote);
  const nextAppointment = [...patientAppointments]
    .filter(
      (a) =>
        a.status === "CONFIRMED" && new Date(a.dateTime).getTime() > Date.now(),
    )
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))[0];
  const walletBalance =
    walletRepository.getByPatientId(currentUser.id)?.balance || 0;
  const startBooking = () => {
    navigate("/patient/booking");
    resetBooking();
  };

  return (
    <div className="patient-portal">
      <header className="patient-page-heading">
        <div>
          <p className="patient-eyebrow">فضای بیمار</p>
          <h1>نوبت‌ها و پرونده من</h1>
          <p>زمان ویزیت، وضعیت حساب و توصیه‌های پزشک را اینجا ببینید.</p>
        </div>
        <button
          type="button"
          className="patient-button patient-button-primary"
          onClick={startBooking}
        >
          <PlusCircle aria-hidden="true" size={20} />
          رزرو نوبت جدید
        </button>
      </header>

      <div className="patient-overview">
        <section
          className="patient-next patient-panel"
          aria-labelledby="patient-next-title"
        >
          <div className="patient-section-label">
            <Calendar aria-hidden="true" size={21} />
            <h2 id="patient-next-title">نوبت بعدی شما</h2>
          </div>
          {nextAppointment ? (
            <>
              <p className="patient-next-time">
                {formatDateTime(nextAppointment.dateTime)}
              </p>
              <p className="patient-next-doctor">
                {nextAppointment.doctorName}
              </p>
              <p>
                {nextAppointment.serviceName} · {visitLocation(nextAppointment)}
              </p>
              <p className="patient-helper">
                جزئیات و اقدامات این نوبت در فهرست زیر در دسترس است.
              </p>
            </>
          ) : (
            <>
              <p className="patient-next-time">نوبت پیش رو ندارید</p>
              <p>برای دریافت خدمات، نوبت جدید رزرو کنید.</p>
            </>
          )}
        </section>
        <section
          className="patient-wallet patient-panel"
          aria-labelledby="patient-wallet-title"
        >
          <div className="patient-section-label">
            <CreditCard aria-hidden="true" size={21} />
            <h2 id="patient-wallet-title">کیف پول بیمار</h2>
          </div>
          <p
            className={`patient-wallet-amount ${walletBalance < 0 ? "patient-debt" : walletBalance > 0 ? "patient-credit" : ""}`}
          >
            {formatToman(walletBalance)}
          </p>
          <p className="patient-wallet-state">
            {walletBalance < 0
              ? "مانده بدهی"
              : walletBalance > 0
                ? "مانده بستانکاری"
                : "حساب تسویه است"}
          </p>
          <p className="patient-helper">
            {walletBalance < 0
              ? "دارای مانده بدهی — نوبت‌های آنلاین مشمول قفل نرم می‌شوند."
              : walletBalance > 0
                ? "دارای بستانکاری قابل کسر از نوبت بعدی"
                : "بدون بدهی یا بستانکاری"}
          </p>
        </section>
      </div>

      <section
        className="patient-appointments"
        aria-labelledby="patient-appointments-title"
      >
        <div className="patient-list-heading">
          <div>
            <h2 id="patient-appointments-title">نوبت‌های ثبت‌شدهٔ من</h2>
            <p>جزئیات نوبت، ورود به ویزیت و نسخه و دستور پیگیری</p>
          </div>
          <span className="patient-count">
            {toPersianDigits(patientAppointments.length)} نوبت ثبت‌شده
          </span>
        </div>
        {patientAppointments.length === 0 ? (
          <div className="patient-empty patient-panel">
            <Calendar aria-hidden="true" size={32} />
            <h3>هنوز نوبتی ثبت نکرده‌اید</h3>
            <p>
              پس از رزرو، جزئیات نوبت و وضعیت آن را در همین صفحه خواهید دید.
            </p>
            <button
              type="button"
              className="patient-button patient-button-primary"
              onClick={startBooking}
            >
              شروع رزرو نوبت آنلاین
            </button>
          </div>
        ) : (
          <div className="patient-card-list">
            {patientAppointments.map((app) => (
              <article
                key={app.id}
                className="patient-appointment patient-panel"
                aria-label={`نوبت ${app.trackingCode}`}
              >
                <div className="patient-card-heading">
                  <h3>{app.serviceName}</h3>
                  <span className="patient-visit-kind">
                    {visitLocation(app)}
                  </span>
                </div>
                <dl className="patient-details">
                  <div>
                    <dt>پزشک</dt>
                    <dd>{app.doctorName}</dd>
                  </div>
                  <div>
                    <dt>زمان نوبت</dt>
                    <dd>{formatDateTime(app.dateTime)}</dd>
                  </div>
                  <div>
                    <dt>کد رهگیری</dt>
                    <dd>
                      <bdi className="patient-tracking">{app.trackingCode}</bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>وضعیت نوبت</dt>
                    <dd>
                      <span
                        className={`patient-status patient-status-${app.status.toLowerCase()}`}
                      >
                        {appointmentLabels[app.status]}
                      </span>
                    </dd>
                  </div>
                  <div className="patient-payment-detail">
                    <dt>مبلغ پرداختی اولیه</dt>
                    <dd>
                      {formatToman(app.initialPatientPaid)}
                      {app.walletCreditApplied > 0 && (
                        <span className="patient-helper">
                          با کسر {formatToman(app.walletCreditApplied)} از
                          بستانکاری
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
                {app.isSoftLocked && (
                  <div className="patient-notice patient-notice-debt">
                    <Lock aria-hidden="true" size={20} />
                    <p>
                      قفل نرم فعال است: به دلیل مابه‌التفاوت بدهی{" "}
                      {Math.abs(app.debtOrCreditBalance).toLocaleString(
                        "fa-IR",
                      )}{" "}
                      تومان پس از اصلاح بیمه، ورود به جلسه مشروط به تسویه یا
                      بازگشایی اضطراری منشی است.
                    </p>
                  </div>
                )}
                {app.emergencyUnlocked && (
                  <div className="patient-notice patient-notice-success">
                    <Unlock aria-hidden="true" size={20} />
                    <p>
                      بازگشایی اضطراری توسط منشی انجام شد: «
                      {app.emergencyUnlockReason}»
                    </p>
                  </div>
                )}
                {(app.clinicalNote || app.status === "CONFIRMED") && (
                  <div className="patient-actions">
                    {app.clinicalNote && <button type="button" className="patient-button" aria-haspopup="dialog" onClick={() => setPrescriptionId(app.id)}><FileText size={18} aria-hidden="true" />مشاهده نسخه و توصیه‌ها</button>}
                    {app.status === "CONFIRMED" && <>
                    {app.branchId === "ONLINE" && (
                      <>
                        {app.isSoftLocked && (
                          <button
                            type="button"
                            className="patient-button patient-button-debt"
                            onClick={() =>
                              appointmentRepository.settleDebt(app.id)
                            }
                          >
                            <CreditCard aria-hidden="true" size={18} />
                            پرداخت مابه‌التفاوت و رفع قفل
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={app.isSoftLocked}
                          className="patient-button patient-button-primary"
                          onClick={() => {
                            if (!app.isSoftLocked)
                              navigate(`/patient/consultations/${encodeURIComponent(app.id)}`);
                          }}
                        >
                          {app.isSoftLocked ? (
                            <Lock aria-hidden="true" size={18} />
                          ) : (
                            <Video aria-hidden="true" size={18} />
                          )}
                          {app.isSoftLocked
                            ? "ورود مسدود (قفل بدهی)"
                            : "ورود به اتاق ویزیت"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="patient-button patient-button-cancel"
                      onClick={() => setAppointmentToCancel(app)}
                    >
                      لغو نوبت
                    </button>
                    </>}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      {prescriptionAppointment?.clinicalNote && <PrescriptionModal appointment={prescriptionAppointment} note={prescriptionAppointment.clinicalNote} onClose={() => setPrescriptionId(null)} />}
      {appointmentToCancel && (
        <CancelAppointmentModal
          appointment={appointmentToCancel}
          onClose={() => setAppointmentToCancel(null)}
          onCancelled={() => setAppointmentToCancel(null)}
        />
      )}
    </div>
  );
}
