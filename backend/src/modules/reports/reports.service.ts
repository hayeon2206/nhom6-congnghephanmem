import { OrderState, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export interface RevenueReportQuery {
  from?: string;
  to?: string;
  branchId?: string;
  channel?: string;
  productId?: string;
}

/** FR-REP-01: Net Revenue, Total COGS, Gross Profit — filterable by timeframe, branch, channel, SKU. */
export async function getRevenueProfitReport(tenantId: string, query: RevenueReportQuery) {
  const items = await prisma.orderItem.findMany({
    where: {
      tenantId,
      productId: query.productId,
      order: {
        tenantId,
        state: OrderState.COMPLETED,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.channel ? { channel: query.channel as any } : {}),
        ...(query.from || query.to
          ? {
              completedAt: {
                ...(query.from ? { gte: new Date(query.from) } : {}),
                ...(query.to ? { lte: new Date(query.to) } : {}),
              },
            }
          : {}),
      },
    },
    include: { product: true, order: true },
  });

  const revenue = items.reduce((sum, i) => sum + i.quantity * Number(i.sellingPrice), 0);
  const cost = items.reduce((sum, i) => sum + i.quantity * Number(i.snapshotCostPrice), 0);

  const byChannel = groupSum(items, (i) => i.order.channel, (i) => i.quantity * Number(i.sellingPrice));
  const byProduct = groupSum(items, (i) => i.product.name, (i) => i.quantity * Number(i.sellingPrice));

  return {
    totalRevenue: revenue,
    totalCostOfGoodsSold: cost,
    grossProfit: revenue - cost,
    grossMarginPercent: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 10000) / 100 : 0,
    ordersCount: new Set(items.map((i) => i.order.id)).size,
    revenueByChannel: byChannel,
    revenueByProduct: byProduct,
  };
}

function groupSum<T>(items: T[], keyFn: (item: T) => string, valueFn: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + valueFn(item));
  }
  return [...map.entries()].map(([key, value]) => ({ key, value }));
}

export interface VelocityReportQuery {
  branchId?: string;
  from?: string;
  to?: string;
}

/** FR-REP-02: inventory value at cost, plus best-seller / slow-mover ranking by units sold. */
export async function getInventoryVelocityReport(tenantId: string, query: VelocityReportQuery) {
  const stockWhere: Prisma.StockItemWhereInput = { tenantId, ...(query.branchId ? { branchId: query.branchId } : {}) };
  const stockItems = await prisma.stockItem.findMany({ where: stockWhere, include: { product: true } });

  const inventoryValueByProduct = new Map<string, { productId: string; name: string; onHand: number; value: number }>();
  for (const s of stockItems) {
    const existing = inventoryValueByProduct.get(s.productId) ?? { productId: s.productId, name: s.product.name, onHand: 0, value: 0 };
    existing.onHand += s.onHand;
    existing.value += s.onHand * Number(s.product.costPrice);
    inventoryValueByProduct.set(s.productId, existing);
  }

  const totalInventoryValue = [...inventoryValueByProduct.values()].reduce((sum, p) => sum + p.value, 0);

  const soldItems = await prisma.orderItem.findMany({
    where: {
      tenantId,
      order: {
        tenantId,
        state: OrderState.COMPLETED,
        ...(query.branchId ? { branchId: query.branchId } : {}),
        ...(query.from || query.to
          ? { completedAt: { ...(query.from ? { gte: new Date(query.from) } : {}), ...(query.to ? { lte: new Date(query.to) } : {}) } }
          : {}),
      },
    },
    include: { product: true },
  });

  const unitsSoldByProduct = new Map<string, { productId: string; name: string; unitsSold: number }>();
  for (const item of soldItems) {
    const existing = unitsSoldByProduct.get(item.productId) ?? { productId: item.productId, name: item.product.name, unitsSold: 0 };
    existing.unitsSold += item.quantity;
    unitsSoldByProduct.set(item.productId, existing);
  }

  const ranked = [...unitsSoldByProduct.values()].sort((a, b) => b.unitsSold - a.unitsSold);

  return {
    totalInventoryValue,
    inventoryByProduct: [...inventoryValueByProduct.values()].sort((a, b) => b.value - a.value),
    bestSellers: ranked.slice(0, 10),
    slowMovers: [...inventoryValueByProduct.values()]
      .filter((p) => p.onHand > 0)
      .map((p) => ({ ...p, unitsSold: unitsSoldByProduct.get(p.productId)?.unitsSold ?? 0 }))
      .sort((a, b) => a.unitsSold - b.unitsSold)
      .slice(0, 10),
  };
}

/** FR-REP-03: automated stock alerts — SKUs whose available quantity has fallen to/below its reorder threshold. */
export async function getStockAlerts(tenantId: string, branchId?: string) {
  const stockItems = await prisma.stockItem.findMany({
    where: { tenantId, ...(branchId ? { branchId } : {}) },
    include: { product: true, branch: true },
  });

  return stockItems
    .map((s) => ({
      productId: s.productId,
      productName: s.product.name,
      skuCode: s.product.skuCode,
      branchId: s.branchId,
      branchName: s.branch.name,
      available: s.onHand - s.reserved,
      threshold: s.product.reorderThreshold,
    }))
    .filter((s) => s.available <= s.threshold)
    .sort((a, b) => a.available - b.available);
}
