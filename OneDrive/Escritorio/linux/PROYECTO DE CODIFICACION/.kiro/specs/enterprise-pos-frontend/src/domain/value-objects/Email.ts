/**
 * Email Value Object
 * 
 * Represents a valid email address.
 * Immutable value object following domain-driven design principles.
 * 
 * Invariants:
 * - Must be a valid email format
 * - Cannot be empty
 */

export interface Email {
  readonly value: string;
}

// Simple email regex for basic validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Creates an Email value object
 * @param value - The email address string
 * @returns An Email value object
 * @throws Error if email format is invalid
 */
function create(value: string): Email {
  if (!value || value.trim().length === 0) {
    throw new Error('Email cannot be empty');
  }
  
  const trimmedValue = value.trim().toLowerCase();
  
  if (!EMAIL_REGEX.test(trimmedValue)) {
    throw new Error('Invalid email format');
  }
  
  return { value: trimmedValue };
}

/**
 * Checks if two Email values are equal
 * @param a - First Email value
 * @param b - Second Email value
 * @returns true if values are equal (case-insensitive)
 */
function equals(a: Email, b: Email): boolean {
  return a.value === b.value;
}

/**
 * Gets the domain part of the email
 * @param email - The Email value
 * @returns The domain part (e.g., "example.com")
 */
function getDomain(email: Email): string {
  return email.value.split('@')[1];
}

/**
 * Gets the local part of the email (before @)
 * @param email - The Email value
 * @returns The local part (e.g., "user")
 */
function getLocalPart(email: Email): string {
  return email.value.split('@')[0];
}

export const Email = {
  create,
  equals,
  getDomain,
  getLocalPart,
};
