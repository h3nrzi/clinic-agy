import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BookingWizard } from './BookingWizard';
import { GatewaySimulator } from '@/features/payment-mock';
import { PaymentSuccessConfirmation } from '@/features/patient-portal';
import { useBookingStore } from '@/shared/stores/useBookingStore';

/** Route leaf: wizard, gateway and confirmation intentionally share one URL. */
export function BookingPage() {
  const { step, resetBooking } = useBookingStore();
  const navigate = useNavigate();
  useEffect(() => () => {
    // A finished confirmation is consumed after the route actually leaves.
    // Unfinished booking abandonment belongs to the route exit guard in ticket 04.
    if (useBookingStore.getState().step === 'CONFIRMED') resetBooking();
  }, [resetBooking]);
  if (step === 'GATEWAY') return <GatewaySimulator />;
  if (step === 'CONFIRMED') return <PaymentSuccessConfirmation
    onViewAppointments={() => { resetBooking(); navigate('/patient'); }}
    onBookAnother={resetBooking}
  />;
  return <BookingWizard onCancel={() => { navigate('/patient'); resetBooking(); }} />;
}
