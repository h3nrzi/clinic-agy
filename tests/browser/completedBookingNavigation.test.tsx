import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';
import { useScenarioStore } from '@/shared/stores/useScenarioStore';

const confirmationHeading = 'پرداخت با موفقیت انجام شد و نوبت شما ثبت گردید';

async function completeBookingThroughUi() {
  fireEvent.click(screen.getByRole('link', { name: 'رزرو نوبت جدید' }));
  await screen.findByRole('navigation', { name: 'مراحل رزرو نوبت' });
  fireEvent.click(screen.getByText('سامانه ویزیت آنلاین و تله‌مدیسین آژی'));
  fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک و تقویم/ }));
  fireEvent.click(screen.getAllByText('دکتر مریم احمدی')[0]);
  fireEvent.click(screen.getAllByRole('button', { name: /ساعت/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه و مدارک/ }));
  fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ }));
  fireEvent.click(screen.getByRole('button', { name: /انتقال به درگاه پرداخت شاپرک/ }));
  fireEvent.click(screen.getByRole('button', { name: /پرداخت موفق \(تایید قطعی نوبت\)/ }));

  expect(await screen.findByRole('heading', { name: confirmationHeading })).toBeDefined();
  const trackingCode = screen.getByText(/^AGY-\d+$/).textContent ?? '';
  expect(trackingCode).toMatch(/^AGY-\d+$/);
  return trackingCode;
}

// Approved seam: complete App; booking, navigation and identity changes use public controls.
describe('completed booking navigation', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    sessionStorage.clear();
    useAuthStore.getState().switchRole('PATIENT');
    useScenarioStore.getState().injectScenario('NORMAL');
    useBookingStore.getState().resetBooking();
  });

  it('starts a fresh wizard when the patient leaves confirmation and returns through sidebar links', async () => {
    renderApp();
    const trackingCode = await completeBookingThroughUi();

    fireEvent.click(screen.getByRole('link', { name: 'نوبت‌ها و پرونده من' }));
    expect(await screen.findByText('کیف پول بیمار')).toBeDefined();
    expect(screen.getByText(trackingCode)).toBeDefined();
    fireEvent.click(screen.getByRole('link', { name: 'رزرو نوبت جدید' }));

    expect(await screen.findByRole('navigation', { name: 'مراحل رزرو نوبت' })).toBeDefined();
    expect(screen.getByText('۱. انتخاب شعبه یا نوع ویزیت')).toBeDefined();
    expect(screen.queryByRole('heading', { name: confirmationHeading })).toBeNull();
    expect(screen.queryByText(trackingCode)).toBeNull();
  });

  it('clears the previous patient confirmation when floating demo tools change patient identity', async () => {
    renderApp();
    const trackingCode = await completeBookingThroughUi();

    fireEvent.click(screen.getByRole('button', { name: 'ابزارهای ارزیابی دمو' }));
    fireEvent.click(screen.getByRole('button', { name: /تزریق بیمار بدهکار/ }));

    expect(await screen.findByRole('button', { name: /حساب کاربری مهدی سعیدی/ })).toBeDefined();
    expect(screen.queryByRole('heading', { name: confirmationHeading })).toBeNull();
    expect(screen.queryByText(trackingCode)).toBeNull();
    expect(screen.getByRole('navigation', { name: 'مراحل رزرو نوبت' })).toBeDefined();
  });
});
