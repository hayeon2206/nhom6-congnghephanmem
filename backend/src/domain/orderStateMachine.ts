import { OrderState } from '@prisma/client';

/**
 * FR-ORD-02: Draft -> Reserved -> Confirmed -> Completed (or Cancelled from Draft/Reserved).
 * A pure function so the transition rules can be unit-tested without a database.
 */
const ALLOWED_TRANSITIONS: Record<OrderState, OrderState[]> = {
  DRAFT: ['RESERVED', 'CANCELLED'],
  RESERVED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderState, to: OrderState): void {
  if (!canTransition(from, to)) {
    throw new Error(`Không thể chuyển trạng thái đơn hàng từ ${from} sang ${to}.`);
  }
}
