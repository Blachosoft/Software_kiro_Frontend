import { describe, it, expect } from 'vitest';
import {
  calculateItemSubtotal,
  calculateSaleTotal,
  calculateTotalItems,
  hasItems,
  findItemByProductId,
  containsProduct,
} from '../saleCalculations';
import { Money } from '../../value-objects/Money';
import { Quantity } from '../../value-objects/Quantity';
import type { Sale, SaleItem } from '../../entities/Sale';

// Helper function to create a test sale item
function createTestItem(
  productId: string,
  quantity: number,
  unitPrice: number,
  currency: string = 'USD'
): SaleItem {
  const qty = Quantity.create(quantity);
  const price = Money.create(unitPrice, currency);
  const subtotal = Money.multiply(price, quantity);

  return {
    productId,
    productName: `Product ${productId}`,
    quantity: qty,
    unitPrice: price,
    subtotal,
  };
}

// Helper function to create a test sale
function createTestSale(items: SaleItem[]): Sale {
  return {
    id: 'test-sale-1',
    items,
    status: 'draft',
    createdAt: new Date(),
  };
}

describe('Sale Calculation Functions', () => {
  describe('calculateItemSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      const unitPrice = Money.create(10, 'USD');
      const quantity = Quantity.create(5);
      const subtotal = calculateItemSubtotal(unitPrice, quantity);

      expect(subtotal.amount).toBe(50);
      expect(subtotal.currency).toBe('USD');
    });

    it('should handle quantity of 1', () => {
      const unitPrice = Money.create(25.5, 'USD');
      const quantity = Quantity.create(1);
      const subtotal = calculateItemSubtotal(unitPrice, quantity);

      expect(subtotal.amount).toBe(25.5);
    });

    it('should handle zero quantity', () => {
      const unitPrice = Money.create(10, 'USD');
      const quantity = Quantity.create(0);
      const subtotal = calculateItemSubtotal(unitPrice, quantity);

      expect(subtotal.amount).toBe(0);
    });

    it('should handle decimal prices', () => {
      const unitPrice = Money.create(9.99, 'USD');
      const quantity = Quantity.create(3);
      const subtotal = calculateItemSubtotal(unitPrice, quantity);

      expect(subtotal.amount).toBeCloseTo(29.97, 2);
    });
  });

  describe('calculateSaleTotal', () => {
    it('should calculate total for sale with one item', () => {
      const item = createTestItem('prod-1', 2, 10);
      const sale = createTestSale([item]);
      const total = calculateSaleTotal(sale);

      expect(total.amount).toBe(20);
      expect(total.currency).toBe('USD');
    });

    it('should calculate total for sale with multiple items', () => {
      const items = [
        createTestItem('prod-1', 2, 10), // 20
        createTestItem('prod-2', 1, 15), // 15
        createTestItem('prod-3', 3, 5), // 15
      ];
      const sale = createTestSale(items);
      const total = calculateSaleTotal(sale);

      expect(total.amount).toBe(50);
    });

    it('should return zero for empty sale', () => {
      const sale = createTestSale([]);
      const total = calculateSaleTotal(sale);

      expect(total.amount).toBe(0);
    });

    it('should handle sale with zero-value items', () => {
      const items = [
        createTestItem('prod-1', 0, 10), // 0
        createTestItem('prod-2', 2, 0), // 0
      ];
      const sale = createTestSale(items);
      const total = calculateSaleTotal(sale);

      expect(total.amount).toBe(0);
    });

    it('should throw error for items with different currencies', () => {
      const items = [
        createTestItem('prod-1', 2, 10, 'USD'),
        createTestItem('prod-2', 1, 15, 'EUR'),
      ];
      const sale = createTestSale(items);

      expect(() => calculateSaleTotal(sale)).toThrow('Currency mismatch');
    });
  });

  describe('calculateTotalItems', () => {
    it('should calculate total number of items', () => {
      const items = [
        createTestItem('prod-1', 2, 10),
        createTestItem('prod-2', 3, 15),
        createTestItem('prod-3', 1, 5),
      ];
      const sale = createTestSale(items);
      const totalItems = calculateTotalItems(sale);

      expect(totalItems).toBe(6);
    });

    it('should return zero for empty sale', () => {
      const sale = createTestSale([]);
      const totalItems = calculateTotalItems(sale);

      expect(totalItems).toBe(0);
    });

    it('should handle sale with zero quantity items', () => {
      const items = [
        createTestItem('prod-1', 0, 10),
        createTestItem('prod-2', 5, 15),
      ];
      const sale = createTestSale(items);
      const totalItems = calculateTotalItems(sale);

      expect(totalItems).toBe(5);
    });
  });

  describe('hasItems', () => {
    it('should return true for sale with items', () => {
      const item = createTestItem('prod-1', 1, 10);
      const sale = createTestSale([item]);

      expect(hasItems(sale)).toBe(true);
    });

    it('should return false for empty sale', () => {
      const sale = createTestSale([]);

      expect(hasItems(sale)).toBe(false);
    });
  });

  describe('findItemByProductId', () => {
    it('should find item by product ID', () => {
      const items = [
        createTestItem('prod-1', 2, 10),
        createTestItem('prod-2', 1, 15),
        createTestItem('prod-3', 3, 5),
      ];
      const sale = createTestSale(items);
      const item = findItemByProductId(sale, 'prod-2');

      expect(item).toBeDefined();
      expect(item?.productId).toBe('prod-2');
      expect(item?.quantity.value).toBe(1);
    });

    it('should return undefined for non-existent product', () => {
      const items = [createTestItem('prod-1', 2, 10)];
      const sale = createTestSale(items);
      const item = findItemByProductId(sale, 'prod-999');

      expect(item).toBeUndefined();
    });

    it('should return undefined for empty sale', () => {
      const sale = createTestSale([]);
      const item = findItemByProductId(sale, 'prod-1');

      expect(item).toBeUndefined();
    });
  });

  describe('containsProduct', () => {
    it('should return true if sale contains product', () => {
      const items = [
        createTestItem('prod-1', 2, 10),
        createTestItem('prod-2', 1, 15),
      ];
      const sale = createTestSale(items);

      expect(containsProduct(sale, 'prod-1')).toBe(true);
      expect(containsProduct(sale, 'prod-2')).toBe(true);
    });

    it('should return false if sale does not contain product', () => {
      const items = [createTestItem('prod-1', 2, 10)];
      const sale = createTestSale(items);

      expect(containsProduct(sale, 'prod-999')).toBe(false);
    });

    it('should return false for empty sale', () => {
      const sale = createTestSale([]);

      expect(containsProduct(sale, 'prod-1')).toBe(false);
    });
  });
});
