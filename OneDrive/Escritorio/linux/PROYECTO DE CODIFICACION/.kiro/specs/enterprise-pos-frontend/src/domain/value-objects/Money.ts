/**
 * Money Value Object
 * 
 * Represents a monetary amount with currency.
 * Immutable value object following domain-driven design principles.
 * 
 * Invariants:
 * - Amount cannot be negative
 * - Currency must be a valid ISO 4217 code (simplified to 3-letter string)
 * - Operations between different currencies are not allowed
 */

export interface Money {
  readonly amount: number;
  readonly currency: string;
}

/**
 * Creates a Money value object
 * @param amount - The monetary amount (must be non-negative)
 * @param currency - The currency code (default: 'USD')
 * @returns A Money value object
 * @throws Error if amount is negative
 */
function create(amount: number, currency: string = 'USD'): Money {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  if (!currency || currency.length !== 3) {
    throw new Error('Currency must be a valid 3-letter code');
  }
  return { amount, currency };
}

/**
 * Adds two Money values
 * @param a - First Money value
 * @param b - Second Money value
 * @returns A new Money value with the sum
 * @throws Error if currencies don't match
 */
function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error('Currency mismatch: cannot add different currencies');
  }
  return create(a.amount + b.amount, a.currency);
}

/**
 * Multiplies a Money value by a factor
 * @param money - The Money value to multiply
 * @param factor - The multiplication factor
 * @returns A new Money value with the product
 */
function multiply(money: Money, factor: number): Money {
  return create(money.amount * factor, money.currency);
}

/**
 * Checks if two Money values are equal
 * @param a - First Money value
 * @param b - Second Money value
 * @returns true if both amount and currency are equal
 */
function equals(a: Money, b: Money): boolean {
  return a.amount === b.amount && a.currency === b.currency;
}

/**
 * Subtracts one Money value from another
 * @param a - The Money value to subtract from
 * @param b - The Money value to subtract
 * @returns A new Money value with the difference
 * @throws Error if currencies don't match or result would be negative
 */
function subtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error('Currency mismatch: cannot subtract different currencies');
  }
  return create(a.amount - b.amount, a.currency);
}

/**
 * Compares two Money values
 * @param a - First Money value
 * @param b - Second Money value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 * @throws Error if currencies don't match
 */
function compare(a: Money, b: Money): number {
  if (a.currency !== b.currency) {
    throw new Error('Currency mismatch: cannot compare different currencies');
  }
  if (a.amount < b.amount) return -1;
  if (a.amount > b.amount) return 1;
  return 0;
}

/**
 * Formats Money value as a string
 * @param money - The Money value to format
 * @returns Formatted string (e.g., "USD 100.00")
 */
function format(money: Money): string {
  return `${money.currency} ${money.amount.toFixed(2)}`;
}

export const Money = {
  create,
  add,
  multiply,
  equals,
  subtract,
  compare,
  format,
};
