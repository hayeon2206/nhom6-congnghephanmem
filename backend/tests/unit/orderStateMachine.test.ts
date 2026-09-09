import { canTransition, assertTransition } from '../../src/domain/orderStateMachine';

describe('Order state machine (FR-ORD-02)', () => {
  it('allows the canonical happy path: Draft -> Reserved -> Confirmed -> Completed', () => {
    expect(canTransition('DRAFT', 'RESERVED')).toBe(true);
    expect(canTransition('RESERVED', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'COMPLETED')).toBe(true);
  });

  it('allows cancellation from Draft or Reserved', () => {
    expect(canTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(canTransition('RESERVED', 'CANCELLED')).toBe(true);
  });

  it('rejects cancellation once Confirmed or Completed', () => {
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(false);
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
  });

  it('rejects skipping a step (Draft -> Confirmed)', () => {
    expect(canTransition('DRAFT', 'CONFIRMED')).toBe(false);
  });

  it('rejects any transition out of a terminal state', () => {
    expect(canTransition('COMPLETED', 'RESERVED')).toBe(false);
    expect(canTransition('CANCELLED', 'DRAFT')).toBe(false);
  });

  it('assertTransition throws with a descriptive message on an illegal transition', () => {
    expect(() => assertTransition('DRAFT', 'COMPLETED')).toThrow(/DRAFT/);
  });
});
