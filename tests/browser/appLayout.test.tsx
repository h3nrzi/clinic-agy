import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderApp, switchAccount } from "../helpers/appFixture";
import { memoryDb } from "@/mocks/db/memoryDb";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useScenarioStore } from "@/shared/stores/useScenarioStore";

describe("WP-00: App Component & Role Switcher UI Verification", () => {
  beforeEach(() => {
    // Reset database and stores before each run
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole("PATIENT");
    useScenarioStore.getState().injectScenario("NORMAL");
  });

  it("renders application brand, scenario tools and the explicitly selected patient account", () => {
    renderApp();

    // Brand check
    expect(screen.getByText("کلینیک سلامت آژی")).toBeDefined();

    // Role selection belongs to login; workspace retains only scenario tools.
    expect(screen.getByLabelText("ابزارهای ارزیابی دمو")).toBeDefined();
    expect(screen.getByRole("button", { name: "خروج از حساب" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "حساب پزشک" })).toBeNull();

    // Patient wallet card
    expect(screen.getByText("کیف پول بیمار")).toBeDefined();
    // Default patient name
    expect(screen.getAllByText("علی رضایی").length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Secretary Tehran workspace after logging in as "منشی تهران"', async () => {
    renderApp();

    await switchAccount("SECRETARY_TEHRAN");

    // Secretary header should be rendered
    expect(screen.getByText(/میز کار پذیرش شعبه مرکزی تهران/)).toBeDefined();
    // Table headers
    expect(screen.getByText("کد رهگیری")).toBeDefined();
    expect(screen.getByText("نام بیمار")).toBeDefined();
  });

  it("switches to Admin Finance workspace and displays system KPIs", async () => {
    renderApp();

    await switchAccount("ADMIN_FINANCE");

    expect(screen.getByTestId("financial-dashboard")).toBeDefined();
    expect(screen.getByText(/مدیریت مالی و عملکرد کلینیک/)).toBeDefined();
    expect(screen.getByText("کل درآمد ناخالص خدمات")).toBeDefined();
    expect(screen.getByText("مجموع سهم ناخالص پزشکان")).toBeDefined();
  });

  it("toggles indebted patient scenario and enforces soft-lock in UI", () => {
    renderApp();

    // Click scenario button
    const scenarioBtn = screen.getByRole("button", {
      name: /تزریق بیمار بدهکار/,
    });
    fireEvent.click(scenarioBtn);

    // Notification banner
    expect(screen.getByText(/سناریوی بیمار بدهکار فعال شد/)).toBeDefined();

    // Indebted patient name
    expect(screen.getAllByText(/مهدی سعیدی/).length).toBeGreaterThanOrEqual(1);

    // Soft-lock message
    expect(screen.getByText(/قفل نرم فعال است/)).toBeDefined();

    // Disabled visit button
    const visitBtn = screen.getByRole("button", {
      name: /ورود مسدود \(قفل بدهی\)/,
    });
    expect(visitBtn).toBeDefined();
    expect((visitBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("executes factory reset and clears scenario banner", () => {
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockImplementation(() => true);

    renderApp();

    // Inject scenario first
    const scenarioBtn = screen.getByRole("button", {
      name: /تزریق بیمار بدهکار/,
    });
    fireEvent.click(scenarioBtn);
    expect(screen.getByText(/سناریوی بیمار بدهکار فعال شد/)).toBeDefined();

    // Click Factory Reset
    const resetBtn = screen.getByRole("button", {
      name: /ریست کارخانه‌ای داده‌ها/,
    });
    fireEvent.click(resetBtn);

    // Banner should confirm factory reset
    expect(
      screen.getByText(/تمامی داده‌های دیتابیس به مقادیر اولیه کارخانه‌ای/),
    ).toBeDefined();
  });
});
