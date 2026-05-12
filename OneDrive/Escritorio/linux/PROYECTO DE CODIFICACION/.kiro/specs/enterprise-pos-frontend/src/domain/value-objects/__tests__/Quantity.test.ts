import { describe, it, expect } from 'vitest';
import { Quantity } from '../Quantity';

describe('Quantity Value Object', () => {
  describe('create', () => {
    it('should create a Quantity value with valid integer', () => {
      const quantity = Quantity.create(10);
      expect(quantity.value).toBe(10);
    });

    it('should allow zero quantity', () => {
      const quantity = Quantity.create(0);
      expect(quantity.value).toBe(0);
    });

    it('should throw error for negative value', () => {
      expect(() => Quantity.create(-5)).toThrow('Quantity cannot be negative');
    });

    it('should throw error for non-integer value', () => {
      expect(() => Quantity.create(10.5)).toThrow('Quantity must be an integer');
      expect(() => Quantity.create(3.14)).toThrow('Quantity must be an integer');
    });

    it('should accept large integers', () => {
      const quantity = Quantity.create(1000000);
      expect(quantity.value).toBe(1000000);
    });
  });

  describe('add', () => {
    it('should add two Quantity values', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(5);
      const result = Quantity.add(a, b);
      expect(result.value).toBe(15);
    });

    it('should handle adding zero', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(0);
      const result = Quantity.add(a, b);
      expect(result.value).toBe(10);
    });

    it('should add multiple quantities correctly', () => {
      const a = Quantity.create(5);
      const b = Quantity.create(10);
      const c = Quantity.create(15);
      const result = Quantity.add(Quantity.add(a, b), c);
      expect(result.value).toBe(30);
    });
  });

  describe('subtract', () => {
    it('should subtract two Quantity values', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(3);
      const result = Quantity.subtract(a, b);
      expect(result.value).toBe(7);
    });

    it('should allow subtracting to zero', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(10);
      const result = Quantity.subtract(a, b);
      expect(result.value).toBe(0);
    });

    it('should throw error when result would be negative', () => {
      const a = Quantity.create(5);
      const b = Quantity.create(10);
      expect(() => Quantity.subtract(a, b)).toThrow('Quantity cannot be negative');
    });

    it('should handle subtracting zero', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(0);
      const result = Quantity.subtract(a, b);
      expect(result.value).toBe(10);
    });
  });

  describe('equals', () => {
    it('should return true for equal Quantity values', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(10);
      expect(Quantity.equals(a, b)).toBe(true);
    });

    it('should return false for different values', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(5);
      expect(Quantity.equals(a, b)).toBe(false);
    });

    it('should return true for zero quantities', () => {
      const a = Quantity.create(0);
      const b = Quantity.create(0);
      expect(Quantity.equals(a, b)).toBe(true);
    });
  });

  describe('compare', () => {
    it('should return -1 when first is less than second', () => {
      const a = Quantity.create(5);
      const b = Quantity.create(10);
      expect(Quantity.compare(a, b)).toBe(-1);
    });

    it('should return 0 when both are equal', () => {
      const a = Quantity.create(10);
      const b = Quantity.create(10);
      expect(Quantity.compare(a, b)).toBe(0);
    });

    it('should return 1 when first is greater than second', () => {
      const a = Quantity.create(15);
      const b = Quantity.create(10);
      expect(Quantity.compare(a, b)).toBe(1);
    });
  });

  describe('isZero', () => {
    it('should return true for zero quantity', () => {
      const quantity = Quantity.create(0);
      expect(Quantity.isZero(quantity)).toBe(true);
    });

    it('should return false for non-zero quantity', () => {
      const quantity = Quantity.create(5);
      expect(Quantity.isZero(quantity)).toBe(false);
    });
  });

  describe('isSufficient', () => {
    it('should return true when available is greater than required', () => {
      const available = Quantity.create(10);
      const required = Quantity.create(5);
      expect(Quantity.isSufficient(available, required)).toBe(true);
    });

    it('should return true when available equals required', () => {
      const available = Quantity.create(10);
      const required = Quantity.create(10);
      expect(Quantity.isSufficient(available, required)).toBe(true);
    });

    it('should return false when available is less than required', () => {
      const available = Quantity.create(5);
      const required = Quantity.create(10);
      expect(Quantity.isSufficient(available, required)).toBe(false);
    });

    it('should handle zero quantities', () => {
      const available = Quantity.create(0);
      const required = Quantity.create(0);
      expect(Quantity.isSufficient(available, required)).toBe(true);
    });
  });
});
