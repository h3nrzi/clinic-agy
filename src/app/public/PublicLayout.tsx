import "./public.css";
import { HeartPulse } from "lucide-react";
import { Link, Outlet } from "react-router";

export function PublicLayout() {
  return (
    <div className="public-app" dir="rtl">
      <header className="public-header">
        <Link className="public-brand" to="/">
          <HeartPulse size={30} aria-hidden="true" />
          <span>
            کلینیک سلامت آژی<small>همراه شما در مسیر سلامت</small>
          </span>
        </Link>
        <span className="public-demo-label">
          محیط نمایشی با داده‌های ساختگی
        </span>
      </header>
      <Outlet />
      <footer className="public-footer">
        کلینیک سلامت آژی • پرداخت و پیامک شبیه‌سازی‌شده • خدمات درمانی واقعی
        ارائه نمی‌شود.
      </footer>
    </div>
  );
}
