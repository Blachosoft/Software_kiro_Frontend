/**
 * Product Entity
 * 
 * Represents a product in the inventory system.
 * Contains product information, pricing, and stock levels.
 */

import type { Money } from '../value-objects/Money';
import type { Quantity } from '../value-objects/Quantity';

/**
 * Product Entity
 * Represents an item available for sale
 */
export interface Product {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly price: Money;
  readonly stock: Quantity;
  readonly category: string;
  readonly description?: string;
}
