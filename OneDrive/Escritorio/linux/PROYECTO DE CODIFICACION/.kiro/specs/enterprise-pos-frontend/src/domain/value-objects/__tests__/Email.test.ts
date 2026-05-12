import { describe, it, expect } from 'vitest';
import { Email } from '../Email';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create an Email with valid format', () => {
      const email = Email.create('user@example.com');
      expect(email.value).toBe('user@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = Email.create('User@Example.COM');
      expect(email.value).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  user@example.com  ');
      expect(email.value).toBe('user@example.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw error for invalid email format - missing @', () => {
      expect(() => Email.create('userexample.com')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - missing domain', () => {
      expect(() => Email.create('user@')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - missing local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - missing TLD', () => {
      expect(() => Email.create('user@example')).toThrow('Invalid email format');
    });

    it('should accept email with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(email.value).toBe('user@mail.example.com');
    });

    it('should accept email with plus sign in local part', () => {
      const email = Email.create('user+tag@example.com');
      expect(email.value).toBe('user+tag@example.com');
    });

    it('should accept email with dots in local part', () => {
      const email = Email.create('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const a = Email.create('user@example.com');
      const b = Email.create('user@example.com');
      expect(Email.equals(a, b)).toBe(true);
    });

    it('should return true for emails with different casing', () => {
      const a = Email.create('User@Example.com');
      const b = Email.create('user@example.com');
      expect(Email.equals(a, b)).toBe(true);
    });

    it('should return false for different emails', () => {
      const a = Email.create('user1@example.com');
      const b = Email.create('user2@example.com');
      expect(Email.equals(a, b)).toBe(false);
    });
  });

  describe('getDomain', () => {
    it('should extract domain from email', () => {
      const email = Email.create('user@example.com');
      expect(Email.getDomain(email)).toBe('example.com');
    });

    it('should extract domain with subdomain', () => {
      const email = Email.create('user@mail.example.com');
      expect(Email.getDomain(email)).toBe('mail.example.com');
    });
  });

  describe('getLocalPart', () => {
    it('should extract local part from email', () => {
      const email = Email.create('user@example.com');
      expect(Email.getLocalPart(email)).toBe('user');
    });

    it('should extract local part with special characters', () => {
      const email = Email.create('user+tag@example.com');
      expect(Email.getLocalPart(email)).toBe('user+tag');
    });
  });
});
