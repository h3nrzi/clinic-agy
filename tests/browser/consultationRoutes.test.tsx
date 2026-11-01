import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import type { Appointment } from '@/shared/types';
import { memoryDb } from '@/mocks/db/memoryDb';
import { ROLE_PROFILES, useAuthStore } from '@/shared/stores/useAuthStore';

describe('Independent authorized consultation URLs', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); useAuthStore.getState().switchRole('DOCTOR'); });
  it('opens the doctor room directly from the appointment URL', () => {
    renderApp('/doctor/consultations/app-1');
    expect(screen.getByTestId('doctor-consultation-room')).toBeDefined();
    expect(screen.getByText('AGY-10142')).toBeDefined();
  });
});

describe('Resource privacy before any room content', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); useAuthStore.getState().switchRole('PATIENT'); });
  it('opens and reopens the patient room with the same authorized session', () => {
    const view = renderApp('/patient/consultations/app-1');
    expect(screen.getByTestId('patient-consultation-room')).toBeDefined();
    view.unmount();
    renderApp('/patient/consultations/app-1');
    expect(screen.getByText('AGY-10142')).toBeDefined();
  });
  it.each<[string, Partial<Appointment>]>([
    ['missing', {}], ['app-1', {patientId:'pat-other'}], ['app-1', {isSoftLocked:true}],
    ['app-1', {branchId:'TEHRAN'}], ['app-1', {status:'COMPLETED'}], ['app-1', {status:'IN_CONSULTATION'}],
  ])('denies an unavailable patient room %s %j', (id, patch) => {
    if (id === 'app-1') memoryDb.update('appointments', id, patch);
    renderApp(`/patient/consultations/${id}`);
    expect(screen.getByRole('heading', {name:'اتاق ویزیت در دسترس نیست'})).toBeDefined();
    expect(screen.queryByText('AGY-10142')).toBeNull();
    expect(screen.queryByTestId('patient-consultation-room')).toBeNull();
  });
  it('does not switch an active account from a room URL for another role', () => {
    renderApp('/doctor/consultations/app-1');
    expect(screen.getByRole('heading', {name:'به این صفحه دسترسی ندارید'})).toBeDefined();
    expect(screen.queryByText('AGY-10142')).toBeNull();
  });
  it('rejects another doctor but preserves completed and legacy unassigned visits', () => {
    useAuthStore.getState().switchRole('DOCTOR');
    memoryDb.update('appointments', 'app-1', {doctorId:'doc-other'});
    const view = renderApp('/doctor/consultations/app-1');
    expect(screen.queryByText('AGY-10142')).toBeNull();
    view.unmount();
    memoryDb.update('appointments', 'app-1', {doctorId:'', status:'COMPLETED'});
    renderApp('/doctor/consultations/app-1');
    expect(screen.getByTestId('doctor-consultation-room')).toBeDefined();
    expect(screen.getByRole('button', {name:'به‌روزرسانی پرونده بالینی'})).toBeDefined();
  });
});

function changeNote(value = 'متن خصوصی ثبت نشده') {
  fireEvent.change(screen.getByLabelText(/شکایت اصلی بیمار/), { target: { value } });
}
async function stay() {
  fireEvent.click(await screen.findByRole('button', {name:'ماندن و ادامه'}));
}
async function leave() {
  fireEvent.click(await screen.findByRole('button', {name:'خروج و کنارگذاشتن تغییرات'}));
}
describe('Clinical note exit protection through the whole app', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); useAuthStore.getState().switchRole('DOCTOR'); });
  it.each(['menu', 'back button', 'end call', 'browser back', 'logout'])('preserves draft, URL and account on stay and discards on %s leave', async action => {
    const {router} = renderApp('/doctor');
    await act(async () => { await router.navigate('/doctor/consultations/app-1'); });
    changeNote();
    const exit = async () => {
      if (action === 'menu') fireEvent.click(screen.getByRole('link',{name:'شیفت‌ها و مرخصی'}));
      if (action === 'back button') fireEvent.click(screen.getByRole('button',{name:'بازگشت به کارتابل پزشک'}));
      if (action === 'end call') fireEvent.click(screen.getByRole('button',{name:'خاتمه تماس'}));
      if (action === 'browser back') await act(async () => { await router.navigate(-1); });
      if (action === 'logout') fireEvent.click(screen.getByRole('button',{name:'خروج از حساب'}));
    };
    await exit(); await stay();
    expect(router.state.location.pathname).toBe('/doctor/consultations/app-1');
    expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('متن خصوصی ثبت نشده');
    expect(screen.getByRole('button',{name:'خروج از حساب'})).toBeDefined();
    expect(screen.getByRole('button',{name:'حساب کاربری دکتر مریم احمدی'})).toBeDefined();
    await exit(); await leave();
    await waitFor(() => expect(router.state.location.pathname).toBe(action === 'logout' ? '/' : action === 'menu' ? '/doctor/shifts' : '/doctor'));
    if (action !== 'logout') {
      await act(async () => {await router.navigate('/doctor/consultations/app-1');});
      expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('');
    }
  });
  it('registers native reload prevention only while dirty and clears it after final save', async () => {
    renderApp('/doctor/consultations/app-1');
    const unloaded = () => { const event = new Event('beforeunload',{cancelable:true}); window.dispatchEvent(event); return event.defaultPrevented; };
    expect(unloaded()).toBe(false); changeNote(); expect(unloaded()).toBe(true);
    fireEvent.click(screen.getByRole('button',{name:'ثبت نهایی و خاتمه ویزیت'}));
    expect(screen.getByRole('dialog',{name:'پرونده بالینی با موفقیت ثبت شد'})).toBeDefined();
    expect(unloaded()).toBe(false);
    fireEvent.keyDown(document,{key:'Escape'});
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'خروج از اتاق ویزیت'}));
    await screen.findByTestId('doctor-dashboard');
    expect(screen.queryByRole('dialog',{name:'ترک کار ناتمام؟'})).toBeNull();
  });
  it('protects confirmed demo reset before touching private draft or account', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const {router} = renderApp('/doctor/consultations/app-1'); changeNote();
    fireEvent.click(screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'}));
    fireEvent.click(screen.getByRole('button',{name:/ریست کارخانه‌ای داده‌ها/}));
    await stay();
    expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('متن خصوصی ثبت نشده');
    expect(router.state.location.pathname).toBe('/doctor/consultations/app-1');
    fireEvent.click(screen.getByRole('button',{name:'ابزارهای ارزیابی دمو'}));
    fireEvent.click(screen.getByRole('button',{name:/ریست کارخانه‌ای داده‌ها/})); await leave();
    expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('');
    expect(screen.getByRole('button',{name:'حساب کاربری دکتر مریم احمدی'})).toBeDefined();
    expect(router.state.location.pathname).toBe('/doctor/consultations/app-1');
    confirm.mockRestore();
  });
});

describe('Room login return authorization', () => {
  beforeEach(() => { memoryDb.resetToFactoryDefaults(); useAuthStore.getState().logout(); sessionStorage.clear(); });
  it.each([
    ['/patient/consultations/app-1','حساب بیمار','/patient/consultations/app-1'],
    ['/doctor/consultations/app-1','حساب پزشک','/doctor/consultations/app-1'],
    ['/patient/consultations/missing','حساب بیمار','/patient'],
    ['/doctor/consultations/app-1','حساب بیمار','/patient'],
    ['/patient/consultations/app-2','حساب بیمار','/patient'],
  ])('resumes %s only when authorized after %s', async (path, account, expected) => {
    const {router} = renderApp(path);
    fireEvent.click(await screen.findByRole('button',{name:account}));
    fireEvent.click(screen.getByRole('button',{name:'استفاده از مشخصات آزمایشی'}));
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button',{name:'دریافت کد نمایشی'}));
    fireEvent.change(screen.getByLabelText('کد تأیید'),{target:{value:'123456'}});
    fireEvent.click(screen.getByRole('button',{name:'تأیید و ورود'}));
    await waitFor(() => expect(router.state.location.pathname).toBe(expected));
  });
});

describe('Role and resource room matrix', () => {
  beforeEach(() => memoryDb.resetToFactoryDefaults());
  it.each(['PATIENT','DOCTOR','SECRETARY_TEHRAN','SECRETARY_ISFAHAN','ADMIN_FINANCE'] as const)('never changes %s account from doctor or patient URLs', role => {
    useAuthStore.getState().switchRole(role);
    const view = renderApp('/doctor/consultations/app-1');
    expect(screen.queryByTestId('doctor-consultation-room') !== null).toBe(role === 'DOCTOR');
    if (role !== 'DOCTOR') expect(screen.queryByText('AGY-10142')).toBeNull();
    view.unmount();
    renderApp('/patient/consultations/app-1');
    expect(screen.queryByTestId('patient-consultation-room') !== null).toBe(role === 'PATIENT');
    if (role !== 'PATIENT') expect(screen.queryByText('AGY-10142')).toBeNull();
    expect(screen.getByRole('button',{name:`حساب کاربری ${ROLE_PROFILES[role].name}`})).toBeDefined();
  });
  it('refreshes a doctor room and changes appointment without retaining the previous draft', async () => {
    useAuthStore.getState().switchRole('DOCTOR');
    memoryDb.insert('appointments', {...memoryDb.getAll('appointments')[0], id:'other-visit', trackingCode:'SECOND-VISIT'});
    const view = renderApp('/doctor/consultations/app-1');
    changeNote('first private note');
    view.unmount();
    const {router} = renderApp('/doctor/consultations/app-1');
    expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('');
    changeNote('second private note');
    await act(async () => { await router.navigate('/doctor/consultations/other-visit'); });
    await leave();
    await screen.findByText('SECOND-VISIT');
    expect((screen.getByLabelText(/شکایت اصلی بیمار/) as HTMLTextAreaElement).value).toBe('');
  });
  it('keeps all five fields while reviewing documents and financial details without saving', () => {
    useAuthStore.getState().switchRole('DOCTOR');
    renderApp('/doctor/consultations/app-1');
    const labels = [/شکایت اصلی بیمار/,/یافته‌های مهم و معاینه/,/تشخیص و تشخیص‌های افتراقی/,/توصیه‌ها، دستورات دارویی و نسخه/,/دستور پیگیری/];
    labels.forEach((label,index) => fireEvent.change(screen.getByLabelText(label), {target:{value:`private field ${index}`}}));
    fireEvent.click(screen.getByRole('button',{name:/مدارک و آزمایش‌های بیمار/}));
    fireEvent.click(screen.getByRole('button',{name:'مشخصات مالی و بیمه'}));
    fireEvent.click(screen.getByRole('button',{name:'شرح‌حال و نسخه'}));
    labels.forEach((label,index) => expect((screen.getByLabelText(label) as HTMLTextAreaElement).value).toBe(`private field ${index}`));
    expect(screen.getByRole('button',{name:'ثبت نهایی و خاتمه ویزیت'})).toBeDefined();
  });
  it('does not expose private fields in an authorized patient room', () => {
    memoryDb.update('appointments','app-1',{clinicalNote:{id:'note',appointmentId:'app-1',doctorId:'doc-1',mainComplaint:'PRIVATE complaint',findings:'PRIVATE findings',diagnosis:'PRIVATE diagnosis',prescriptions:'PUBLIC prescription',followUp:'PUBLIC followup',patientId:'pat-1',savedAt:'2026-11-01'}});
    useAuthStore.getState().switchRole('PATIENT');
    renderApp('/patient/consultations/app-1');
    expect(screen.getByText('PUBLIC prescription')).toBeDefined();
    expect(screen.getByText('PUBLIC followup')).toBeDefined();
    expect(screen.queryByText(/PRIVATE/)).toBeNull();
  });
});
