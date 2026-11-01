import { beforeEach, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderApp } from "../helpers/appFixture";
import { memoryDb } from "@/mocks/db/memoryDb";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useBookingStore } from "@/shared/stores/useBookingStore";

beforeEach(() => {
  memoryDb.resetToFactoryDefaults();
  useAuthStore.getState().switchRole("PATIENT");
  useBookingStore.getState().resetBooking();
});
function selectSlot() {
  fireEvent.click(
    screen.getByRole("button", { name: /مرحله بعد: انتخاب پزشک/ }),
  );
  fireEvent.click(screen.getAllByRole("button", { name: /ساعت/ })[1]);
}
it("keeps changed booking and URL on stay, then discards after confirmed route exit", async () => {
  const { router } = renderApp("/patient/booking");
  expect(screen.queryByRole("button", { name: "انصراف از رزرو" })).toBeNull();
  selectSlot();
  const slot = screen
    .getByRole("button", { pressed: true, name: /ساعت/ })
    .getAttribute("aria-label");
  fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
  expect(
    await screen.findByRole("dialog", { name: "ترک کار ناتمام؟" }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "ماندن و ادامه" }));
  expect(router.state.location.pathname).toBe("/patient/booking");
  expect(
    screen
      .getByRole("button", { pressed: true, name: /ساعت/ })
      .getAttribute("aria-label"),
  ).toBe(slot);
  fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "خروج و کنارگذاشتن تغییرات" }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe("/patient"));
  fireEvent.click(screen.getByRole("link", { name: "رزرو نوبت جدید" }));
  expect(screen.getByText("۱. انتخاب شعبه یا نوع ویزیت")).toBeDefined();
});
it("protects browser Back and logout before changing the session", async () => {
  const { router } = renderApp("/patient");
  fireEvent.click(screen.getByRole("link", { name: "رزرو نوبت جدید" }));
  selectSlot();
  await act(async () => {
    await router.navigate(-1);
  });
  fireEvent.click(await screen.findByRole("button", { name: "ماندن و ادامه" }));
  expect(router.state.location.pathname).toBe("/patient/booking");
  fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }));
  fireEvent.click(await screen.findByRole("button", { name: "ماندن و ادامه" }));
  expect(
    screen.getByRole("button", { name: "حساب کاربری علی رضایی" }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "خروج از حساب" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "خروج و کنارگذاشتن تغییرات" }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  expect(screen.queryByRole("button", { name: "خروج از حساب" })).toBeNull();
});
it("changes scenario identity only after consent and preserves the slot on stay", async () => {
  const { router } = renderApp("/patient/booking");
  selectSlot();
  fireEvent.click(screen.getByRole("button", { name: "ابزارهای ارزیابی دمو" }));
  fireEvent.click(screen.getByRole("button", { name: /تزریق بیمار بدهکار/ }));
  fireEvent.click(await screen.findByRole("button", { name: "ماندن و ادامه" }));
  expect(
    screen.getByRole("button", { name: "حساب کاربری علی رضایی" }),
  ).toBeDefined();
  expect(
    screen.getByRole("button", { pressed: true, name: /ساعت/ }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "ابزارهای ارزیابی دمو" }));
  fireEvent.click(screen.getByRole("button", { name: /تزریق بیمار بدهکار/ }));
  fireEvent.click(
    await screen.findByRole("button", { name: "خروج و کنارگذاشتن تغییرات" }),
  );
  expect(
    screen.getByRole("button", { name: /حساب کاربری مهدی سعیدی/ }),
  ).toBeDefined();
  expect(router.state.location.pathname).toBe("/patient/booking");
  expect(screen.getByText("۱. انتخاب شعبه یا نوع ویزیت")).toBeDefined();
});
it("keeps the existing factory reset confirmation and guards accepted reset before discard", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const { router } = renderApp("/patient/booking");
  selectSlot();
  fireEvent.click(screen.getByRole("button", { name: "ابزارهای ارزیابی دمو" }));
  fireEvent.click(screen.getByRole("button", { name: /ریست کارخانه‌ای/ }));
  expect(screen.queryByRole("dialog", { name: "ترک کار ناتمام؟" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "بستن ابزارهای دمو" }));
  expect(
    screen.getByRole("button", { pressed: true, name: /ساعت/ }),
  ).toBeDefined();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "ابزارهای ارزیابی دمو" }));
  fireEvent.click(screen.getByRole("button", { name: /ریست کارخانه‌ای/ }));
  fireEvent.click(await screen.findByRole("button", { name: "ماندن و ادامه" }));
  expect(
    screen.getByRole("button", { pressed: true, name: /ساعت/ }),
  ).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "ابزارهای ارزیابی دمو" }));
  fireEvent.click(screen.getByRole("button", { name: /ریست کارخانه‌ای/ }));
  fireEvent.click(
    await screen.findByRole("button", { name: "خروج و کنارگذاشتن تغییرات" }),
  );
  expect(router.state.location.pathname).toBe("/patient/booking");
  expect(screen.getByText("۱. انتخاب شعبه یا نوع ویزیت")).toBeDefined();
  expect(
    screen.getByRole("button", { name: "حساب کاربری علی رضایی" }),
  ).toBeDefined();
  confirm.mockRestore();
});
it("ignores default preselection and local steps, then wires beforeunload only for actual changes", () => {
  renderApp("/patient/booking");
  const clean = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);
  fireEvent.click(
    screen.getByRole("button", { name: /مرحله بعد: انتخاب پزشک/ }),
  );
  const defaultSlot = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(defaultSlot);
  expect(defaultSlot.defaultPrevented).toBe(false);
  fireEvent.click(screen.getAllByRole("button", { name: /ساعت/ })[1]);
  const dirty = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
  fireEvent.click(
    screen.getByRole("button", { name: /مرحله بعد: محاسبه بیمه/ }),
  );
  expect(screen.queryByRole("dialog", { name: "ترک کار ناتمام؟" })).toBeNull();
  expect(screen.getByLabelText("بیمه پایه (درمانی اول)")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /مرحله بعد: بررسی پیش/ }));
  fireEvent.click(screen.getByRole("button", { name: /انتقال به درگاه/ }));
  expect(screen.getByLabelText("شماره کارت بانکی ۱۶ رقمی")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: /پرداخت موفق/ }));
  const saved = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(saved);
  expect(saved.defaultPrevented).toBe(false);
  fireEvent.click(
    screen.getByRole("button", { name: /رزرو نوبت آنلاین دیگر/ }),
  );
  fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
  expect(screen.queryByRole("dialog", { name: "ترک کار ناتمام؟" })).toBeNull();
});
it("clears a completed confirmation on explicit factory reset without a false draft warning", () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  renderApp("/patient/booking");
  selectSlot();
  fireEvent.click(
    screen.getByRole("button", { name: /مرحله بعد: محاسبه بیمه/ }),
  );
  fireEvent.click(screen.getByRole("button", { name: /مرحله بعد: بررسی پیش/ }));
  fireEvent.click(screen.getByRole("button", { name: /انتقال به درگاه/ }));
  fireEvent.click(screen.getByRole("button", { name: /پرداخت موفق/ }));
  fireEvent.click(screen.getByRole("button", { name: "ابزارهای ارزیابی دمو" }));
  fireEvent.click(screen.getByRole("button", { name: /ریست کارخانه‌ای/ }));
  expect(screen.queryByRole("dialog", { name: "ترک کار ناتمام؟" })).toBeNull();
  expect(screen.getByText("۱. انتخاب شعبه یا نوع ویزیت")).toBeDefined();
  confirm.mockRestore();
});
it("does not carry a delayed file read into a new booking after abandoning the old one", async () => {
  let finishRead: (() => void) | undefined;
  class DelayedFileReader {
    result = "data:image/png;base64,eA==";
    onload: (() => void) | null = null;
    readAsDataURL() {
      finishRead = () => this.onload?.();
    }
  }
  vi.stubGlobal("FileReader", DelayedFileReader);
  try {
    renderApp("/patient/booking");
    selectSlot();
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: محاسبه بیمه/ }),
    );
    fireEvent.change(screen.getByLabelText(/انتخاب مدرک پزشکی/), {
      target: {
        files: [
          new File(["x"], "abandoned-private.png", { type: "image/png" }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "خروج و کنارگذاشتن تغییرات" }),
    );
    fireEvent.click(screen.getByRole("link", { name: "رزرو نوبت جدید" }));
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: انتخاب پزشک/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: محاسبه بیمه/ }),
    );
    act(() => finishRead?.());
    expect(screen.queryByText("abandoned-private.png")).toBeNull();
  } finally {
    vi.unstubAllGlobals();
  }
});

it("keeps actual automatic time preselection clean when midnight passes before opening stage two", () => {
  vi.setSystemTime(new Date(2026, 10, 1, 23, 59));
  try {
    const { router } = renderApp("/patient/booking");
    vi.setSystemTime(new Date(2026, 10, 2, 0, 1));
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: انتخاب پزشک/ }),
    );
    expect(
      screen.getByRole("button", { pressed: true, name: /ساعت/ }),
    ).toBeDefined();
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
    fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
    expect(router.state.location.pathname).toBe("/patient");
    expect(
      screen.queryByRole("dialog", { name: "ترک کار ناتمام؟" }),
    ).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

it("protects a valid file still being read even when every other value is preselected", async () => {
  let finishRead: (() => void) | undefined;
  class DelayedFileReader {
    result = "data:image/png;base64,eA==";
    onload: (() => void) | null = null;
    readAsDataURL() {
      finishRead = () => this.onload?.();
    }
  }
  vi.stubGlobal("FileReader", DelayedFileReader);
  try {
    renderApp("/patient/booking");
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: انتخاب پزشک/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: محاسبه بیمه/ }),
    );
    fireEvent.change(screen.getByLabelText(/انتخاب مدرک پزشکی/), {
      target: {
        files: [new File(["x"], "pending-private.png", { type: "image/png" })],
      },
    });
    fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "ماندن و ادامه" }),
    );
    const pending = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(pending);
    expect(pending.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "خروج و کنارگذاشتن تغییرات" }),
    );
    fireEvent.click(screen.getByRole("link", { name: "رزرو نوبت جدید" }));
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: انتخاب پزشک/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /مرحله بعد: محاسبه بیمه/ }),
    );
    act(() => finishRead?.());
    expect(screen.queryByText("pending-private.png")).toBeNull();
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
  } finally {
    vi.unstubAllGlobals();
  }
});
