/**
 * Formatters and Persian Localization Helpers
 */

export function toPersianDigits(n: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
}

export function formatToman(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US');
  const persianStr = toPersianDigits(formatted);
  return isNegative ? `-${persianStr} تومان (بدهکار)` : `${persianStr} تومان`;
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} - ساعت ${timeStr}`;
  } catch {
    return isoString;
  }
}
