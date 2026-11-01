import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, cleanup, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Role } from "@/shared/types";
import { renderApp } from "../helpers/appFixture";
import { memoryDb } from "@/mocks/db/memoryDb";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useBookingStore } from "@/shared/stores/useBookingStore";

// Approved seam: full App plus its real data router; assertions observe UI and URL.
describe("role workspace destinations", () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    sessionStorage.clear();
    useBookingStore.getState().resetBooking();
    useAuthStore.getState().switchRole("PATIENT");
  });

  it("opens booking directly and keeps patient links and history aligned", async () => {
    const { router } = renderApp("/patient/booking");
    expect(await screen.findByText("رزرو نوبت آنلاین و محاسبه هوشمند بیمه")).toBeDefined();
    expect(screen.getByRole("link", { name: "رزرو نوبت جدید" }).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByRole("link", { name: "نوبت‌ها و پرونده من" }));
    expect(await screen.findByText("کیف پول بیمار")).toBeDefined();
    expect(router.state.location.pathname).toBe("/patient");
    await act(async () => { await router.navigate(-1); });
    expect(await screen.findByText("رزرو نوبت آنلاین و محاسبه هوشمند بیمه")).toBeDefined();
    expect(router.state.location.pathname).toBe("/patient/booking");
    await act(async () => { await router.navigate(1); });
    expect(await screen.findByText("کیف پول بیمار")).toBeDefined();
  });
  it("retains the indebted patient identity when the same tab reloads", async () => {
    const { unmount, router } = renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'ابزارهای ارزیابی دمو' }));
    fireEvent.click(screen.getByRole('button', { name: /تزریق بیمار بدهکار/ }));
    expect(await screen.findByText(/قفل نرم فعال است/)).toBeDefined();
    unmount();
    router.dispose();
    cleanup();
    renderApp('/patient');
    expect(await screen.findByText(/قفل نرم فعال است/)).toBeDefined();
    expect(screen.getAllByText(/مهدی سعیدی/).length).toBeGreaterThan(0);
  });

});


const destinations: {role:Role; path:string; label:string; content:RegExp}[] = [
  {role:'PATIENT',path:'/patient',label:'نوبت‌ها و پرونده من',content:/کیف پول بیمار/},
  {role:'PATIENT',path:'/patient/booking',label:'رزرو نوبت جدید',content:/رزرو نوبت آنلاین و محاسبه هوشمند بیمه/},
  {role:'DOCTOR',path:'/doctor',label:'کارتابل نوبت‌ها',content:/کارتابل نوبت‌های پزشک/},
  {role:'DOCTOR',path:'/doctor/shifts',label:'شیفت‌ها و مرخصی',content:/برنامهٔ شیفت‌های ثابت هفتگی/},
  {role:'SECRETARY_TEHRAN',path:'/secretary/tehran',label:'میز پذیرش',content:/میز کار پذیرش شعبه مرکزی تهران/},
  {role:'SECRETARY_TEHRAN',path:'/secretary/tehran/leaves',label:'درخواست‌های مرخصی',content:/کارتابل بررسی و تایید مرخصی پزشکان/},
  {role:'SECRETARY_ISFAHAN',path:'/secretary/isfahan',label:'میز پذیرش',content:/میز کار پذیرش شعبه شمس‌آبادی اصفهان/},
  {role:'SECRETARY_ISFAHAN',path:'/secretary/isfahan/leaves',label:'درخواست‌های مرخصی',content:/کارتابل بررسی و تایید مرخصی پزشکان/},
  {role:'ADMIN_FINANCE',path:'/finance',label:'نمای کلی و امور مالی',content:/کل درآمد ناخالص خدمات/},
  {role:'ADMIN_FINANCE',path:'/finance/tariffs',label:'تعرفه‌ها و بیمه',content:/آپلود و تحلیل فایل اکسل تعرفه‌ها/},
  {role:'ADMIN_FINANCE',path:'/finance/shifts',label:'تقویم شیفت‌ها',content:/تعریف شیفت کاری جدید/},
  {role:'ADMIN_FINANCE',path:'/finance/settings',label:'تنظیمات مالی',content:/پارامترهای سیستمی مالیات و جریمه لغو نوبت/},
];
const roles: Role[] = ['PATIENT','DOCTOR','SECRETARY_TEHRAN','SECRETARY_ISFAHAN','ADMIN_FINANCE'];

describe('workspace route access matrix', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); sessionStorage.clear(); useBookingStore.getState().resetBooking(); });
  for (const destination of destinations) {
    it(`opens and refreshes ${destination.path} for its account`, async () => {
      useAuthStore.getState().switchRole(destination.role);
      const first = renderApp(destination.path);
      expect(await screen.findAllByText(destination.content)).toBeDefined();
      expect(screen.getByRole('link',{name:destination.label}).getAttribute('aria-current')).toBe('page');
      first.unmount(); first.router.dispose();
      const refreshed = renderApp(destination.path);
      expect(await screen.findAllByText(destination.content)).toBeDefined();
      expect(screen.getByRole('link',{name:destination.label}).getAttribute('aria-current')).toBe('page');
      const other = destinations.find(candidate => candidate.role === destination.role && candidate.path !== destination.path)!;
      fireEvent.click(screen.getByRole('link',{name:other.label}));
      await waitFor(() => expect(refreshed.router.state.location.pathname).toBe(other.path));
      await act(async () => { await refreshed.router.navigate(-1); });
      expect(screen.getByRole('link',{name:destination.label}).getAttribute('aria-current')).toBe('page');
      await act(async () => { await refreshed.router.navigate(1); });
      expect(screen.getByRole('link',{name:other.label}).getAttribute('aria-current')).toBe('page');
    });
    it(`protects ${destination.path} from guests`, async () => {
      useAuthStore.getState().logout();
      const {router}=renderApp(destination.path);
      expect(await screen.findByRole('heading',{name:'فضای کار خود را انتخاب کنید'})).toBeDefined();
      expect(router.state.location.pathname).toBe('/login');
      expect(screen.queryByRole('button',{name:'خروج از حساب'})).toBeNull();
    });
    for (const role of roles.filter(role => role !== destination.role)) {
      it(`denies ${role} at ${destination.path} without changing its account`, async () => {
        useAuthStore.getState().switchRole(role);
        const {router}=renderApp(destination.path);
        expect(await screen.findByRole('heading',{name:'به این صفحه دسترسی ندارید'})).toBeDefined();
        expect(router.state.location.pathname).toBe(destination.path);
        fireEvent.click(screen.getByRole('link',{name:'بازگشت به فضای کار من'}));
        await waitFor(() => expect(screen.getByRole('button',{name:'خروج از حساب'})).toBeDefined());
        expect(router.state.location.pathname).toBe(role==='SECRETARY_TEHRAN'?'/secretary/tehran':role==='SECRETARY_ISFAHAN'?'/secretary/isfahan':role==='ADMIN_FINANCE'?'/finance':role==='DOCTOR'?'/doctor':'/patient');
      });
    }
  }
});

describe('workspace overlays and demo invariants', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); sessionStorage.clear(); useAuthStore.getState().switchRole('PATIENT'); vi.restoreAllMocks(); });
  it.each(roles)('keeps %s workspace destinations directly accessible without opening a drawer', async role => {
    const user = userEvent.setup();
    useAuthStore.getState().switchRole(role);
    const own = destinations.filter(destination => destination.role === role);
    const { router } = renderApp(own[0].path);
    expect(screen.queryByRole('button', { name: 'باز کردن منوی فضای کار' })).toBeNull();
    const navigation = screen.getByRole('complementary', { name: 'ناوبری فضای کار' });
    expect(within(navigation).getAllByRole('link')).toHaveLength(own.length);
    const next = within(navigation).getByRole('link', { name: own[1].label });
    next.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe(own[1].path));
    expect(next.getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'خروج از حساب' })).toBeDefined();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('drops the previous patient room when the scenario changes account identity', async () => {
    renderApp();
    fireEvent.click(screen.getAllByRole('button',{name:'ورود به اتاق ویزیت'})[0]);
    expect(await screen.findByText('AGY-10142')).toBeDefined();
    fireEvent.click(screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'}));
    fireEvent.click(screen.getByRole('button',{name:/تزریق بیمار بدهکار/}));
    expect(await screen.findByRole('heading',{name:'اتاق ویزیت در دسترس نیست'})).toBeDefined();
    expect(screen.queryByText('AGY-10142')).toBeNull();
    fireEvent.click(screen.getByRole('link',{name:'بازگشت به فضای کار من'}));
    expect(await screen.findByText(/قفل نرم فعال است/)).toBeDefined();
    expect(screen.queryByText('AGY-10142')).toBeNull();
    expect(screen.queryByRole('button',{name:/خروج از اتاق ویزیت/})).toBeNull();
  });
  it('keeps floating tools outside the header and restores focus on close', async () => {
    const user=userEvent.setup(); renderApp();
    const trigger=screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'});
    expect(trigger.closest('header')).toBeNull();
    await user.click(trigger);
    const dialog=screen.getByRole('dialog',{name:'ابزارهای ارزیابی دمو'});
    expect(dialog.closest('header')).toBeNull();
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  for (const role of roles.filter(role => role !== 'PATIENT')) {
    it(`preserves ${role} identity and destination after reset and disables patient injection`, async () => {
      vi.spyOn(window,'confirm').mockReturnValue(true);
      useAuthStore.getState().switchRole(role);
      const path=role==='DOCTOR'?'/doctor/shifts':role==='ADMIN_FINANCE'?'/finance/settings':role==='SECRETARY_TEHRAN'?'/secretary/tehran/leaves':'/secretary/isfahan/leaves';
      const {router}=renderApp(path);
      const accountName=screen.getByRole('button',{name:/حساب کاربری/}).getAttribute('aria-label');
      fireEvent.click(screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'}));
      expect((screen.getByRole('button',{name:/تزریق بیمار بدهکار/}) as HTMLButtonElement).disabled).toBe(true);
      fireEvent.click(screen.getByRole('button',{name:/ریست کارخانه‌ای داده‌ها/}));
      expect(screen.getByRole('button',{name:accountName!})).toBeDefined();
      expect(router.state.location.pathname).toBe(path);
      expect(screen.queryByText('به این صفحه دسترسی ندارید')).toBeNull();
    });
  }
  it('leaves factory data untouched when reset confirmation is cancelled', () => {
    vi.spyOn(window,'confirm').mockReturnValue(false);
    renderApp();
    fireEvent.click(screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'}));
    fireEvent.click(screen.getByRole('button',{name:/تزریق بیمار بدهکار/}));
    fireEvent.click(screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'}));
    fireEvent.click(screen.getByRole('button',{name:/ریست کارخانه‌ای داده‌ها/}));
    expect(screen.getByRole('dialog',{name:'ابزارهای ارزیابی دمو'})).toBeDefined();
    fireEvent.click(screen.getByRole('button',{name:'بستن ابزارهای دمو'}));
    expect(screen.getByText(/قفل نرم فعال است/)).toBeDefined();
  });
  it.each(['/missing','/patient/missing'])('shows a recoverable unknown route at %s', async path => {
    const {router}=renderApp(path);
    expect(await screen.findByRole('heading',{name:'صفحه پیدا نشد'})).toBeDefined();
    fireEvent.click(screen.getByRole('link',{name:'بازگشت به فضای کار من'}));
    expect(await screen.findByText('کیف پول بیمار')).toBeDefined();
    expect(router.state.location.pathname).toBe('/patient');
  });
});


describe('authorized subroute return after login', () => {
  const cases = [
    {account:'حساب بیمار', path:'/patient/booking', label:'رزرو نوبت جدید'},
    {account:'حساب پزشک', path:'/doctor/shifts', label:'شیفت‌ها و مرخصی'},
    {account:'حساب منشی تهران', path:'/secretary/tehran/leaves', label:'درخواست‌های مرخصی'},
    {account:'حساب منشی اصفهان', path:'/secretary/isfahan/leaves', label:'درخواست‌های مرخصی'},
    {account:'حساب مدیر مالی', path:'/finance/tariffs', label:'تعرفه‌ها و بیمه'},
  ];
  beforeEach(() => { sessionStorage.clear(); useAuthStore.getState().logout(); useBookingStore.getState().resetBooking(); });
  it.each(cases)('resumes $path after $account signs in', async ({account,path,label}) => {
    const {router}=renderApp(path);
    fireEvent.click(await screen.findByRole('button',{name:account}));
    fireEvent.click(screen.getByRole('button',{name:'استفاده از مشخصات آزمایشی'}));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button',{name:'دریافت کد نمایشی'}));
    fireEvent.change(screen.getByLabelText('کد تأیید'),{target:{value:'123456'}});
    fireEvent.click(screen.getByRole('button',{name:'تأیید و ورود'}));
    expect(await screen.findByRole('link',{name:label})).toBeDefined();
    expect(router.state.location.pathname).toBe(path);
  });
});
