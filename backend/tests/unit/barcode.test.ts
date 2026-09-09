import { generateEan13Barcode, isValidEan13, computeEan13CheckDigit } from '../../src/domain/barcode';

describe('EAN-13 barcode generation (FR-PROD-03)', () => {
  it('generates a 13-digit barcode with a valid check digit', () => {
    for (let i = 0; i < 20; i++) {
      const barcode = generateEan13Barcode();
      expect(barcode).toMatch(/^\d{13}$/);
      expect(isValidEan13(barcode)).toBe(true);
    }
  });

  it('uses the 20-29 internal-use GS1 prefix range', () => {
    const barcode = generateEan13Barcode();
    expect(['2']).toContain(barcode[0]);
    expect(Number(barcode[1])).toBeGreaterThanOrEqual(0);
    expect(Number(barcode[1])).toBeLessThanOrEqual(9);
  });

  it('computes a known EAN-13 check digit correctly', () => {
    // 4006381333931 is a well-known real-world EAN-13 (Kellogg's); check digit is 1.
    expect(computeEan13CheckDigit('400638133393')).toBe('1');
  });

  it('rejects a barcode with a tampered check digit', () => {
    const barcode = generateEan13Barcode();
    const tampered = barcode.slice(0, 12) + String((Number(barcode[12]) + 1) % 10);
    expect(isValidEan13(tampered)).toBe(false);
  });
});
