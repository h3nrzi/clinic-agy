import { useGuardedAction } from "@/shared/navigation/UnsavedChanges";
import { useNavigate } from "react-router";
import { useBookingStore } from "@/shared/stores/useBookingStore";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useScenarioStore } from "@/shared/stores/useScenarioStore";
import { memoryDb } from "@/mocks/db/memoryDb";
import { HeartPulse, User, X, Bell, ChevronDown, LogOut } from "lucide-react";
import { toPersianDigits } from "@/shared/utils/formatters";

export const Navbar = () => {
  const headerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const header = headerRef.current;
    const shell = header?.closest<HTMLElement>(".workspace-shell");
    if (!header || !shell) return;
    const updateHeight = () => {
      shell.style.setProperty("--workspace-header-height", `${header.getBoundingClientRect().height}px`);
    };
    updateHeight();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateHeight);
    observer?.observe(header);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeight);
      shell.style.removeProperty("--workspace-header-height");
    };
  }, []);
  const { currentUser, currentRole } = useAuthStore();
  const { statusNotice, dismissNotice } = useScenarioStore();
  const navigate = useNavigate();
  const runGuardedAction = useGuardedAction();
  const [panel, setPanel] = useState<"account" | "notifications" | null>(null);
  const [, refresh] = useState(0);
  useEffect(() => memoryDb.subscribe(() => refresh((v) => v + 1)), []);
  useEffect(() => setPanel(null), [currentRole]);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const scoped = memoryDb
    .getAll("appointments")
    .filter((a) =>
      currentRole === "PATIENT"
        ? a.patientId === currentUser.id
        : currentRole === "DOCTOR"
          ? a.doctorId === currentUser.id
          : currentRole === "ADMIN_FINANCE" ||
            a.branchId === currentUser.branchId ||
            a.branchId === "ONLINE",
    );
  const pending = scoped.filter((a) => a.status === "PENDING_PAYMENT");
  const locked = scoped.filter((a) => a.isSoftLocked);
  return (
    <>
      <header ref={headerRef} className="app-header bg-white border-b border-slate-200 sticky top-0 z-40">
        {statusNotice && (
          <div
            role="status"
            className="bg-teal-50 px-4 py-2 text-xs flex justify-between gap-4"
          >
            <span>{statusNotice}</span>
            <button onClick={dismissNotice} aria-label="بستن پیام">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="topbar">
          <a href="#workspace" className="topbar-brand">
            <HeartPulse size={28} />
            <div>
              <h1>کلینیک سلامت آژی</h1>
              <p>فضای کار / {currentUser.roleTitle}</p>
            </div>
          </a>
          <div className="topbar-actions">
            <span className="topbar-date">
              {new Date().toLocaleDateString("fa-IR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <button
              className="topbar-icon"
              aria-label="مرکز اعلان‌ها"
              aria-expanded={panel === "notifications"}
              onClick={() =>
                setPanel(panel === "notifications" ? null : "notifications")
              }
            >
              <Bell size={20} />
              {pending.length + locked.length > 0 && (
                <span className="notification-dot" />
              )}
            </button>
            <button
              className="topbar-icon logout-trigger"
              aria-label="خروج از حساب"
              title="خروج از حساب"
              onClick={() =>
                runGuardedAction(() => {
                  navigate("/", { flushSync: true });
                  useBookingStore.getState().resetBooking();
                  useAuthStore.getState().logout();
                })
              }
            >
              <LogOut className="logout-icon" size={20} aria-hidden="true" />
              <span>خروج از حساب</span>
            </button>
            <button
              className="account-trigger"
              aria-label={`حساب کاربری ${currentUser.name}`}
              aria-expanded={panel === "account"}
              onClick={() => setPanel(panel === "account" ? null : "account")}
            >
              <span className="account-avatar">
                <User size={20} />
              </span>
              <span>{currentUser.name}</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
        {panel && (
          <section
            className="header-popover"
            aria-label={panel === "account" ? "اطلاعات حساب" : "مرکز اعلان‌ها"}
          >
            <div className="popover-heading">
              <strong>
                {panel === "account" ? "حساب کاربری" : "مرکز اعلان‌ها"}
              </strong>
              <button aria-label="بستن پنل" onClick={() => setPanel(null)}>
                <X size={18} />
              </button>
            </div>
            {panel === "account" ? (
              <div className="space-y-3">
                <p>{currentUser.name}</p>
                <p>{currentUser.roleTitle}</p>
                <p>
                  <bdi>{currentUser.mobile}</bdi>
                </p>
                <small>
                  برای انتخاب حساب دیگر، خارج شوید و از صفحهٔ ورود حساب نمایشی
                  را انتخاب کنید.
                </small>
              </div>
            ) : (
              <div className="space-y-3">
                <p>{toPersianDigits(pending.length)} نوبت در انتظار پرداخت</p>
                <p>
                  {toPersianDigits(locked.length)} نوبت دارای محدودیت ورود به
                  ویزیت
                </p>
                <small>
                  وضعیت فعلی نوبت‌های قابل دسترسی برای نقش شما؛ بدون نمایش
                  اطلاعات بالینی.
                </small>
              </div>
            )}
          </section>
        )}
      </header>
    </>
  );
};
