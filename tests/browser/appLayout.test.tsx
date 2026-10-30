import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';

describe('WP-00: App Component & Role Switcher UI Verification', () => {
  beforeEach(() => {
    // Reset database and stores before each run
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
  });

  it('renders application brand, demo toolbar and patient workspace by default', () => {
    render(<App />);

    // Brand check
    expect(screen.getByText('کلینیک سلامت آژی')).toBeDefined();

    // Demo toolbar pills
    expect(screen.getByRole('button', { name: 'بیمار' })).toBeDefined();
    expect(screen.getByRole('button', { name: /منشی تهران/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /منشی اصفهان/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /پزشک/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /مدیر مالی/ })).toBeDefined();

    // Patient wallet card
    expect(screen.getByText('کیف پول بیمار')).toBeDefined();
    // Default patient name
    expect(screen.getAllByText('علی رضایی').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to Secretary Tehran workspace when clicking "منشی تهران"', () => {
    render(<App />);

    const secTehranBtn = screen.getByRole('button', { name: /منشی تهران/ });
    fireEvent.click(secTehranBtn);

    // Secretary header should be rendered
    expect(screen.getByText(/میز کار پذیرش شعبه مرکزی تهران/)).toBeDefined();
    // Table headers
    expect(screen.getByText('کد رهگیری')).toBeDefined();
    expect(screen.getByText('نام بیمار')).toBeDefined();
  });

  it('switches to Admin Finance workspace and displays system KPIs', () => {
    render(<App />);

    const adminBtn = screen.getByRole('button', { name: /مدیر مالی/ });
    fireEvent.click(adminBtn);

    expect(screen.getByTestId('financial-dashboard')).toBeDefined();
    expect(screen.getByText(/مدیریت مالی و عملکرد کلینیک/)).toBeDefined();
    expect(screen.getByText('کل درآمد ناخالص خدمات')).toBeDefined();
    expect(screen.getByText('مجموع سهم ناخالص پزشکان')).toBeDefined();
  });

  it('toggles indebted patient scenario and enforces soft-lock in UI', () => {
    render(<App />);

    // Click scenario button
    const scenarioBtn = screen.getByRole('button', { name: /تزریق بیمار بدهکار/ });
    fireEvent.click(scenarioBtn);

    // Notification banner
    expect(screen.getByText(/سناریوی بیمار بدهکار فعال شد/)).toBeDefined();

    // Indebted patient name
    expect(screen.getAllByText(/مهدی سعیدی/).length).toBeGreaterThanOrEqual(1);

    // Soft-lock message
    expect(screen.getByText(/قفل نرم فعال است/)).toBeDefined();

    // Disabled visit button
    const visitBtn = screen.getByRole('button', { name: /ورود مسدود \(قفل بدهی\)/ });
    expect(visitBtn).toBeDefined();
    expect((visitBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('executes factory reset and clears scenario banner', () => {
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<App />);

    // Inject scenario first
    const scenarioBtn = screen.getByRole('button', { name: /تزریق بیمار بدهکار/ });
    fireEvent.click(scenarioBtn);
    expect(screen.getByText(/سناریوی بیمار بدهکار فعال شد/)).toBeDefined();

    // Click Factory Reset
    const resetBtn = screen.getByRole('button', { name: /ریست کارخانه‌ای داده‌ها/ });
    fireEvent.click(resetBtn);

    // Banner should confirm factory reset
    expect(screen.getByText(/تمامی داده‌های دیتابیس به مقادیر اولیه کارخانه‌ای/)).toBeDefined();
  });
});
