import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within, waitFor } from '@testing-library/react';
import { renderApp, switchAccount } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useBookingStore } from '@/shared/stores/useBookingStore';

beforeEach(() => {
  memoryDb.resetToFactoryDefaults();
  useAuthStore.getState().logout();
  sessionStorage.clear();
  useBookingStore.getState().resetBooking();
});

afterEach(() => vi.restoreAllMocks());

it('carries a newly booked visit from guest login through insurance lock, authorized unlock and private clinical completion', async () => {
  // Randomness is an external boundary; avoid a tracking-code collision with seeded visits.
  vi.spyOn(Math, 'random').mockReturnValue(0.987654321);
  const { router } = renderApp('/');
  fireEvent.click(screen.getByRole('link', { name: 'ورود و رزرو نوبت' }));
  fireEvent.click(await screen.findByRole('button', { name: 'حساب بیمار' }));
  fireEvent.click(screen.getByRole('button', { name: 'استفاده از مشخصات آزمایشی' }));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'دریافت کد نمایشی' }));
  fireEvent.change(screen.getByLabelText('کد تأیید'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'تأیید و ورود' }));
  fireEvent.click(await screen.findByRole('link', { name: 'رزرو نوبت جدید' }));
  fireEvent.click(screen.getByText('سامانه ویزیت آنلاین و تله‌مدیسین آژی'));
  fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: انتخاب پزشک/ }));
  fireEvent.click(screen.getAllByText('دکتر مریم احمدی')[0]);
  fireEvent.click(screen.getAllByRole('button', { name: /ساعت/ })[0]);
  fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: محاسبه بیمه/ }));
  expect(screen.getByText(/۵۸,۸۰۰ تومان/)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: /مرحله بعد: بررسی پیش‌فاکتور/ }));
  fireEvent.click(screen.getByRole('button', { name: /انتقال به درگاه پرداخت/ }));
  fireEvent.click(screen.getByRole('button', { name: /پرداخت موفق/ }));
  const tracking = screen.getByText(/^AGY-/).textContent!;
  fireEvent.click(screen.getByRole('button', { name: /مشاهده در نوبت‌های من/ }));
  expect(screen.queryByRole('dialog', { name: 'ترک کار ناتمام؟' })).toBeNull();
  expect(screen.getByRole('article', { name: `نوبت ${tracking}` })).toBeDefined();

  await switchAccount('SECRETARY_TEHRAN');
  let row = screen.getByRole('row', { name: new RegExp(tracking) });
  fireEvent.click(within(row).getByTitle('اصلاح سهم بیمه'));
  fireEvent.click(screen.getByRole('button', { name: /ابطال بیمه تکمیلی/ }));
  expect(screen.getByText(/۱۳۷,۲۰۰ تومان/)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: /ذخیره و اعمال اصلاحیه/ }));
  // Wait for the correction dialog's existing success delay before logout.
  await waitFor(() => expect(screen.queryByRole('dialog', { name: /اصلاح دستی/ })).toBeNull());
  await switchAccount('PATIENT');
  let card = screen.getByRole('article', { name: `نوبت ${tracking}` });
  expect((within(card).getByRole('button', { name: /ورود مسدود/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(within(card).getByRole('button', { name: /پرداخت مابه‌التفاوت/ })).toBeDefined();

  await switchAccount('SECRETARY_TEHRAN');
  row = screen.getByRole('row', { name: new RegExp(tracking) });
  fireEvent.click(within(row).getByRole('button', { name: /بازگشایی اضطراری/ }));
  fireEvent.click(screen.getByRole('button', { name: /تایید و بازگشایی اضطراری/ }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  await switchAccount('PATIENT');
  card = screen.getByRole('article', { name: `نوبت ${tracking}` });
  fireEvent.click(within(card).getByRole('button', { name: /ورود به اتاق ویزیت/ }));
  expect(screen.getByTestId('patient-consultation-room')).toBeDefined();
  expect(router.state.location.pathname).toMatch(/^\/patient\/consultations\//);
  // The appointment ID comes from the actual authorized room URL, not a store lookup.
  const visitId = router.state.location.pathname.split('/').at(-1)!;
  await switchAccount('DOCTOR');
  fireEvent.change(screen.getByRole('textbox', { name: 'جستجوی نوبت‌های پزشک' }), { target: { value: tracking } });
  expect(screen.getByText(tracking)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: /شروع ویزیت تصویری/ }));
  expect(router.state.location.pathname).toBe(`/doctor/consultations/${visitId}`);
  fireEvent.click(screen.getByRole('button', { name: 'درج نمونه یادداشت' }));
  fireEvent.click(screen.getByRole('button', { name: 'ثبت نهایی و خاتمه ویزیت' }));
  fireEvent.click(screen.getByRole('button', { name: 'بازگشت به کارتابل نوبت‌ها' }));
  await switchAccount('PATIENT');
  card = screen.getByRole('article', { name: `نوبت ${tracking}` });
  expect(within(card).getByText('کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی')).toBeDefined();
  expect(within(card).getByText('مراجعه مجدد ۲ هفته دیگر')).toBeDefined();
  for (const privateField of ['سردرد مزمن و احساس خستگی', 'فشار خون 13 روی 8', 'میگرن ناشی از استرس']) expect(screen.queryByText(privateField)).toBeNull();
  await switchAccount('SECRETARY_TEHRAN');
  fireEvent.click(screen.getByRole('button', { name: tracking }));
  expect(screen.getByText('مراجعه مجدد ۲ هفته دیگر')).toBeDefined();
  for (const privateField of ['کپسول مسکن روزی ۱ عدد، پرهیز از بی‌خوابی', 'سردرد مزمن و احساس خستگی', 'فشار خون 13 روی 8', 'میگرن ناشی از استرس']) expect(screen.queryByText(privateField)).toBeNull();
});

it('gives the doctor Persian status text for every existing appointment state', () => {
  useAuthStore.getState().switchRole('DOCTOR');
  const sample = memoryDb.getAll('appointments')[0];
  for (const appointment of [...memoryDb.getAll('appointments')]) memoryDb.delete('appointments', appointment.id);
  const statuses = [
    ['PENDING_PAYMENT', 'در انتظار پرداخت'],
    ['CANCELLED_BY_PATIENT', 'لغوشده توسط بیمار'],
    ['CANCELLED_BY_CLINIC', 'لغوشده توسط کلینیک'],
    ['IN_CONSULTATION', 'در حال ویزیت'],
  ] as const;
  statuses.forEach(([status], index) => memoryDb.insert('appointments', { ...sample, id: `status-${index}`, trackingCode: `STATUS-${index}`, status }));
  renderApp('/doctor');
  for (const [status, label] of statuses) {
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.queryByText(status)).toBeNull();
  }
});

it('propagates applied tariffs to a subsequent patient booking without changing accounts from inside the workspace', async () => {
  useAuthStore.getState().switchRole('ADMIN_FINANCE');
  renderApp('/finance/tariffs');
  fireEvent.click(screen.getByRole('button', { name: /بارگذاری داده نمونه ماک ۲ شیتی/ }));
  await screen.findByText('SRV-CLI-01');
  fireEvent.click(screen.getByRole('button', { name: /تأیید و اعمال نهایی/ }));
  await screen.findByText(/تعرفه‌های جدید با موفقیت اعمال شدند/);
  await switchAccount('PATIENT');
  fireEvent.click(screen.getByRole('link', { name: 'رزرو نوبت جدید' }));
  fireEvent.click(screen.getByRole('button', { name: /شعبه مرکزی تهران/ }));
  const service = screen.getByRole('button', { name: /SRV-CLI-01/ });
  expect(service.textContent).toContain('۴۲۰,۰۰۰ تومان');
  expect(screen.getByRole('button', { name: 'حساب کاربری علی رضایی' })).toBeDefined();
});

it('carries saved tax, a new shift and a doctor leave decision across financial, doctor and secretary destinations', async () => {
  const sample = memoryDb.getAll('appointments')[0];
  for (const appointment of [...memoryDb.getAll('appointments')]) memoryDb.delete('appointments', appointment.id);
  memoryDb.update('doctors', 'doc-1', { sharePercentage: 0.6 });
  memoryDb.update('services', sample.serviceId, { consumableCost: 100000 });
  memoryDb.insert('appointments', { ...sample, freePrice: 1000000 });
  useAuthStore.getState().switchRole('ADMIN_FINANCE');
  renderApp('/finance/settings');
  fireEvent.change(screen.getByLabelText(/درصد پیش‌فرض کسورات مالیاتی/), { target: { value: '15' } });
  fireEvent.click(screen.getByRole('button', { name: 'ذخیره تنظیمات' }));
  await screen.findByRole('status');
  fireEvent.click(screen.getByRole('link', { name: 'نمای کلی و امور مالی' }));
  const financeRow = within(screen.getByRole('region', { name: 'جدول سهم پزشکان' })).getByRole('row', { name: /دکتر مریم احمدی/ });
  expect(within(financeRow).getByText('۸۱,۰۰۰ تومان')).toBeDefined();
  expect(within(financeRow).getByText('۴۵۹,۰۰۰ تومان')).toBeDefined();
  fireEvent.click(screen.getByRole('link', { name: /شیفت/  }));
  fireEvent.click(screen.getByRole('button', { name: 'تعریف شیفت کاری جدید' }));
  fireEvent.change(screen.getByLabelText('روز هفته:'), { target: { value: '6' } });
  fireEvent.change(screen.getByLabelText('ساعت شروع:'), { target: { value: '09:00' } });
  fireEvent.change(screen.getByLabelText('ساعت پایان:'), { target: { value: '13:00' } });
  fireEvent.click(screen.getByRole('button', { name: 'ثبت شیفت در تقویم' }));
  expect(screen.queryByRole('dialog')).toBeNull();

  await switchAccount('DOCTOR');
  const summary = screen.getByRole('region', { name: 'خلاصه مالی پزشک' });
  expect(within(summary).getByText('۸۱,۰۰۰ تومان')).toBeDefined();
  expect(within(summary).getByText('۴۵۹,۰۰۰ تومان')).toBeDefined();
  fireEvent.click(screen.getByRole('link', { name: 'شیفت‌ها و مرخصی' }));
  const fridayShift = screen.getByRole('article', { name: 'شیفت جمعه' });
  expect(within(fridayShift).getByText('۰۹:۰۰')).toBeDefined();
  expect(within(fridayShift).getByText('۱۳:۰۰')).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'ثبت درخواست مرخصی / تغییر شیفت' }));
  fireEvent.change(screen.getByLabelText('از تاریخ (شروع):'), { target: { value: '2027-01-10' } });
  fireEvent.change(screen.getByLabelText('تا تاریخ (پایان):'), { target: { value: '2027-01-11' } });
  fireEvent.change(screen.getByLabelText('علت مرخصی / توضیحات:'), { target: { value: 'همایش نمونه یکپارچه' } });
  fireEvent.click(screen.getByRole('button', { name: 'ارسال درخواست به منشی' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(within(screen.getByRole('article', { name: 'درخواست مرخصی از 2027-01-10 تا 2027-01-11' })).getByText('در انتظار تأیید منشی')).toBeDefined();
  await switchAccount('SECRETARY_TEHRAN');
  fireEvent.click(screen.getByRole('link', { name: 'درخواست‌های مرخصی' }));
  const request = screen.getAllByRole('article').find(article => within(article).queryByText(/همایش نمونه یکپارچه/))!;
  fireEvent.click(within(request).getByRole('button', { name: 'تأیید مرخصی' }));
  expect(within(request).getByText('تأییدشده')).toBeDefined();
  await switchAccount('DOCTOR');
  fireEvent.click(screen.getByRole('link', { name: 'شیفت‌ها و مرخصی' }));
  expect(screen.getByText(/همایش نمونه یکپارچه/)).toBeDefined();
  expect(within(screen.getByRole('article', { name: 'درخواست مرخصی از 2027-01-10 تا 2027-01-11' })).getByText('تأییدشده')).toBeDefined();
});


it('closes the doctor leave dialog when browser Back changes the workspace destination', async () => {
  useAuthStore.getState().switchRole('DOCTOR');
  const { router } = renderApp('/doctor');
  fireEvent.click(screen.getByRole('link', { name: 'شیفت‌ها و مرخصی' }));
  fireEvent.click(screen.getByRole('button', { name: 'ثبت درخواست مرخصی / تغییر شیفت' }));
  expect(screen.getByRole('dialog', { name: 'ثبت درخواست مرخصی / تغییر شیفت' })).toBeDefined();
  await act(() => router.navigate(-1));
  expect(router.state.location.pathname).toBe('/doctor');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('heading', { name: 'کارتابل پزشک' })).toBeDefined();
});

it('keeps the doctor draft on cancelled logout and clears it across a confirmed logout and patient login', async () => {
  useAuthStore.getState().switchRole('DOCTOR');
  const { router } = renderApp('/doctor/consultations/app-1');
  fireEvent.change(screen.getByLabelText(/شکایت اصلی بیمار/), { target: { value: 'PRIVATE unsaved cross-account draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'خروج از حساب' }));
  fireEvent.click(await screen.findByRole('button', { name: 'ماندن و ادامه' }));
  expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('PRIVATE unsaved cross-account draft');
  expect(screen.getByRole('button', { name: 'حساب کاربری دکتر مریم احمدی' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'خروج از حساب' }));
  fireEvent.click(await screen.findByRole('button', { name: 'خروج و کنارگذاشتن تغییرات' }));
  await screen.findByRole('link', { name: 'ورود و رزرو نوبت' });
  expect(router.state.location.pathname).toBe('/');
  fireEvent.click(screen.getByRole('link', { name: 'ورود و رزرو نوبت' }));
  fireEvent.click(await screen.findByRole('button', { name: 'حساب بیمار' }));
  fireEvent.click(screen.getByRole('button', { name: 'استفاده از مشخصات آزمایشی' }));
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'دریافت کد نمایشی' }));
  fireEvent.change(screen.getByLabelText('کد تأیید'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'تأیید و ورود' }));
  await screen.findByRole('article', { name: 'نوبت AGY-10142' });
  expect(screen.queryByText('PRIVATE unsaved cross-account draft')).toBeNull();
  await switchAccount('DOCTOR');
  await act(() => router.navigate('/doctor/consultations/app-1'));
  expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'خروج از اتاق ویزیت' }));
  expect(screen.queryByRole('dialog', { name: 'ترک کار ناتمام؟' })).toBeNull();
});
