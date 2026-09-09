/**
 * FR-COST-01: Weighted Average Cost.
 * New Cost = ((OldStock * OldCost) + (ImportQty * ImportPrice)) / (OldStock + ImportQty)
 *
 * Uses plain numbers (not Decimal.js) for readability; callers pass Number(prisma.Decimal)
 * and the API layer rounds to 2 decimal places before persisting, which matches the
 * VND-level precision this project needs.
 */
export function calculateWeightedAverageCost(
  oldStock: number,
  oldCost: number,
  importQty: number,
  importPrice: number,
): number {
  if (importQty <= 0) throw new Error('Số lượng nhập phải lớn hơn 0.');
  if (importPrice < 0) throw new Error('Giá nhập không hợp lệ.');

  const totalQty = oldStock + importQty;
  if (totalQty <= 0) return oldCost;

  const currentTotalValue = oldStock * oldCost;
  const incomingTotalValue = importQty * importPrice;

  return Math.round(((currentTotalValue + incomingTotalValue) / totalQty) * 100) / 100;
}
