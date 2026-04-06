import { describe, it, expect } from 'vitest';
import { calcPayment, calcMinDownPayment, THRESHOLDS } from './mortgage';

describe('Mortgage Formulas', () => {
  describe('calcPayment', () => {
    it('calculates 0 interest payment correctly', () => {
      // 100k, 0%, 10 periods = 10k per period
      const payment = calcPayment(100000, 0, 10);
      expect(payment).toBe(10000);
    });

    it('calculates basic amortized payment correctly', () => {
      // 100k, 5% annual (0.05/12 monthly), 25 years (300 months)
      const p = calcPayment(100000, 0.05 / 12, 300);
      // Math: ~584.59
      expect(p).toBeCloseTo(584.59, 2);
    });
  });

  describe('calcMinDownPayment', () => {
    it('calculates 5% for properties under 500k', () => {
      expect(calcMinDownPayment(400000)).toBe(20000); // 400k * 0.05
    });

    it('calculates tiered rate for properties 500k-1M', () => {
      // 5% on 500k (25k) + 10% on next 100k (10k) = 35k
      expect(calcMinDownPayment(600000)).toBe(35000);
    });

    it('calculates 20% for properties 1M+', () => {
      expect(calcMinDownPayment(1000000)).toBe(200000);
      expect(calcMinDownPayment(1500000)).toBe(300000);
    });
  });

  describe('THRESHOLDS', () => {
    it('has correct standard values', () => {
      expect(THRESHOLDS.BUY_HOUSING_RATIO).toBe(0.35);
      expect(THRESHOLDS.BUY_TOTAL_RATIO).toBe(0.45);
      expect(THRESHOLDS.CAUTION_HOUSING_RATIO).toBe(0.4);
      expect(THRESHOLDS.CAUTION_TOTAL_RATIO).toBe(0.5);
    });
  });
});
