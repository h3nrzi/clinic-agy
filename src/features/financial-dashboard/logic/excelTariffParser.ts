import * as XLSX from 'xlsx';
import { ServiceTariff, SupplementaryInsurance, TariffDiffItem, BranchId } from '@/shared/types';
import { memoryDb } from '@/mocks/db/memoryDb';

export interface ParseExcelResult {
  isValid: boolean;
  errors: string[];
  sheetNames: string[];
  diffItems: TariffDiffItem[];
  parsedServices: ServiceTariff[];
  parsedRules: SupplementaryInsurance[];
}

/**
 * Normalizes branch name to BranchId | 'ALL'
 */
function normalizeBranch(val: any): BranchId | 'ALL' {
  const str = String(val || '').trim();
  if (str === 'تهران' || str === 'TEHRAN') return 'TEHRAN';
  if (str === 'اصفهان' || str === 'ISFAHAN') return 'ISFAHAN';
  if (str === 'آنلاین' || str === 'ONLINE') return 'ONLINE';
  return 'ALL';
}

/**
 * Parses a 2-Sheet Excel file buffer according to PRD 9.2 specifications
 */
export function parseTariffWorkbook(data: ArrayBuffer | Uint8Array): ParseExcelResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const errors: string[] = [];

  const sheet1Name = sheetNames.find(
    (n) => n === 'Services_BaseInsurance' || n.includes('Services') || n.includes('خدمات')
  );
  const sheet2Name = sheetNames.find(
    (n) => n === 'Supplementary_Rules' || n.includes('Supplementary') || n.includes('تکمیلی')
  );

  if (!sheet1Name) {
    errors.push('شیت شماره ۱ با عنوان «Services_BaseInsurance» یافت نشد.');
  }
  if (!sheet2Name) {
    errors.push('شیت شماره ۲ با عنوان «Supplementary_Rules» یافت نشد.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      sheetNames,
      diffItems: [],
      parsedServices: [],
      parsedRules: [],
    };
  }

  const rawServices: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet1Name!]);
  const rawRules: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet2Name!]);

  const currentServices = memoryDb.getAll('services');
  const currentSupp = memoryDb.getAll('supplementaryInsurances');

  const diffItems: TariffDiffItem[] = [];
  const parsedServices: ServiceTariff[] = [];
  const parsedRules: SupplementaryInsurance[] = [];

  // 1. Process Sheet 1: Services_BaseInsurance
  for (const row of rawServices) {
    const code = String(row['کد خدمت'] || row['code'] || '').trim();
    const name = String(row['نام خدمت'] || row['name'] || '').trim();
    if (!code || !name) continue;

    const branch = normalizeBranch(row['شعبه'] || row['branch']);
    const duration = parseInt(row['مدت زمان ویزیت (دقیقه)'] || row['durationMinutes'] || '15', 10);
    const freePrice = parseInt(row['قیمت آزاد (تومان)'] || row['freePrice'] || '0', 10);
    const consumableCost = parseInt(row['هزینه مواد مصرفی (تومان)'] || row['consumableCost'] || '0', 10);
    const isActive = String(row['فعال'] || 'بله').trim() !== 'خیر';

    const serviceObj: ServiceTariff = {
      id: `srv-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      code,
      category: 'CONSULTATION',
      branch,
      durationMinutes: duration,
      freePrice,
      consumableCost,
      isActive,
    };
    parsedServices.push(serviceObj);

    // Compare with current database for Diff
    const existing = currentServices.find((s) => s.code === code);
    if (!existing) {
      diffItems.push({
        id: `diff-srv-${code}`,
        category: 'SERVICE',
        action: 'NEW',
        code,
        title: name,
        branchOrDetails: branch === 'ALL' ? 'همه شعب' : branch,
        newValueDescription: `قیمت: ${freePrice.toLocaleString('fa-IR')} تومان | مدت: ${duration} دقیقه`,
        rawNewData: serviceObj,
      });
    } else {
      const priceChanged = existing.freePrice !== freePrice;
      const durationChanged = existing.durationMinutes !== duration;
      const consumableChanged = existing.consumableCost !== consumableCost;

      if (priceChanged || durationChanged || consumableChanged) {
        const changes: string[] = [];
        const oldChanges: string[] = [];
        if (priceChanged) {
          changes.push(`قیمت: ${freePrice.toLocaleString('fa-IR')} تومان`);
          oldChanges.push(`قیمت: ${existing.freePrice.toLocaleString('fa-IR')} تومان`);
        }
        if (durationChanged) {
          changes.push(`مدت: ${duration} دقیقه`);
          oldChanges.push(`مدت: ${existing.durationMinutes} دقیقه`);
        }
        if (consumableChanged) {
          changes.push(`مواد مصرفی: ${consumableCost.toLocaleString('fa-IR')} تومان`);
          oldChanges.push(`مواد مصرفی: ${existing.consumableCost.toLocaleString('fa-IR')} تومان`);
        }

        diffItems.push({
          id: `diff-srv-${code}`,
          category: 'SERVICE',
          action: 'MODIFIED',
          code,
          title: name,
          branchOrDetails: branch === 'ALL' ? 'همه شعب' : branch,
          oldValueDescription: oldChanges.join(' | '),
          newValueDescription: changes.join(' | '),
          rawNewData: serviceObj,
        });
      } else {
        diffItems.push({
          id: `diff-srv-${code}`,
          category: 'SERVICE',
          action: 'UNCHANGED',
          code,
          title: name,
          branchOrDetails: branch === 'ALL' ? 'همه شعب' : branch,
          newValueDescription: `بدون تغییر (${freePrice.toLocaleString('fa-IR')} تومان)`,
          rawNewData: serviceObj,
        });
      }
    }
  }

  // 2. Process Sheet 2: Supplementary_Rules
  for (const row of rawRules) {
    const suppName = String(row['بیمه تکمیلی'] || row['name'] || '').trim();
    if (!suppName) continue;

    const rawCoverage = parseFloat(row['مقدار پوشش تکمیلی'] || row['coveragePercent'] || '0');
    const coveragePercent = rawCoverage > 1 ? rawCoverage / 100 : rawCoverage;
    const ceilingLimit = parseInt(row['سقف تعهد در هر ویزیت (تومان)'] || row['ceilingLimit'] || '0', 10);
    const code = `SUPP-${suppName.toUpperCase().replace(/\s+/g, '-')}`;

    const ruleObj: SupplementaryInsurance = {
      id: `ins-supp-${suppName.toLowerCase().replace(/\s+/g, '-')}`,
      name: suppName,
      code,
      coveragePercentOfRemaining: coveragePercent,
      ceilingLimit,
      isDefault: false,
    };
    parsedRules.push(ruleObj);

    // Compare with current DB
    const existing = currentSupp.find((r) => r.name === suppName || r.code === code);
    if (!existing) {
      diffItems.push({
        id: `diff-rule-${code}`,
        category: 'SUPPLEMENTARY_RULE',
        action: 'NEW',
        code: suppName,
        title: `قاعده بیمه تکمیلی ${suppName}`,
        branchOrDetails: 'سراسری',
        newValueDescription: `پوشش: ${Math.round(coveragePercent * 100)}٪ باقی‌مانده | سقف: ${ceilingLimit.toLocaleString('fa-IR')} تومان`,
        rawNewData: ruleObj,
      });
    } else {
      const coverageChanged = existing.coveragePercentOfRemaining !== coveragePercent;
      const ceilingChanged = existing.ceilingLimit !== ceilingLimit;

      if (coverageChanged || ceilingChanged) {
        diffItems.push({
          id: `diff-rule-${code}`,
          category: 'SUPPLEMENTARY_RULE',
          action: 'MODIFIED',
          code: suppName,
          title: `قاعده بیمه تکمیلی ${suppName}`,
          branchOrDetails: 'سراسری',
          oldValueDescription: `پوشش: ${Math.round(existing.coveragePercentOfRemaining * 100)}٪ | سقف: ${existing.ceilingLimit.toLocaleString('fa-IR')} تومان`,
          newValueDescription: `پوشش: ${Math.round(coveragePercent * 100)}٪ | سقف: ${ceilingLimit.toLocaleString('fa-IR')} تومان`,
          rawNewData: ruleObj,
        });
      } else {
        diffItems.push({
          id: `diff-rule-${code}`,
          category: 'SUPPLEMENTARY_RULE',
          action: 'UNCHANGED',
          code: suppName,
          title: `قاعده بیمه تکمیلی ${suppName}`,
          branchOrDetails: 'سراسری',
          newValueDescription: `بدون تغییر`,
          rawNewData: ruleObj,
        });
      }
    }
  }

  return {
    isValid: true,
    errors: [],
    sheetNames,
    diffItems,
    parsedServices,
    parsedRules,
  };
}

/**
 * Generates an actual 2-sheet sample Excel file Uint8Array matching DEC-FE-03 and PRD 9.2
 * Contains:
 * - 1 modified service (price update for SRV-CLI-01 from 350,000 to 420,000)
 * - 1 new service (SRV-HOL-01: هولتر مانیتورینگ قلب)
 * - 1 updated supplementary rule (Dana ceiling from 200,000 to 300,000)
 */
export function generateSampleTariffWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const sheet1Data = [
    {
      'کد خدمت': 'SRV-TEL-01',
      'نام خدمت': 'ویزیت تخصصی آنلاین (تله‌مدیسین)',
      'شعبه': 'همه',
      'مدت زمان ویزیت (دقیقه)': 15,
      'قیمت آزاد (تومان)': 280000,
      'هزینه مواد مصرفی (تومان)': 0,
      'بیمه پایه': 'تأمین اجتماعی',
      'نوع پوشش پایه': 'درصد',
      'مقدار پوشش پایه': 30,
      'فعال': 'بله',
    },
    {
      'کد خدمت': 'SRV-CLI-01',
      'نام خدمت': 'ویزیت تخصصی حضوری (به‌روزرسانی تعرفه جدید)',
      'شعبه': 'همه',
      'مدت زمان ویزیت (دقیقه)': 20,
      'قیمت آزاد (تومان)': 420000, // Modified from 350000 to 420000
      'هزینه مواد مصرفی (تومان)': 30000,
      'بیمه پایه': 'تأمین اجتماعی',
      'نوع پوشش پایه': 'درصد',
      'مقدار پوشش پایه': 30,
      'فعال': 'بله',
    },
    {
      'کد خدمت': 'SRV-ECG-02',
      'نام خدمت': 'نوار قلب استاندارد (ECG) همراه با تفسیر',
      'شعبه': 'تهران',
      'مدت زمان ویزیت (دقیقه)': 15,
      'قیمت آزاد (تومان)': 190000,
      'هزینه مواد مصرفی (تومان)': 45000,
      'بیمه پایه': 'همه',
      'نوع پوشش پایه': 'مبلغ ثابت',
      'مقدار پوشش پایه': 50000,
      'فعال': 'بله',
    },
    {
      'کد خدمت': 'SRV-HOL-01', // Brand new service
      'نام خدمت': 'هولتر مانیتورینگ ریتم قلب ۲۴ ساعته',
      'شعبه': 'همه',
      'مدت زمان ویزیت (دقیقه)': 30,
      'قیمت آزاد (تومان)': 650000,
      'هزینه مواد مصرفی (تومان)': 80000,
      'بیمه پایه': 'تأمین اجتماعی',
      'نوع پوشش پایه': 'درصد',
      'مقدار پوشش پایه': 30,
      'فعال': 'بله',
    },
  ];

  const sheet2Data = [
    {
      'کد خدمت': 'همه',
      'بیمه تکمیلی': 'بیمه تکمیلی دانا',
      'بیمه پایه مجاز': 'همه',
      'نوع پوشش تکمیلی': 'درصد از باقی‌مانده',
      'مقدار پوشش تکمیلی': 70,
      'سقف تعهد در هر ویزیت (تومان)': 300000, // Increased cap
      'فعال': 'بله',
    },
    {
      'کد خدمت': 'همه',
      'بیمه تکمیلی': 'بیمه تکمیلی سامان',
      'بیمه پایه مجاز': 'همه',
      'نوع پوشش تکمیلی': 'درصد از باقی‌مانده',
      'مقدار پوشش تکمیلی': 80,
      'سقف تعهد در هر ویزیت (تومان)': 250000,
      'فعال': 'بله',
    },
    {
      'کد خدمت': 'همه',
      'بیمه تکمیلی': 'بیمه تکمیلی سینا (جدید)', // Brand new rule
      'بیمه پایه مجاز': 'همه',
      'نوع پوشش تکمیلی': 'درصد از باقی‌مانده',
      'مقدار پوشش تکمیلی': 75,
      'سقف تعهد در هر ویزیت (تومان)': 280000,
      'فعال': 'بله',
    },
  ];

  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);

  XLSX.utils.book_append_sheet(wb, ws1, 'Services_BaseInsurance');
  XLSX.utils.book_append_sheet(wb, ws2, 'Supplementary_Rules');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
