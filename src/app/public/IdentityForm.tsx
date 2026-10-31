import { useEffect, useRef, useState } from "react";

export const normalizeIdentityDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
export function validNationalCode(value: string) {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return false;
  const sum =
    [...value.slice(0, 9)].reduce((n, c, i) => n + Number(c) * (10 - i), 0) %
    11;
  return Number(value[9]) === (sum < 2 ? sum : 11 - sum);
}

type Field = "mobile" | "national" | "consent" | "otp";
const labels: Record<Field, string> = {
  mobile: "شماره موبایل",
  national: "کد ملی",
  consent: "رضایت آگاهانه",
  otp: "کد تأیید",
};

/** Form values remain local and are discarded when the login page is left. */
export function IdentityForm({ onVerified }: { onVerified: () => void }) {
  const [mobile, setMobile] = useState("");
  const [national, setNational] = useState("");
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState<"identity" | "otp">("identity");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const errorRef = useRef<HTMLDivElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (Object.keys(errors).length) errorRef.current?.focus();
  }, [errors]);
  useEffect(() => {
    if (step === "otp") otpRef.current?.focus();
  }, [step]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (step === "identity") {
      const next: Partial<Record<Field, string>> = {};
      if (!/^09\d{9}$/.test(normalizeIdentityDigits(mobile)))
        next.mobile = "شماره موبایل ۱۱ رقمی با ۰۹ شروع شود.";
      if (!validNationalCode(normalizeIdentityDigits(national)))
        next.national = "کد ملی معتبر ۱۰ رقمی وارد کنید.";
      if (!consent)
        next.consent = "برای ادامه، رضایت‌نامه را مطالعه و تأیید کنید.";
      setErrors(next);
      if (!Object.keys(next).length) setStep("otp");
    } else if (normalizeIdentityDigits(otp) !== "123456") {
      setErrors({ otp: "کد واردشده صحیح نیست. کد نمایشی: ۱۲۳۴۵۶" });
    } else {
      setErrors({});
      onVerified();
    }
  }
  return (
    <form className="login-form" noValidate onSubmit={submit}>
      {Object.keys(errors).length > 0 && (
        <div ref={errorRef} className="login-errors" role="alert" tabIndex={-1}>
          <strong>اطلاعات را بررسی کنید</strong>
          <ul>
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <a href={`#identity-${field}`}>
                  {labels[field as Field]}: {error}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === "identity" ? (
        <>
          <button
            className="login-sample"
            type="button"
            onClick={() => {
              setMobile("۰۹۱۲۳۴۵۶۷۸۹");
              setNational("۱۲۳۴۵۶۷۸۹۱");
              setErrors({});
            }}
          >
            استفاده از مشخصات آزمایشی
          </button>
          <p className="login-hint">
            با این اقدام، موبایل و کد ملی ساختگی در فرم قرار می‌گیرند.
          </p>
          <div className="login-fields">
            <div>
              <label htmlFor="identity-mobile">شماره موبایل</label>
              <input
                id="identity-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="tel"
                autoComplete="off"
                dir="ltr"
                aria-invalid={!!errors.mobile}
                aria-describedby={errors.mobile ? "mobile-error" : undefined}
              />
              {errors.mobile && (
                <p id="mobile-error" className="login-field-error">
                  {errors.mobile}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="identity-national">کد ملی</label>
              <input
                id="identity-national"
                value={national}
                onChange={(e) => setNational(e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                aria-invalid={!!errors.national}
                aria-describedby={
                  errors.national ? "national-error" : undefined
                }
              />
              {errors.national && (
                <p id="national-error" className="login-field-error">
                  {errors.national}
                </p>
              )}
            </div>
          </div>
          <section className="identity-consent" aria-labelledby="consent-title">
            <h3 id="consent-title">رضایت آگاهانه خدمات سلامت</h3>
            <p>
              این محیط صرفاً برای نمایش عملکرد سامانه است و خدمات درمانی واقعی
              ارائه نمی‌دهد. اطلاعات ساختگی وارد کنید. در ویزیت آنلاین، کیفیت
              ارتباط به اینترنت وابسته است و جلسه ضبط نمی‌شود.
            </p>
            <label htmlFor="identity-consent">
              <input
                id="identity-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                aria-invalid={!!errors.consent}
                aria-describedby={errors.consent ? "consent-error" : undefined}
              />
              متن را خواندم و با ادامهٔ جلسه نمایشی موافقم.
            </label>
            {errors.consent && (
              <p id="consent-error" className="login-field-error">
                {errors.consent}
              </p>
            )}
          </section>
        </>
      ) : (
        <>
          <p role="status" className="login-otp-notice">
            کد نمایشی شما: <bdi>۱۲۳۴۵۶</bdi>
            <span>هیچ پیامکی ارسال نشده است.</span>
          </p>
          <div>
            <label htmlFor="identity-otp">کد تأیید</label>
            <input
              ref={otpRef}
              id="identity-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              aria-invalid={!!errors.otp}
              aria-describedby={errors.otp ? "otp-error" : undefined}
            />
            {errors.otp && (
              <p id="otp-error" className="login-field-error">
                {errors.otp}
              </p>
            )}
          </div>
          <button
            className="login-sample"
            type="button"
            onClick={() => {
              setStep("identity");
              setErrors({});
            }}
          >
            ویرایش اطلاعات
          </button>
        </>
      )}
      <button className="identity-submit" type="submit">
        {step === "identity" ? "دریافت کد نمایشی" : "تأیید و ورود"}
      </button>
      <p className="login-hint">
        ورود نمایشی است؛ اطلاعات این فرم ذخیره نمی‌شود و حساب واقعی ایجاد
        نمی‌کند.
      </p>
    </form>
  );
}
