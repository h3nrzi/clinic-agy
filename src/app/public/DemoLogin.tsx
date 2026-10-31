import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuthStore, ROLE_PROFILES } from "@/shared/stores/useAuthStore";
import { useBookingStore } from "@/shared/stores/useBookingStore";
import { IdentityForm } from "./IdentityForm";
import {
  DEMO_ACCOUNTS,
  dashboardPath,
  permittedReturnPath,
} from "@/app/routing/roleRoutes";
import type { Role } from "@/shared/types";

export function DemoLogin() {
  const [role, setRole] = useState<Role>("PATIENT");
  const auth = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  if (auth.isLoggedIn)
    return <Navigate to={dashboardPath(auth.currentRole)} replace />;
  return (
    <main className="public-main login-main">
      <Link className="login-back" to="/">
        <ArrowRight size={18} aria-hidden="true" />
        بازگشت به خانه
      </Link>
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-heading">
          <ShieldCheck size={32} aria-hidden="true" />
          <span className="public-eyebrow">ورود به محیط نمایشی آژی</span>
          <h1 id="login-title">فضای کار خود را انتخاب کنید</h1>
          <p>
            پنج حساب آماده برای بررسی مسیرهای کلینیک. از اطلاعات هویتی واقعی
            استفاده نکنید.
          </p>
        </div>
        <fieldset className="login-accounts">
          <legend>حساب نمایشی</legend>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              aria-label={`حساب ${account.label}`}
              aria-pressed={role === account.role}
              onClick={() => setRole(account.role)}
            >
              <strong>{account.label}</strong>
              <small>{ROLE_PROFILES[account.role].name}</small>
            </button>
          ))}
        </fieldset>
        <p className="login-selected">
          ورود به حساب: <strong>{ROLE_PROFILES[role].name}</strong> •{" "}
          {ROLE_PROFILES[role].roleTitle}
        </p>
        <IdentityForm
          onVerified={() => {
            useBookingStore.getState().resetBooking();
            auth.switchRole(role);
            navigate(permittedReturnPath(location.state?.returnTo, role), {
              replace: true,
            });
          }}
        />
      </section>
    </main>
  );
}
