import { describe, it, expect, afterEach, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
} from "@testing-library/react";
import App, { createAppRouter } from "@/App";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import type { Role } from "@/shared/types";

afterEach(cleanup);
beforeEach(() => {
  sessionStorage.clear();
  useAuthStore.setState({ isLoggedIn: false });
  window.history.replaceState({}, "", "/");
});

function finishLogin(account = "حساب بیمار", otp = "123456") {
  fireEvent.click(screen.getByRole("button", { name: account }));
  fireEvent.click(
    screen.getByRole("button", { name: "استفاده از مشخصات آزمایشی" }),
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
  fireEvent.change(screen.getByLabelText("کد تأیید"), {
    target: { value: otp },
  });
  fireEvent.click(screen.getByRole("button", { name: "تأیید و ورود" }));
}

describe("Public home and demo session through the full application", () => {
  it("starts as a guest with existing services and branches and an explicit login action", () => {
    render(<App router={createAppRouter(["/"])} />);
    expect(
      screen.getByRole("heading", { name: "مراقبت از سلامت، با یک مسیر روشن" }),
    ).toBeDefined();
    expect(screen.getByText("شعبه مرکزی تهران")).toBeDefined();
    expect(screen.getByText("شعبه شمس‌آبادی اصفهان")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "ورود و رزرو نوبت" }),
    ).toBeDefined();
    expect(screen.queryByText("کیف پول بیمار")).toBeNull();
  });

  it("activates the selected patient dashboard only after identity, consent and demo OTP", async () => {
    render(<App router={createAppRouter(["/login"])} />);
    fireEvent.click(screen.getByRole("button", { name: "حساب بیمار" }));
    fireEvent.click(
      screen.getByRole("button", { name: "استفاده از مشخصات آزمایشی" }),
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
    expect(screen.queryByText("کیف پول بیمار")).toBeNull();
    fireEvent.change(screen.getByLabelText("کد تأیید"), {
      target: { value: "۱۲۳۴۵۶" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تأیید و ورود" }));
    expect(await screen.findByText("کیف پول بیمار")).toBeDefined();
    expect(screen.getByRole("button", { name: "خروج از حساب" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "حساب پزشک" })).toBeNull();
  });

  it("starts a new app as a guest when the saved session is invalid", async () => {
    useAuthStore.getState().switchRole("ADMIN_FINANCE");
    sessionStorage.setItem("agy-demo-session-v1", "{broken-json");
    render(<App router={createAppRouter(["/finance"])} />);
    expect(
      await screen.findByRole("heading", {
        name: "فضای کار خود را انتخاب کنید",
      }),
    ).toBeDefined();
    expect(screen.queryByTestId("financial-dashboard")).toBeNull();
  });

  it.each([
    ["حساب بیمار", "/patient", "علی رضایی", "کیف پول بیمار"],
    [
      "حساب منشی تهران",
      "/secretary/tehran",
      "مریم کریمی",
      "میز کار پذیرش شعبه مرکزی تهران",
    ],
    [
      "حساب منشی اصفهان",
      "/secretary/isfahan",
      "نسیم صادقی",
      "میز کار پذیرش شعبه شمس‌آبادی اصفهان",
    ],
    ["حساب پزشک", "/doctor", "دکتر مریم احمدی", "کارتابل نوبت‌های پزشک"],
    [
      "حساب مدیر مالی",
      "/finance",
      "مهندس توکلی",
      "مدیریت مالی و عملکرد کلینیک",
    ],
  ])(
    "opens the real %s dashboard after UI login",
    async (label, path, name, content) => {
      const router = createAppRouter(["/login"]);
      render(<App router={router} />);
      finishLogin(label, "١٢٣٤٥٦");
      await screen.findByRole("button", { name: "خروج از حساب" });
      expect(router.state.location.pathname).toBe(path);
      expect(
        screen.getByRole("button", { name: `حساب کاربری ${name}` }),
      ).toBeDefined();
      expect(screen.getByText(content)).toBeDefined();
      expect(screen.queryByRole("button", { name: "حساب بیمار" })).toBeNull();
    },
  );

  it("retains identity values while announcing invalid identity, missing consent and incorrect OTP", async () => {
    render(<App router={createAppRouter(["/login"])} />);
    const mobile = screen.getByLabelText("شماره موبایل") as HTMLInputElement;
    const national = screen.getByLabelText("کد ملی") as HTMLInputElement;
    fireEvent.change(mobile, { target: { value: "۰۹۱۲۳" } });
    fireEvent.change(national, { target: { value: "1111111111" } });
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
    expect(mobile.value).toBe("۰۹۱۲۳");
    expect(national.value).toBe("1111111111");
    expect(mobile.getAttribute("aria-invalid")).toBe("true");
    expect(national.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("رضایت‌نامه");
    expect(document.activeElement).toBe(screen.getByRole("alert"));
    fireEvent.change(mobile, { target: { value: "٠٩١٢٣٤٥٦٧٨٩" } });
    fireEvent.change(national, { target: { value: "۱۲۳۴۵۶۷۸۹۱" } });
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
    expect(screen.queryByLabelText("کد تأیید")).toBeNull();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
    fireEvent.change(screen.getByLabelText("کد تأیید"), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تأیید و ورود" }));
    expect(screen.getByRole("alert").textContent).toContain("صحیح نیست");
    expect(screen.queryByText("کیف پول بیمار")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ویرایش اطلاعات" }));
    expect(
      (screen.getByLabelText("شماره موبایل") as HTMLInputElement).value,
    ).toBe("٠٩١٢٣٤٥٦٧٨٩");
    expect((screen.getByLabelText("کد ملی") as HTMLInputElement).value).toBe(
      "۱۲۳۴۵۶۷۸۹۱",
    );
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد نمایشی" }));
    fireEvent.change(screen.getByLabelText("کد تأیید"), {
      target: { value: "۱۲۳۴۵۶" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تأیید و ورود" }));
    expect(await screen.findByText("کیف پول بیمار")).toBeDefined();
    expect(
      Array.from({ length: sessionStorage.length }, (_, i) =>
        sessionStorage.getItem(sessionStorage.key(i)!),
      ).join(""),
    ).not.toContain("1234567891");
  });

  it("restores the selected role from this tab and clears it on logout", async () => {
    const router = createAppRouter(["/login"]);
    const app = render(<App router={router} />);
    finishLogin("حساب پزشک");
    await screen.findByRole("button", { name: "خروج از حساب" });
    const saved = sessionStorage.getItem("agy-demo-session-v1");
    expect(saved).toBe('{"accountId":"doc-1"}');
    app.unmount();
    router.dispose();
    // A fresh app boot with only this tab's saved browser session.
    useAuthStore.getState().logout();
    sessionStorage.setItem("agy-demo-session-v1", saved!);
    const restarted = createAppRouter(["/doctor"]);
    render(<App router={restarted} />);
    expect(
      screen.getByRole("button", { name: "حساب کاربری دکتر مریم احمدی" }),
    ).toBeDefined();
    expect(screen.queryByText("کیف پول بیمار")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }));
    expect(
      await screen.findByRole("heading", {
        name: "مراقبت از سلامت، با یک مسیر روشن",
      }),
    ).toBeDefined();
    expect(sessionStorage.getItem("agy-demo-session-v1")).toBeNull();
    await act(() => restarted.navigate("/doctor"));
    expect(
      await screen.findByRole("heading", {
        name: "فضای کار خود را انتخاب کنید",
      }),
    ).toBeDefined();
  });

  it("redirects a guest to login and resumes only an authorized internal destination", async () => {
    const router = createAppRouter(["/finance"]);
    render(<App router={router} />);
    expect(screen.queryByTestId("financial-dashboard")).toBeNull();
    await screen.findByRole("heading", { name: "فضای کار خود را انتخاب کنید" });
    finishLogin("حساب مدیر مالی");
    expect(await screen.findByTestId("financial-dashboard")).toBeDefined();
    expect(router.state.location.pathname).toBe("/finance");
  });

  it("sends an account that cannot resume the guest destination to its own dashboard", async () => {
    const router = createAppRouter(["/finance"]);
    render(<App router={router} />);
    await screen.findByRole("heading", { name: "فضای کار خود را انتخاب کنید" });
    finishLogin("حساب بیمار");
    expect(await screen.findByText("کیف پول بیمار")).toBeDefined();
    expect(router.state.location.pathname).toBe("/patient");
    expect(screen.queryByTestId("financial-dashboard")).toBeNull();
  });

  it.each([
    "https://example.com/finance",
    "//example.com",
    "/unknown",
    "/finance",
    "/patient?next=https://example.com",
  ])("ignores unapproved return destination %s", async (returnTo) => {
    const router = createAppRouter(["/login"]);
    render(<App router={router} />);
    await act(() => router.navigate("/login", { state: { returnTo } }));
    finishLogin();
    expect(await screen.findByText("کیف پول بیمار")).toBeDefined();
    expect(router.state.location.pathname).toBe("/patient");
  });

  it.each([
    ["PATIENT", "/doctor"],
    ["DOCTOR", "/patient"],
    ["SECRETARY_TEHRAN", "/secretary/isfahan"],
    ["SECRETARY_ISFAHAN", "/finance"],
  ] as [Role, string][])(
    "keeps account %s unchanged when URL %s is forbidden",
    async (role, destination) => {
      useAuthStore.getState().switchRole(role);
      const router = createAppRouter([destination]);
      render(<App router={router} />);
      expect(
        screen.getByRole("heading", { name: "به این صفحه دسترسی ندارید" }),
      ).toBeDefined();
      expect(screen.queryByText("کیف پول بیمار")).toBeNull();
      expect(screen.queryByTestId("financial-dashboard")).toBeNull();
      fireEvent.click(
        screen.getByRole("link", { name: "بازگشت به فضای کار من" }),
      );
      expect(
        await screen.findByRole("button", { name: "خروج از حساب" }),
      ).toBeDefined();
    },
  );
});
