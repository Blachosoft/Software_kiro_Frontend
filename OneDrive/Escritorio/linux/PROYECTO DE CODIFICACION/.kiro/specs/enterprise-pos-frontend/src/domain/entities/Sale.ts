/**
 * Sale Entity
 * 
 * Represents a sales transaction in the POS system.
 * Contains items, customer information, payment details, and status.
 */

import type { Money } from '../value-objects/Money';
import type { Quantity } from '../value-objects/Quantity';

/**
 * Sale status type
 * - draft: Sale is being created/modified
 * - completed: Sale has been finalized
 * - cancelled: Sale was cancelled
 */
export type SaleStatus = 'draft' | 'completed' | 'cancelled';

/**
 * Payment method type
 * - cash: Cash payment
 * - card: Credit/debit card payment
 * - transfer: Bank transfer payment
 */
export type PaymentMethod = 'cash' | 'card' | 'transfer';

/**
 * Sale Item
 * Represents a single product line in a sale
 */
export interface SaleItem {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: Quantity;
  readonly unitPrice: Money;
  readonly subtotal: Money;
}

/**
 * Sale Entity
 * Main aggregate for sales transactions
 */
export interface Sale {
  readonly id: string;
  readonly items: SaleItem[];
  readonly customerId?: string;
  readonly status: SaleStatus;
  readonly paymentMethod?: PaymentMethod;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}
