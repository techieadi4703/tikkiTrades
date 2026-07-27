import { describe, it, expect } from 'vitest';
import { calculatePositionMath, shouldTriggerAlert } from './portfolio-math';

describe('calculatePositionMath', () => {
  it('should calculate math for a profitable position correctly', () => {
    const res = calculatePositionMath({
      currentPrice: 150,
      previousClose: 145,
      shares: 10,
      averagePrice: 100,
    });
    expect(res.totalValue).toBe(1500);
    expect(res.totalCost).toBe(1000);
    expect(res.unrealizedPnL).toBe(500);
    expect(res.unrealizedPnLPercent).toBe(50);
    expect(res.dailyChange).toBe(50); // (150 - 145) * 10 = 50
    expect(res.dailyChangePercent).toBeCloseTo(3.448, 3); // ((150 - 145) / 145) * 100
  });

  it('should calculate math for a losing position correctly', () => {
    const res = calculatePositionMath({
      currentPrice: 80,
      previousClose: 90,
      shares: 10,
      averagePrice: 100,
    });
    expect(res.totalValue).toBe(800);
    expect(res.totalCost).toBe(1000);
    expect(res.unrealizedPnL).toBe(-200);
    expect(res.unrealizedPnLPercent).toBe(-20);
    expect(res.dailyChange).toBe(-100); // (80 - 90) * 10 = -100
    expect(res.dailyChangePercent).toBeCloseTo(-11.11, 2);
  });

  it('should calculate math for a break-even position correctly', () => {
    const res = calculatePositionMath({
      currentPrice: 100,
      previousClose: 100,
      shares: 10,
      averagePrice: 100,
    });
    expect(res.unrealizedPnL).toBe(0);
    expect(res.unrealizedPnLPercent).toBe(0);
    expect(res.dailyChange).toBe(0);
    expect(res.dailyChangePercent).toBe(0);
  });

  it('should handle zero cost basis (averagePrice = 0) division gracefully', () => {
    const res = calculatePositionMath({
      currentPrice: 100,
      previousClose: 100,
      shares: 10,
      averagePrice: 0,
    });
    expect(res.unrealizedPnLPercent).toBe(0);
  });
});

describe('shouldTriggerAlert', () => {
  describe('above condition', () => {
    it('should trigger when current price is above target', () => {
      expect(shouldTriggerAlert('above', 105, 100)).toBe(true);
    });

    it('should trigger when current price equals target', () => {
      expect(shouldTriggerAlert('above', 100, 100)).toBe(true);
    });

    it('should not trigger when current price is below target', () => {
      expect(shouldTriggerAlert('above', 95, 100)).toBe(false);
    });
  });

  describe('below condition', () => {
    it('should trigger when current price is below target', () => {
      expect(shouldTriggerAlert('below', 95, 100)).toBe(true);
    });

    it('should trigger when current price equals target', () => {
      expect(shouldTriggerAlert('below', 100, 100)).toBe(true);
    });

    it('should not trigger when current price is above target', () => {
      expect(shouldTriggerAlert('below', 105, 100)).toBe(false);
    });
  });
});
