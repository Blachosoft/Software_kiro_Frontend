import { describe, it, expect } from 'vitest';
import { PhoneNumber } from '../PhoneNumber';

describe('PhoneNumber Value Object', () => {
  describe('create', () => {
    it('should create a PhoneNumber with valid format', () => {
      const phone = PhoneNumber.create('1234567890');
      expect(phone.value).toBe('1234567890');
    });

    it('should accept phone with hyphens', () => {
      const phone = PhoneNumber.create('123-456-7890');
      expect(phone.value).toBe('123-456-7890');
    });

    it('should accept phone with spaces', () => {
      const phone = PhoneNumber.create('123 456 7890');
      expect(phone.value).toBe('123 456 7890');
    });

    it('should accept phone with parentheses', () => {
      const phone = PhoneNumber.create('(123) 456-7890');
      expect(phone.value).toBe('(123) 456-7890');
    });

    it('should accept international format with plus', () => {
      const phone = PhoneNumber.create('+1 (123) 456-7890');
      expect(phone.value).toBe('+1 (123) 456-7890');
    });

    it('should trim whitespace', () => {
      const phone = PhoneNumber.create('  1234567890  ');
      expect(phone.value).toBe('1234567890');
    });

    it('should throw error for empty phone number', () => {
      expect(() => PhoneNumber.create('')).toThrow('Phone number cannot be empty');
      expect(() => PhoneNumber.create('   ')).toThrow('Phone number cannot be empty');
    });

    it('should throw error for invalid characters', () => {
      expect(() => PhoneNumber.create('123-456-ABCD')).toThrow('Invalid phone number format');
      expect(() => PhoneNumber.create('123@456#7890')).toThrow('Invalid phone number format');
    });

    it('should throw error for too few digits', () => {
      expect(() => PhoneNumber.create('123456')).toThrow('Phone number must have at least 7 digits');
      expect(() => PhoneNumber.create('12-34-56')).toThrow('Phone number must have at least 7 digits');
    });

    it('should accept minimum valid length (7 digits)', () => {
      const phone = PhoneNumber.create('1234567');
      expect(phone.value).toBe('1234567');
    });

    it('should accept long international numbers', () => {
      const phone = PhoneNumber.create('+44 20 1234 5678');
      expect(phone.value).toBe('+44 20 1234 5678');
    });
  });

  describe('equals', () => {
    it('should return true for equal phone numbers', () => {
      const a = PhoneNumber.create('1234567890');
      const b = PhoneNumber.create('1234567890');
      expect(PhoneNumber.equals(a, b)).toBe(true);
    });

    it('should return false for different phone numbers', () => {
      const a = PhoneNumber.create('1234567890');
      const b = PhoneNumber.create('0987654321');
      expect(PhoneNumber.equals(a, b)).toBe(false);
    });

    it('should return false for same digits but different formatting', () => {
      const a = PhoneNumber.create('1234567890');
      const b = PhoneNumber.create('123-456-7890');
      expect(PhoneNumber.equals(a, b)).toBe(false);
    });
  });

  describe('getDigitsOnly', () => {
    it('should extract only digits from phone number', () => {
      const phone = PhoneNumber.create('(123) 456-7890');
      expect(PhoneNumber.getDigitsOnly(phone)).toBe('1234567890');
    });

    it('should extract digits from international format', () => {
      const phone = PhoneNumber.create('+1 (123) 456-7890');
      expect(PhoneNumber.getDigitsOnly(phone)).toBe('11234567890');
    });

    it('should return digits for plain number', () => {
      const phone = PhoneNumber.create('1234567890');
      expect(PhoneNumber.getDigitsOnly(phone)).toBe('1234567890');
    });
  });

  describe('format', () => {
    it('should format phone number as digits only', () => {
      const phone = PhoneNumber.create('(123) 456-7890');
      expect(PhoneNumber.format(phone)).toBe('1234567890');
    });

    it('should format international number as digits only', () => {
      const phone = PhoneNumber.create('+44 20 1234 5678');
      expect(PhoneNumber.format(phone)).toBe('442012345678');
    });
  });
});
