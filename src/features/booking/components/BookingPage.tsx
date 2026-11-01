import { useUnsavedChanges } from "@/shared/navigation/UnsavedChanges";
import "./booking.css";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { BookingWizard } from "./BookingWizard";
import { GatewaySimulator } from "@/features/payment-mock";
import { PaymentSuccessConfirmation } from "@/features/patient-portal";
import {
  hasUnfinishedBooking,
  useBookingStore,
} from "@/shared/stores/useBookingStore";

/** Route leaf: wizard, gateway and confirmation intentionally share one URL. */
export function BookingPage() {
  const booking = useBookingStore();
  const { step, resetBooking } = booking;
  const dirty = hasUnfinishedBooking(booking);
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
      <BookingWizard />
    </div>
  );
}
