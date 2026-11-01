import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within, waitFor } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { useAuthStore } from '@/shared/stores/useAuthStore';

describe('financial operation destinations', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('ADMIN_FINANCE');
  });

  it('names the shift dialog, links controls, confines keyboard focus and returns it on Escape', () => {
    renderApp('/finance/shifts');
    const opener = screen.getByRole('button', { name: 'تعریف شیفت کاری جدید' });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'تعریف شیفت کاری جدید برای پزشک' });
    const doctor = within(dialog).getByLabelText('پزشک معالج:');
    expect(document.activeElement).toBe(doctor);
    fireEvent.keyDown(doctor, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'انصراف' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('saves explicitly labelled financial settings and shows persisted values after navigation', async () => {
    renderApp('/finance/settings');
    fireEvent.change(screen.getByLabelText(/درصد پیش‌فرض کسورات مالیاتی/), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/مرز زمانی لغو رایگان/), { target: { value: '24' } });
    fireEvent.change(screen.getByLabelText(/درصد جریمهٔ لغو دیرهنگام/), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره تنظیمات' }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', expect.stringContaining('تنظیمات با موفقیت ذخیره'));
    fireEvent.click(screen.getByRole('link', { name: /شیفت/  }));
    fireEvent.click(screen.getByRole('link', { name: /تنظیمات/  }));
    expect(screen.getAllByRole('spinbutton').map(input => (input as HTMLInputElement).value)).toEqual(['15', '24', '40']);
  });

  it('switches between weekly and list views and creates a Friday shift with original validation', () => {
    renderApp('/finance/shifts');
    fireEvent.click(screen.getByRole('button', { name: 'فهرست شیفت‌ها' }));
    expect(screen.getByRole('list', { name: 'فهرست شیفت‌ها' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'تعریف شیفت کاری جدید' }));
    // Existing rule rejects a second active shift on Saturday.
    fireEvent.change(screen.getByLabelText('ساعت شروع:'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('ساعت پایان:'), { target: { value: '13:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'ثبت شیفت در تقویم' }));
    expect(screen.getByRole('alert').textContent).toContain('تداخل شیفت');
    fireEvent.change(screen.getByLabelText('روز هفته:'), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText('ساعت شروع:'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('ساعت پایان:'), { target: { value: '13:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'ثبت شیفت در تقویم' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByText('جمعه')).toBeDefined();
    expect(screen.getByRole('status')).toHaveProperty('textContent', expect.stringContaining('شیفت با موفقیت ثبت شد'));
  });

  it('downloads an actual two-sheet sample, uploads it, filters the comparison and recognises an unchanged re-upload', async () => {
    const urls = vi.fn((_blob: Blob) => 'blob:sample');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: urls, revokeObjectURL: vi.fn() }));
    let downloadedName = '';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloadedName = this.download; });
    renderApp('/finance/tariffs');
    fireEvent.click(screen.getByRole('button', { name: /دانلود قالب اکسل نمونه/ }));
    expect(downloadedName).toBe('Clinic_Agy_Tariff_Template_v2.xlsx');
    const blob = urls.mock.calls[0][0] as Blob;
    const buffer = await new Promise<ArrayBuffer>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.readAsArrayBuffer(blob); });
    expect(XLSX.read(buffer).SheetNames).toEqual(['Services_BaseInsurance', 'Supplementary_Rules']);
    const file = new File([buffer], downloadedName);
    const upload = screen.getByLabelText(/برای انتخاب فایل اکسل/);
    fireEvent.change(upload, { target: { files: [file] } });
    await screen.findByText('SRV-HOL-01');
    expect(screen.getByText('۳۵۰٬۰۰۰', { exact: false })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'جدید' }));
    expect(screen.queryByText('SRV-CLI-01')).toBeNull();
    expect(screen.getByText('SRV-HOL-01')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /تأیید و اعمال/ }));
    await screen.findByText(/تعرفه‌های جدید با موفقیت اعمال شدند/);
    const unchanged = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(unchanged, XLSX.utils.json_to_sheet([{ code: 'SRV-HOL-01', name: 'هولتر مانیتورینگ ریتم قلب ۲۴ ساعته', freePrice: 650000, durationMinutes: 30, consumableCost: 80000 }]), 'Services_BaseInsurance');
    XLSX.utils.book_append_sheet(unchanged, XLSX.utils.aoa_to_sheet([['بیمه تکمیلی']]), 'Supplementary_Rules');
    fireEvent.change(upload, { target: { files: [new File([XLSX.write(unchanged, { type: 'array', bookType: 'xlsx' })], 'unchanged.xlsx')] } });
    await screen.findByText('تغییری نسبت به تعرفه‌های فعلی وجود ندارد.');
    fireEvent.click(screen.getByRole('button', { name: 'فقط تغییرات' }));
    expect(screen.getByText('ردیفی برای این فیلتر وجود ندارد.')).toBeDefined();
    await waitFor(() => expect((screen.getByRole('button', { name: /تأیید و اعمال/ }) as HTMLButtonElement).disabled).toBe(true));
    click.mockRestore();
    vi.unstubAllGlobals();
  });

  it('closes the shift dialog when browser Back changes the finance destination', async () => {
    const { router } = renderApp('/finance/tariffs');
    fireEvent.click(screen.getByRole('link', { name: /شیفت/ }));
    fireEvent.click(screen.getByRole('button', { name: 'تعریف شیفت کاری جدید' }));
    expect(screen.getByRole('dialog', { name: 'تعریف شیفت کاری جدید برای پزشک' })).toBeDefined();
    await act(() => router.navigate(-1));
    expect(router.state.location.pathname).toBe('/finance/tariffs');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { name: 'تعرفه‌ها و قراردادهای بیمه' })).toBeDefined();
  });

  it('explains an empty shift schedule without blocking the create action', () => {
    for (const shift of [...memoryDb.getAll('doctorShifts')]) memoryDb.delete('doctorShifts', shift.id);
    renderApp('/finance/shifts');
    expect(screen.getByText(/هنوز شیفتی تعریف نشده است/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'فهرست شیفت‌ها' }));
    expect(screen.getByRole('list', { name: 'فهرست شیفت‌ها' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'تعریف شیفت کاری جدید' }));
    expect(screen.getByRole('dialog', { name: 'تعریف شیفت کاری جدید برای پزشک' })).toBeDefined();
  });

  it('explains an invalid workbook and allows choosing another file', async () => {
    renderApp('/finance/tariffs');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['test']]), 'Invalid');
    const file = new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], 'invalid.xlsx');
    fireEvent.change(screen.getByLabelText(/برای انتخاب فایل اکسل/), { target: { files: [file] } });
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('Services_BaseInsurance'));
    expect(screen.queryByText('ساختار معتبر')).toBeNull();
    expect((screen.getByRole('button', { name: /تأیید و اعمال/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
