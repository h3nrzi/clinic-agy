import { useUnsavedChanges } from "@/shared/navigation/UnsavedChanges";
import "./booking.css";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BookingWizard } from "./BookingWizard";
import { GatewaySimulator } from "@/features/payment-mock";
import { PaymentSuccessConfirmation } from "@/features/patient-portal";
import { useBookingStore } from "@/shared/stores/useBookingStore";

/** Route leaf: wizard, gateway and confirmation intentionally share one URL. */
export function BookingPage() {
  const booking = useBookingStore();
  const { step, resetBooking } = booking;
  const dirty =
    step !== "CONFIRMED" &&
    (booking.branchId !== "ONLINE" ||
      booking.serviceId !== "srv-1" ||
      booking.doctorId !== "doc-1" ||
      (booking.slotDateTime !== null &&
        booking.slotDateTime !== booking.preselectedSlotDateTime) ||
      booking.baseInsuranceId !== "ins-base-tamin" ||
      booking.suppInsuranceId !== "ins-supp-dana" ||
      booking.documents.length > 0 ||
      booking.pendingDocumentReads > 0);
  useUnsavedChanges({ dirty, onDiscard: resetBooking });
  const navigate = useNavigate();
  useEffect(
    () => () => {
      // Cleanup runs only after the router has accepted the actual route exit.
      resetBooking();
    },
    [resetBooking],
  );
  if (step === "GATEWAY")
    return (
      <div className="booking-flow">
        <GatewaySimulator />
      </div>
    );
  if (step === "CONFIRMED")
    return (
      <div className="booking-flow">
        <PaymentSuccessConfirmation
          onViewAppointments={() => {
            resetBooking();
            navigate("/patient");
          }}
          onBookAnother={resetBooking}
        />
      </div>
    );
  return (
    <div className="booking-flow">
      <BookingWizard onCancel={() => navigate("/patient")} />
    </div>
  );
}
