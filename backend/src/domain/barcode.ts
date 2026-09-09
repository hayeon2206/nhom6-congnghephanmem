import { randomInt } from 'crypto';

/**
 * FR-PROD-03: auto-generates an EAN-13 barcode when the user does not scan/enter one.
 * Uses the "20-29" GS1 prefix range reserved for internal/in-store use, followed by
 * 10 random digits and a computed EAN-13 check digit.
 */
export function generateEan13Barcode(): string {
  const prefix = '2' + randomInt(0, 10).toString(); // 20-29 internal-use range
  const body = Array.from({ length: 10 }, () => randomInt(0, 10)).join('');
  const digits = prefix + body;
  return digits + computeEan13CheckDigit(digits);
}

export function computeEan13CheckDigit(twelveDigits: string): string {
  if (!/^\d{12}$/.test(twelveDigits)) {
    throw new Error('EAN-13 check digit cần đúng 12 chữ số đầu vào.');
  }

  const sum = twelveDigits
    .split('')
    .map(Number)
    .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 1 : 3), 0);

  return String((10 - (sum % 10)) % 10);
}

export function isValidEan13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;
  return computeEan13CheckDigit(barcode.slice(0, 12)) === barcode[12];
}

/** FR-PROD-02: readable SKU code, e.g. AO-KHOAC-7F3A9C. */
export function generateSkuCode(productName: string): string {
  const slugPart = productName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 12);

  const random = randomInt(0, 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  return `${slugPart || 'SP'}-${random}`;
}
