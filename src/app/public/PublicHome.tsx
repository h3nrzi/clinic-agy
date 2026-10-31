import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  ShieldCheck,
  Video,
} from "lucide-react";
import { Link } from "react-router";
import { SEED_BRANCHES, SEED_SERVICES } from "@/mocks/db/seedData";

export function PublicHome() {
  return (
    <main className="public-main">
      <section className="public-hero" aria-labelledby="home-title">
        <div>
          <span className="public-eyebrow">
            خدمات حضوری و آنلاین، در یک پورتال
          </span>
          <h1 id="home-title">مراقبت از سلامت، با یک مسیر روشن</h1>
          <p>
            از انتخاب خدمت و پزشک تا پیگیری نوبت و ویزیت آنلاین؛ آژی مسیر دریافت
            خدمات کلینیک را کنار شما نگه می‌دارد.
          </p>
          <Link className="public-primary" to="/login">
            ورود و رزرو نوبت
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
          <small>برای رزرو، ابتدا وارد یک حساب نمایشی شوید.</small>
        </div>
        <aside className="public-journey" aria-label="مسیر دریافت خدمت">
          <ShieldCheck size={36} aria-hidden="true" />
          <h2>یک حساب، دسترسی به مسیر درمان</h2>
          <ol>
            <li>
              <span>۱</span>حساب نمایشی خود را انتخاب کنید
            </li>
            <li>
              <span>۲</span>خدمت، پزشک و زمان مناسب را ببینید
            </li>
            <li>
              <span>۳</span>نوبت‌ها و پیگیری خود را مدیریت کنید
            </li>
          </ol>
        </aside>
      </section>
      <section className="public-section" aria-labelledby="services-title">
        <div className="public-section-heading">
          <CalendarCheck aria-hidden="true" />
          <div>
            <h2 id="services-title">خدمات کلینیک</h2>
            <p>خدمات موجود در این نسخهٔ نمایشی</p>
          </div>
        </div>
        <div className="public-services">
          {SEED_SERVICES.map((service) => (
            <article className="public-card" key={service.id}>
              <h3>{service.name}</h3>
              <p>
                {service.durationMinutes.toLocaleString("fa-IR")} دقیقه •{" "}
                {service.category === "CONSULTATION"
                  ? "مشاوره و ویزیت"
                  : "خدمات تشخیصی و مراقبتی"}
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="public-section" aria-labelledby="branches-title">
        <div className="public-section-heading">
          <Building2 aria-hidden="true" />
          <div>
            <h2 id="branches-title">شعب و خدمات آنلاین</h2>
            <p>دسترسی حضوری در تهران و اصفهان، یا همراهی از راه دور</p>
          </div>
        </div>
        <div className="public-branches">
          {SEED_BRANCHES.map((branch) => (
            <article className="public-card" key={branch.id}>
              {branch.isOnline ? (
                <Video aria-hidden="true" />
              ) : (
                <Building2 aria-hidden="true" />
              )}
              <h3>{branch.name}</h3>
              <p>{branch.address}</p>
              <p>{branch.workingHours}</p>
              <bdi>{branch.phone}</bdi>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
