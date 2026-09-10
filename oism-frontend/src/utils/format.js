export function money(value) {
  return Number(value ?? 0).toLocaleString('vi-VN') + ' đ';
}

export function compactMoney(value) {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + ' tỷ';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' tr';
  return money(n);
}
