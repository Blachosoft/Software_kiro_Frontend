/**
 * Domain Validation Functions
 * 
 * Pure functions for validating domain entities and business rules.
 * These functions have NO side effects and NO framework dependencies.
 */

import type { Sale } from '../entities/Sale';
import type { Product } from '../entities/Product';
import type { Customer } from '../entities/Customer';
import type { Email } from '../value-objects/Email';
import type { PhoneNumber } from '../value-objects/PhoneNumber';

/**
 * Validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
}

/**
 * Creates a successful validation result
 */
export function validationSuccess(): ValidationResult {
  return { isValid: true, errors: [] };
}

/**
 * Creates a failed validation result
 */
export function validationFailure(errors: string[]): ValidationResult {
  return { isValid: false, errors };
}

/**
 * Validates a sale
 * A sale is valid if:
 * - It has at least one item
 * - It has a payment method (if status is 'completed')
 * 
 * @param sale - The sale to validate
 * @returns Validation result
 */
export function validateSale(sale: Sale): ValidationResult {
  const errors: string[] = [];

  // Check if sale has items
  if (sale.items.length === 0) {
    errors.push('Sale must have at least one item');
  }

  // Check payment method for completed sales
  if (sale.status === 'completed' && !sale.paymentMethod) {
    errors.push('Completed sale must have a payment method');
  }

  // Check that all items have positive quantities
  sale.items.forEach((item, index) => {
    if (item.quantity.value <= 0) {
      errors.push(`Item at index ${index} must have positive quantity`);
    }
  });

  // Check that all items have positive prices
  sale.items.forEach((item, index) => {
    if (item.unitPrice.amount < 0) {
      errors.push(`Item at index ${index} must have non-negative price`);
    }
  });

  return errors.length === 0 ? validationSuccess() : validationFailure(errors);
}

/**
 * Validates a product
 * A product is valid if:
 * - Price is non-negative
 * - Stock is non-negative
 * - Name is not empty
 * - Code is not empty
 * 
 * @param product - The product to validate
 * @returns Validation result
 */
export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];

  // Check price
  if (product.price.amount < 0) {
    errors.push('Product price must be non-negative');
  }

  // Check stock
  if (product.stock.value < 0) {
    errors.push('Product stock must be non-negative');
  }

  // Check name
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name cannot be empty');
  }

  // Check code
  if (!product.code || product.code.trim().length === 0) {
    errors.push('Product code cannot be empty');
  }

  // Check category
  if (!product.category || product.category.trim().length === 0) {
    errors.push('Product category cannot be empty');
  }

  return errors.length === 0 ? validationSuccess() : validationFailure(errors);
}

/**
 * Validates a customer
 * A customer is valid if:
 * - Name is not empty
 * - At least one contact method (email or phone) is provided
 * 
 * @param customer - The customer to validate
 * @returns Validation result
 */
export function validateCustomer(customer: Customer): ValidationResult {
  const errors: string[] = [];

  // Check name
  if (!customer.name || customer.name.trim().length === 0) {
    errors.push('Customer name cannot be empty');
  }

  // Check that at least one contact method is provided
  if (!customer.email && !customer.phone) {
    errors.push('Customer must have at least one contact method (email or phone)');
  }

  // Check total purchases is non-negative
  if (customer.totalPurchases.amount < 0) {
    errors.push('Customer total purchases must be non-negative');
  }

  return errors.length === 0 ? validationSuccess() : validationFailure(errors);
}

/**
 * Validates that a customer has a specific contact method
 * @param customer - The customer to check
 * @param contactType - The contact type to check for
 * @returns true if customer has the contact method
 */
export function hasContactMethod(
  customer: Customer,
  contactType: 'email' | 'phone'
): boolean {
  if (contactType === 'email') {
    return customer.email !== undefined;
  }
  return customer.phone !== undefined;
}

/**
 * Validates that a sale can be completed
 * A sale can be completed if:
 * - It is in 'draft' status
 * - It has at least one item
 * - A payment method is provided
 * 
 * @param sale - The sale to validate
 * @param paymentMethod - The payment method to use
 * @returns Validation result
 */
export function validateSaleCompletion(
  sale: Sale,
  paymentMethod?: string
): ValidationResult {
  const errors: string[] = [];

  if (sale.status !== 'draft') {
    errors.push('Only draft sales can be completed');
  }

  if (sale.items.length === 0) {
    errors.push('Cannot complete sale without items');
  }

  if (!paymentMethod) {
    errors.push('Payment method is required to complete sale');
  }

  return errors.length === 0 ? validationSuccess() : validationFailure(errors);
}

/**
 * Validates that a product has sufficient stock
 * @param product - The product to check
 * @param requestedQuantity - The quantity requested
 * @returns Validation result
 */
export function validateStockAvailability(
  product: Product,
  requestedQuantity: number
): ValidationResult {
  const errors: string[] = [];

  if (product.stock.value < requestedQuantity) {
    errors.push(
      `Insufficient stock: available ${product.stock.value}, requested ${requestedQuantity}`
    );
  }

  if (requestedQuantity <= 0) {
    errors.push('Requested quantity must be positive');
  }

  return errors.length === 0 ? validationSuccess() : validationFailure(errors);
}
