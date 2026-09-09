import { calculateWeightedAverageCost } from '../../src/domain/cogs';

describe('calculateWeightedAverageCost (FR-COST-01)', () => {
  it('computes the weighted average of old stock and the new import', () => {
    // (10*100 + 10*200) / 20 = 150
    expect(calculateWeightedAverageCost(10, 100, 10, 200)).toBe(150);
  });

  it('returns the import price when there was no previous stock', () => {
    expect(calculateWeightedAverageCost(0, 0, 5, 80000)).toBe(80000);
  });

  it('rounds to 2 decimal places', () => {
    // (3*100 + 7*133.333...) / 10 = 123.33...
    expect(calculateWeightedAverageCost(3, 100, 7, 133.33)).toBeCloseTo(123.33, 2);
  });

  it('rejects a non-positive import quantity', () => {
    expect(() => calculateWeightedAverageCost(10, 100, 0, 100)).toThrow();
    expect(() => calculateWeightedAverageCost(10, 100, -1, 100)).toThrow();
  });

  it('rejects a negative import price', () => {
    expect(() => calculateWeightedAverageCost(10, 100, 5, -1)).toThrow();
  });
});
