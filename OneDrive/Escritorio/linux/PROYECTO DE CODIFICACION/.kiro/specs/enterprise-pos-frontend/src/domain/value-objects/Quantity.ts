/**
 * Quantity Value Object
 * 
 * Represents a quantity of items in inventory or sales.
 * Immutable value object following domain-driven design principles.
 * 
 * Invariants:
 * - Value cannot be negative
 * - Value must be an integer (no fractional quantities)
 */

export interface Quantity {
  readonly value: number;
}

/**
 * Creates a Quantity value object
 * @param value - The quantity value (must be non-negative integer)
 * @returns A Quantity value object
 * @throws Error if value is negative or not an integer
 */
function create(value: number): Quantity {
  if (value < 0) {
    throw new Error('Quantity cannot be negative');
  }
  if (!Number.isInteger(value)) {
    throw new Error('Quantity must be an integer');
  }
  return { value };
}

/**
 * Adds two Quantity values
 * @param a - First Quantity value
 * @param b - Second Quantity value
 * @returns A new Quantity value with the sum
 */
function add(a: Quantity, b: Quantity): Quantity {
  return create(a.value + b.value);
}

/**
 * Subtracts one Quantity value from another
 * @param a - The Quantity value to subtract from
 * @param b - The Quantity value to subtract
 * @returns A new Quantity value with the difference
 * @throws Error if result would be negative
 */
function subtract(a: Quantity, b: Quantity): Quantity {
  return create(a.value - b.value);
}

/**
 * Checks if two Quantity values are equal
 * @param a - First Quantity value
 * @param b - Second Quantity value
 * @returns true if values are equal
 */
function equals(a: Quantity, b: Quantity): boolean {
  return a.value === b.value;
}

/**
 * Compares two Quantity values
 * @param a - First Quantity value
 * @param b - Second Quantity value
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
function compare(a: Quantity, b: Quantity): number {
  if (a.value < b.value) return -1;
  if (a.value > b.value) return 1;
  return 0;
}

/**
 * Checks if quantity is zero
 * @param quantity - The Quantity value to check
 * @returns true if value is zero
 */
function isZero(quantity: Quantity): boolean {
  return quantity.value === 0;
}

/**
 * Checks if quantity is sufficient (greater than or equal to required)
 * @param available - Available quantity
 * @param required - Required quantity
 * @returns true if available >= required
 */
function isSufficient(available: Quantity, required: Quantity): boolean {
  return available.value >= required.value;
}

export const Quantity = {
  create,
  add,
  subtract,
  equals,
  compare,
  isZero,
  isSufficient,
};
