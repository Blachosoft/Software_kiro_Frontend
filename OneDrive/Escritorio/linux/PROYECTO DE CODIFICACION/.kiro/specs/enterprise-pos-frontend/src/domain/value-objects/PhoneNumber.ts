/**
 * PhoneNumber Value Object
 * 
 * Represents a valid phone number.
 * Immutable value object following domain-driven design principles.
 * 
 * Invariants:
 * - Must contain only digits, spaces, hyphens, parentheses, and plus sign
 * - Must have at least 7 digits (minimum valid phone number length)
 * - Cannot be empty
 */

export interface PhoneNumber {
  readonly value: string;
}

// Regex to validate phone number format (allows international format)
const PHONE_REGEX = /^[\d\s\-\(\)\+]+$/;

/**
 * Creates a PhoneNumber value object
 * @param value - The phone number string
 * @returns A PhoneNumber value object
 * @throws Error if phone number format is invalid
 */
function create(value: string): PhoneNumber {
  if (!value || value.trim().length === 0) {
    throw new Error('Phone number cannot be empty');
  }
  
  const trimmedValue = value.trim();
  
  if (!PHONE_REGEX.test(trimmedValue)) {
    throw new Error('Invalid phone number format: only digits, spaces, hyphens, parentheses, and plus sign are allowed');
  }
  
  // Extract only digits to check minimum length
  const digitsOnly = trimmedValue.replace(/\D/g, '');
  
  if (digitsOnly.length < 7) {
    throw new Error('Phone number must have at least 7 digits');
  }
  
  return { value: trimmedValue };
}

/**
 * Checks if two PhoneNumber values are equal
 * @param a - First PhoneNumber value
 * @param b - Second PhoneNumber value
 * @returns true if values are equal
 */
function equals(a: PhoneNumber, b: PhoneNumber): boolean {
  return a.value === b.value;
}

/**
 * Gets only the digits from the phone number
 * @param phone - The PhoneNumber value
 * @returns String containing only digits
 */
function getDigitsOnly(phone: PhoneNumber): string {
  return phone.value.replace(/\D/g, '');
}

/**
 * Formats phone number in a standard way (digits only)
 * @param phone - The PhoneNumber value
 * @returns Formatted phone number with only digits
 */
function format(phone: PhoneNumber): string {
  return getDigitsOnly(phone);
}

export const PhoneNumber = {
  create,
  equals,
  getDigitsOnly,
  format,
};
