import { describe, it, expect } from 'vitest';
import { Money } from '../Money';

describe('Money Value Object', () => {
  describe('create', () => {
    it('should create a Money value with valid amount and currency', () => {
      const money = Money.create(100, 'USD');
      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    it('should use USD as default currency', () => {
      const money = Money.create(50);
      expect(money.currency).toBe('USD');
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.create(-10, 'USD')).toThrow('Amount cannot be negative');
    });

    it('should throw error for invalid currency code', () => {
      expect(() => Money.create(100, 'US')).toThrow('Currency must be a valid 3-letter code');
      expect(() => Money.create(100, '')).toThrow('Currency must be a valid 3-letter code');
    });

    it('should allow zero amount', () => {
      const money = Money.create(0, 'USD');
      expect(money.amount).toBe(0);
    });
  });

  describe('add', () => {
    it('should add two Money values with same currency', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(50, 'USD');
      const result = Money.add(a, b);
      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when adding different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(50, 'EUR');
      expect(() => Money.add(a, b)).toThrow('Currency mismatch');
    });

    it('should handle adding zero', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(0, 'USD');
      const result = Money.add(a, b);
      expect(result.amount).toBe(100);
    });
  });

  describe('multiply', () => {
    it('should multiply Money by a positive factor', () => {
      const money = Money.create(100, 'USD');
      const result = Money.multiply(money, 2);
      expect(result.amount).toBe(200);
      expect(result.currency).toBe('USD');
    });

    it('should multiply Money by zero', () => {
      const money = Money.create(100, 'USD');
      const result = Money.multiply(money, 0);
      expect(result.amount).toBe(0);
    });

    it('should multiply Money by decimal factor', () => {
      const money = Money.create(100, 'USD');
      const result = Money.multiply(money, 0.5);
      expect(result.amount).toBe(50);
    });

    it('should throw error when multiplying by negative factor results in negative', () => {
      const money = Money.create(100, 'USD');
      expect(() => Money.multiply(money, -1)).toThrow('Amount cannot be negative');
    });
  });

  describe('equals', () => {
    it('should return true for equal Money values', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'USD');
      expect(Money.equals(a, b)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(50, 'USD');
      expect(Money.equals(a, b)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'EUR');
      expect(Money.equals(a, b)).toBe(false);
    });
  });

  describe('subtract', () => {
    it('should subtract two Money values with same currency', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(30, 'USD');
      const result = Money.subtract(a, b);
      expect(result.amount).toBe(70);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when subtracting different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(30, 'EUR');
      expect(() => Money.subtract(a, b)).toThrow('Currency mismatch');
    });

    it('should throw error when result would be negative', () => {
      const a = Money.create(50, 'USD');
      const b = Money.create(100, 'USD');
      expect(() => Money.subtract(a, b)).toThrow('Amount cannot be negative');
    });

    it('should allow subtracting to zero', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'USD');
      const result = Money.subtract(a, b);
      expect(result.amount).toBe(0);
    });
  });

  describe('compare', () => {
    it('should return -1 when first is less than second', () => {
      const a = Money.create(50, 'USD');
      const b = Money.create(100, 'USD');
      expect(Money.compare(a, b)).toBe(-1);
    });

    it('should return 0 when both are equal', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'USD');
      expect(Money.compare(a, b)).toBe(0);
    });

    it('should return 1 when first is greater than second', () => {
      const a = Money.create(150, 'USD');
      const b = Money.create(100, 'USD');
      expect(Money.compare(a, b)).toBe(1);
    });

    it('should throw error when comparing different currencies', () => {
      const a = Money.create(100, 'USD');
      const b = Money.create(100, 'EUR');
      expect(() => Money.compare(a, b)).toThrow('Currency mismatch');
    });
  });

  describe('format', () => {
    it('should format Money as string with 2 decimal places', () => {
      const money = Money.create(100.5, 'USD');
      expect(Money.format(money)).toBe('USD 100.50');
    });

    it('should format zero correctly', () => {
      const money = Money.create(0, 'EUR');
      expect(Money.format(money)).toBe('EUR 0.00');
    });
  });
});
