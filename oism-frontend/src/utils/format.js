import { baseURL } from '../api/axiosClient';

/** Uploaded images come back as a path relative to the backend (e.g.
 * `/uploads/xyz.png`), not the frontend's own origin — prefix it with the
 * API's base URL so <img> actually resolves it. Absolute URLs pass through. */
export function resolveImageUrl(url) {
  if (!url) return undefined;
  return /^https?:\/\//.test(url) ? url : `${baseURL}${url}`;
}

export function money(value) {
  return Number(value ?? 0).toLocaleString('vi-VN') + ' đ';
}

export function compactMoney(value) {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr';
  return money(n);
}
