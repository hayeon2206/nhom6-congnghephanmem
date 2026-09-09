import { randomInt } from 'crypto';

export function generateDocumentCode(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = randomInt(0, 0xffff).toString(16).toUpperCase().padStart(4, '0');
  return `${prefix}-${date}-${random}`;
}
