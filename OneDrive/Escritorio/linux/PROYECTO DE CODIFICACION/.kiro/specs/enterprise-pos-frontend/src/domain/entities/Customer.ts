/**
 * Customer Entity
 * 
 * Represents a customer in the POS system.
 * Contains customer contact information and purchase history.
 */

import type { Email } from '../value-objects/Email';
import type { PhoneNumber } from '../value-objects/PhoneNumber';
import type { Money } from '../value-objects/Money';

/**
 * Customer Entity
 * Represents a registered customer
 */
export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email?: Email;
  readonly phone?: PhoneNumber;
  readonly createdAt: Date;
  readonly totalPurchases: Money;
}
