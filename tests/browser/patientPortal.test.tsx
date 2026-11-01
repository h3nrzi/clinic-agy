import { beforeEach, describe, expect, it } from "vitest";
import { screen, within, fireEvent } from "@testing-library/react";
import { renderApp } from "../helpers/appFixture";
import { memoryDb } from "@/mocks/db/memoryDb";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useScenarioStore } from "@/shared/stores/useScenarioStore";

describe("Patient portal through App and Router", () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole("PATIENT");
    useScenarioStore.getState().injectScenario("NORMAL");
  });

  it("puts the nearest confirmed future visit before wallet and labels each appointment", () => {
    renderApp("/patient");
    const next = screen.getByRole("region", { name: "نوبت بعدی شما" });
    expect(within(next).getByText("دکتر رضا حسینی")).toBeDefined();
    const wallet = screen.getByRole("region", { name: "کیف پول بیمار" });
    expect(
      next.compareDocumentPosition(wallet) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const card = screen.getByRole("article", { name: "نوبت AGY-10188" });
    expect(within(card).getByText("کد رهگیری")).toBeDefined();
    expect(within(card).getByText("وضعیت نوبت")).toBeDefined();
    expect(within(card).getByText("قطعی‌شده")).toBeDefined();
    expect(
      within(card).getByRole("button", { name: "لغو نوبت" }),
    ).toBeDefined();
  });
  it("makes cancellation modal exclusive and restores the initiating button on Escape", () => {
    renderApp("/patient");
    const card = screen.getByRole("article", { name: "نوبت AGY-10188" });
    const cancel = within(card).getByRole("button", { name: "لغو نوبت" });
    cancel.focus();
    fireEvent.click(cancel);
    const dialog = screen.getByRole("dialog", {
      name: /لغو نوبت و استرداد وجه/,
    });
    expect(dialog.contains(document.activeElement)).toBe(true);
    const close = within(dialog).getByRole("button", { name: "بستن" });
    const back = within(dialog).getByRole("button", { name: "انصراف" });
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(back);
    fireEvent.keyDown(back, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    expect(screen.queryByRole("button", { name: "خروج از حساب" })).toBeNull();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(cancel);
    expect(screen.getByRole("button", { name: "خروج از حساب" })).toBeDefined();
  });
  it("excludes cancelled, completed and past appointments from the next visit summary", () => {
    memoryDb.update("appointments", "app-future-urgent", {
      status: "CANCELLED_BY_PATIENT",
    });
    renderApp("/patient");
    const next = screen.getByRole("region", { name: "نوبت بعدی شما" });
    expect(within(next).getByText("دکتر مریم احمدی")).toBeDefined();
    expect(within(next).queryByText("دکتر رضا حسینی")).toBeNull();
  });

  it('opens the selected prescription, traps focus and restores its opener on dismissal', () => {
    renderApp('/patient');
    const card = screen.getByRole('article', { name: 'نوبت AGY-10099' });
    const opener = within(card).getByRole('button', { name: 'مشاهده نسخه و توصیه‌ها' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'نسخه و توصیه‌های پزشک' });
    expect(within(dialog).getByText('AGY-10099')).toBeDefined();
    const close = within(dialog).getByRole('button', { name: 'بستن نسخه' });
    const done = within(dialog).getByRole('button', { name: 'بستن' });
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.queryByRole('button', { name: 'خروج از حساب' })).toBeNull();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(done);
    fireEvent.keyDown(done, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole('button', { name: 'بستن' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it("shows only prescription and follow-up even with long clinical content", () => {
    const app = memoryDb.getById("appointments", "app-4")!;
    const prescriptions = "نسخه آزمایشی بسیار طولانی ".repeat(40);
    memoryDb.update("appointments", "app-future-urgent", {
      doctorName: "پزشک".repeat(70),
      serviceName: "خدمت".repeat(70),
    });
    memoryDb.update("appointments", app.id, {
      clinicalNote: {
        ...app.clinicalNote!,
        prescriptions,
        mainComplaint: "PRIVATE_COMPLAINT",
        findings: "PRIVATE_FINDINGS",
        diagnosis: "PRIVATE_DIAGNOSIS",
      },
    });
    renderApp("/patient");
    const card = screen.getByRole("article", { name: "نوبت AGY-10099" });
    const next = screen.getByRole("region", { name: "نوبت بعدی شما" });
    expect(within(next).getByText("پزشک".repeat(70))).toBeDefined();
    expect(screen.queryByText(prescriptions.trim())).toBeNull();
    fireEvent.click(within(card).getByRole('button', { name: 'مشاهده نسخه و توصیه‌ها' }));
    const note = screen.getByRole("dialog", { name: "نسخه و توصیه‌های پزشک" });
    expect(within(note).getByText(prescriptions.trim())).toBeDefined();
    expect(within(note).getByText(app.clinicalNote!.followUp)).toBeDefined();
    for (const privateText of [
      "PRIVATE_COMPLAINT",
      "PRIVATE_FINDINGS",
      "PRIVATE_DIAGNOSIS",
    ]) {
      expect(screen.queryByText(privateText)).toBeNull();
    }
    fireEvent.click(within(note).getByRole('button', { name: 'بستن نسخه' }));
    expect(
      screen.queryByRole("article", { name: "نوبت AGY-10143" }),
    ).toBeNull();
  });

  it("explains debt, blocks room entry and refreshes the balance after settlement", () => {
    useScenarioStore.getState().injectScenario("INDEBTED_PATIENT");
    renderApp("/patient");
    const wallet = screen.getByRole("region", { name: "کیف پول بیمار" });
    expect(within(wallet).getByText("مانده بدهی")).toBeDefined();
    expect(within(wallet).getByText("-۱۲۰,۰۰۰ تومان (بدهکار)")).toBeDefined();
    const blocked = screen.getByRole("button", {
      name: "ورود مسدود (قفل بدهی)",
    });
    expect(blocked.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/قفل نرم فعال است: به دلیل/)).toBeDefined();
    fireEvent.click(
      screen.getByRole("button", { name: "پرداخت مابه‌التفاوت و رفع قفل" }),
    );
    expect(within(wallet).getByText("حساب تسویه است")).toBeDefined();
    expect(within(wallet).getByText("۰ تومان")).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "ورود به اتاق ویزیت" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("offers booking when there are no patient appointments", () => {
    for (const app of [...memoryDb.getAll("appointments")]) {
      if (app.patientId === "pat-1") memoryDb.delete("appointments", app.id);
    }
    const { router } = renderApp("/patient");
    expect(screen.getByText("نوبت پیش رو ندارید")).toBeDefined();
    expect(screen.getByText("هنوز نوبتی ثبت نکرده‌اید")).toBeDefined();
    expect(screen.queryByRole("article")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "شروع رزرو نوبت آنلاین" }),
    );
    expect(router.state.location.pathname).toBe("/patient/booking");
  });
  it("retains readable emergency unlock reason and permits the existing room entry", () => {
    useScenarioStore.getState().injectScenario("INDEBTED_PATIENT");
    memoryDb.update("appointments", "app-2", {
      isSoftLocked: false,
      emergencyUnlocked: true,
      emergencyUnlockReason: "بازگشایی آزمایشی با تأیید پذیرش ".repeat(20),
    });
    renderApp("/patient");
    expect(
      screen.getByText(/بازگشایی اضطراری توسط منشی انجام شد:/),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "ورود مسدود (قفل بدهی)" }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "ورود به اتاق ویزیت" }));
    expect(
      screen.getByRole("heading", { name: "اتاق ویزیت و مشاوره آنلاین" }),
    ).toBeDefined();
    expect(screen.getByText("AGY-10143")).toBeDefined();
    expect(
      screen.queryByRole("article", { name: "نوبت AGY-10142" }),
    ).toBeNull();
  });
});
