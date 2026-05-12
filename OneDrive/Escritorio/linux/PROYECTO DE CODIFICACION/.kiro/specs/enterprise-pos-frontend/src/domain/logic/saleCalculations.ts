/**
 * Sale Calculation Functions
 * 
 * Pure functions for calculating sale totals and item subtotals.
 * These functions have NO side effects and NO framework dependencies.
 */

import { Money } from '../value-objects/Money';
import { Quantity } from '../value-objects/Quantity';
import type { Sale, SaleItem } from '../entities/Sale';

/**
 * Calculates the subtotal for a sale item (price × quantity)
 * @param unitPrice - The unit price of the product
 * @param quantity - The quantity purchased
 * @returns The subtotal as Money
 */
export function calculateItemSubtotal(unitPrice: Money, quantity: Quantity): Money {
  return Money.multiply(unitPrice, quantity.value);
}

/**
 * Calculates the total for a sale (sum of all item subtotals)
 * @param sale - The sale to calculate total for
 * @returns The total as Money
 * @throws Error if sale has items with different currencies
 */
export function calculateSaleTotal(sale: Sale): Money {
  if (sale.items.length === 0) {
    return Money.create(0);
  }

  return sale.items.reduce((total, item) => {
    return Money.add(total, item.subtotal);
  }, Money.create(0, sale.items[0].subtotal.currency));
}

/**
 * Calculates the total number of items in a sale
 * @param sale - The sale to calculate item count for
 * @returns The total number of items
 */
export function calculateTotalItems(sale: Sale): number {
  return sale.items.reduce((total, item) => {
    return total + item.quantity.value;
  }, 0);
}

/**
 * Checks if a sale has any items
 * @param sale - The sale to check
 * @returns true if sale has at least one item
 */
export function hasItems(sale: Sale): boolean {
  return sale.items.length > 0;
}

/**
 * Finds a sale item by product ID
 * @param sale - The sale to search in
 * @param productId - The product ID to find
 * @returns The sale item or undefined if not found
 */
export function findItemByProductId(sale: Sale, productId: string): SaleItem | undefined {
  return sale.items.find((item) => item.productId === productId);
}

/**
 * Checks if a sale contains a specific product
 * @param sale - The sale to check
 * @param productId - The product ID to check for
 * @returns true if sale contains the product
 */
export function containsProduct(sale: Sale, productId: string): boolean {
  return findItemByProductId(sale, productId) !== undefined;
}
