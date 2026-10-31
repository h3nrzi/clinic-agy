import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderApp } from '../helpers/appFixture';
import { memoryDb } from '@/mocks/db/memoryDb';
import { tariffRepository } from '@/mocks/repositories/tariffRepository';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { parseTariffWorkbook, generateSampleTariffWorkbook } from '@/features/financial-dashboard/logic/excelTariffParser';

describe('WP-05: 2-Sheet Excel Tariff Upload & Diff Preview (FLOW-06, AC-07, DEC-FE-03)', () => {
  beforeEach(() => {
    memoryDb.resetToFactoryDefaults();
    useAuthStore.getState().switchRole('ADMIN_FINANCE');
  });

  it('validates and parses 2-sheet Excel file, computing Diff matrix with new and modified services (AC-07)', () => {
    // Generate sample 2-sheet workbook
    const sampleBuffer = generateSampleTariffWorkbook();
    expect(sampleBuffer.length).toBeGreaterThan(0);

    const parseResult = parseTariffWorkbook(sampleBuffer);
    expect(parseResult.isValid).toBe(true);
    expect(parseResult.sheetNames).toContain('Services_BaseInsurance');
    expect(parseResult.sheetNames).toContain('Supplementary_Rules');

    // Verify Diff items
    const modifiedService = parseResult.diffItems.find((d) => d.code === 'SRV-CLI-01');
    expect(modifiedService).toBeDefined();
    expect(modifiedService?.action).toBe('MODIFIED');
    expect(modifiedService?.oldValueDescription).toContain('۳۵۰٬۰۰۰');
    expect(modifiedService?.newValueDescription).toContain('۴۲۰٬۰۰۰');

    const newService = parseResult.diffItems.find((d) => d.code === 'SRV-HOL-01');
    expect(newService).toBeDefined();
    expect(newService?.action).toBe('NEW');
    expect(newService?.title).toContain('هولتر مانیتورینگ');
  });

  it('interactively loads mock 2-sheet Excel in UI, displays Diff table, and applies new tariffs to repository (AC-07)', async () => {
    renderApp();

    // Verify Admin Finance Dashboard
    expect(screen.getByTestId('financial-dashboard')).toBeDefined();

    // Switch to Excel Tariff Tab
    const excelTabBtn = screen.getByRole('button', { name: /آپلود اکسل ۲ شیتی/ });
    fireEvent.click(excelTabBtn);

    // Verify Tab 2 is active
    expect(screen.getByText(/آپلود و تحلیل فایل اکسل تعرفه‌ها/)).toBeDefined();

    // Click "بارگذاری داده نمونه ماک ۲ شیتی"
    const loadMockBtn = screen.getByRole('button', { name: /بارگذاری داده نمونه ماک ۲ شیتی/ });
    fireEvent.click(loadMockBtn);

    // Wait for Diff table to appear
    await waitFor(() => {
      expect(screen.getByText(/پیش‌نمایش تغییرات و جدول مقایسه‌ای Diff/)).toBeDefined();
    });

    // Check that Diff rows appear
    expect(screen.getByText('SRV-CLI-01')).toBeDefined();
    expect(screen.getByText('SRV-HOL-01')).toBeDefined();
    expect(screen.getAllByText('ویرایش تعرفه').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+ خدمت جدید').length).toBeGreaterThan(0);

    // Click "تأیید و اعمال نهایی در سیستم"
    const applyBtn = screen.getByRole('button', { name: /تأیید و اعمال نهایی در سیستم/ });
    fireEvent.click(applyBtn);

    // Verify success banner appears
    await waitFor(() => {
      expect(screen.getByText(/تعرفه‌های جدید با موفقیت اعمال شدند/)).toBeDefined();
    });

    // Verify database was actually updated with new price and new service
    const updatedSrvCli = tariffRepository.getServiceById('srv-srv-cli-01') || tariffRepository.getServices().find(s => s.code === 'SRV-CLI-01');
    expect(updatedSrvCli?.freePrice).toBe(420000);

    const newServiceInDb = tariffRepository.getServices().find((s) => s.code === 'SRV-HOL-01');
    expect(newServiceInDb).toBeDefined();
    expect(newServiceInDb?.freePrice).toBe(650000);
  });
});
