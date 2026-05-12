import { describe, it, expect } from 'vitest';
import {
  validateSale,
  validateProduct,
  validateCustomer,
  validateSaleCompletion,
  validateStockAvailability,
  hasContactMethod,
} from '../validation';
import { Money } from '../../value-objects/Money';
import { Quantity } from '../../value-objects/Quantity';
import { Email } from '../../value-objects/Email';
import { PhoneNumber } from '../../value-objects/PhoneNumber';
import type { Sale, SaleItem } from '../../entities/Sale';
import type { Product } from '../../entities/Product';
import type { Customer } from '../../entities/Customer';

// Helper functions
function createTestItem(quantity: number = 1, price: number = 10): SaleItem {
  return {
    productId: 'prod-1',
    productName: 'Test Product',
    quantity: Quantity.create(quantity),
    unitPrice: Money.create(price),
    subtotal: Money.create(price * quantity),
  };
}

function createTestSale(items: SaleItem[] = [createTestItem()]): Sale {
  return {
    id: 'sale-1',
    items,
    status: 'draft',
    createdAt: new Date(),
  };
}

function createTestProduct(price: number = 10, stock: number = 100): Product {
  return {
    id: 'prod-1',
    code: 'CODE-001',
    name: 'Test Product',
    price: Money.create(price),
    stock: Quantity.create(stock),
    category: 'Electronics',
  };
}

function createTestCustomer(
  email?: string,
  phone?: string
): Customer {
  return {
    id: 'cust-1',
    name: 'John Doe',
    email: email ? Email.create(email) : undefined,
    phone: phone ? PhoneNumber.create(phone) : undefined,
    createdAt: new Date(),
    totalPurchases: Money.create(0),
  };
}

describe('Domain Validation Functions', () => {
  describe('validateSale', () => {
    it('should validate a valid draft sale', () => {
      const sale = createTestSale();
      const result = validateSale(sale);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid completed sale with payment method', () => {
      const sale: Sale = {
        ...createTestSale(),
        status: 'completed',
        paymentMethod: 'cash',
      };
      const result = validateSale(sale);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for sale without items', () => {
      const sale = createTestSale([]);
      const result = validateSale(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sale must have at least one item');
    });

    it('should fail for completed sale without payment method', () => {
      const sale: Sale = {
        ...createTestSale(),
        status: 'completed',
      };
      const result = validateSale(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Completed sale must have a payment method');
    });

    it('should fail for sale with zero quantity item', () => {
      const item = createTestItem(0, 10);
      const sale = createTestSale([item]);
      const result = validateSale(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('positive quantity'))).toBe(true);
    });

    it('should pass for sale with valid items', () => {
      const items = [createTestItem(1, 10), createTestItem(2, 20)];
      const sale = createTestSale(items);
      const result = validateSale(sale);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateProduct', () => {
    it('should validate a valid product', () => {
      const product = createTestProduct();
      const result = validateProduct(product);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass for product with valid price and stock', () => {
      const product = createTestProduct(10, 100);
      const result = validateProduct(product);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass for product with valid stock', () => {
      const product = createTestProduct(10, 50);
      const result = validateProduct(product);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for product with empty name', () => {
      const product: Product = {
        ...createTestProduct(),
        name: '',
      };
      const result = validateProduct(product);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product name cannot be empty');
    });

    it('should fail for product with empty code', () => {
      const product: Product = {
        ...createTestProduct(),
        code: '',
      };
      const result = validateProduct(product);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product code cannot be empty');
    });

    it('should fail for product with empty category', () => {
      const product: Product = {
        ...createTestProduct(),
        category: '',
      };
      const result = validateProduct(product);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Product category cannot be empty');
    });

    it('should allow product with zero price', () => {
      const product = createTestProduct(0, 100);
      const result = validateProduct(product);

      expect(result.isValid).toBe(true);
    });

    it('should allow product with zero stock', () => {
      const product = createTestProduct(10, 0);
      const result = validateProduct(product);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCustomer', () => {
    it('should validate customer with email', () => {
      const customer = createTestCustomer('john@example.com');
      const result = validateCustomer(customer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate customer with phone', () => {
      const customer = createTestCustomer(undefined, '1234567890');
      const result = validateCustomer(customer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate customer with both email and phone', () => {
      const customer = createTestCustomer('john@example.com', '1234567890');
      const result = validateCustomer(customer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for customer without name', () => {
      const customer: Customer = {
        ...createTestCustomer('john@example.com'),
        name: '',
      };
      const result = validateCustomer(customer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Customer name cannot be empty');
    });

    it('should fail for customer without contact methods', () => {
      const customer = createTestCustomer();
      const result = validateCustomer(customer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Customer must have at least one contact method (email or phone)'
      );
    });

    it('should pass for customer with valid total purchases', () => {
      const customer = createTestCustomer('john@example.com');
      const result = validateCustomer(customer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('hasContactMethod', () => {
    it('should return true if customer has email', () => {
      const customer = createTestCustomer('john@example.com');
      expect(hasContactMethod(customer, 'email')).toBe(true);
    });

    it('should return false if customer does not have email', () => {
      const customer = createTestCustomer(undefined, '1234567890');
      expect(hasContactMethod(customer, 'email')).toBe(false);
    });

    it('should return true if customer has phone', () => {
      const customer = createTestCustomer(undefined, '1234567890');
      expect(hasContactMethod(customer, 'phone')).toBe(true);
    });

    it('should return false if customer does not have phone', () => {
      const customer = createTestCustomer('john@example.com');
      expect(hasContactMethod(customer, 'phone')).toBe(false);
    });
  });

  describe('validateSaleCompletion', () => {
    it('should validate completion of valid draft sale', () => {
      const sale = createTestSale();
      const result = validateSaleCompletion(sale, 'cash');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for non-draft sale', () => {
      const sale: Sale = {
        ...createTestSale(),
        status: 'completed',
      };
      const result = validateSaleCompletion(sale, 'cash');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Only draft sales can be completed');
    });

    it('should fail for sale without items', () => {
      const sale = createTestSale([]);
      const result = validateSaleCompletion(sale, 'cash');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot complete sale without items');
    });

    it('should fail without payment method', () => {
      const sale = createTestSale();
      const result = validateSaleCompletion(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Payment method is required to complete sale');
    });
  });

  describe('validateStockAvailability', () => {
    it('should validate sufficient stock', () => {
      const product = createTestProduct(10, 100);
      const result = validateStockAvailability(product, 50);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate exact stock match', () => {
      const product = createTestProduct(10, 100);
      const result = validateStockAvailability(product, 100);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for insufficient stock', () => {
      const product = createTestProduct(10, 50);
      const result = validateStockAvailability(product, 100);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Insufficient stock'))).toBe(true);
    });

    it('should fail for zero quantity request', () => {
      const product = createTestProduct(10, 100);
      const result = validateStockAvailability(product, 0);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Requested quantity must be positive');
    });

    it('should fail for negative quantity request', () => {
      const product = createTestProduct(10, 100);
      const result = validateStockAvailability(product, -5);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Requested quantity must be positive');
    });
  });
});
