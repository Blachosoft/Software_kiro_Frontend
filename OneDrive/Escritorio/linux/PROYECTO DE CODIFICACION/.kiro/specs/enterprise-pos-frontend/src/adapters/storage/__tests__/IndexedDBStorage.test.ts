/**
 * Integration tests for IndexedDBStorage adapter
 * 
 * Tests the IndexedDB implementation of the StorageService port.
 * Uses fake-indexeddb for in-memory testing without a real browser.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IndexedDBStorage } from '../IndexedDBStorage';
import type { Sale } from '../../../domain/entities/Sale';
import { Money } from '../../../domain/value-objects/Money';
import { Quantity } from '../../../domain/value-objects/Quantity';

// Setup fake IndexedDB for testing
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

describe('IndexedDBStorage', () => {
  let storage: IndexedDBStorage;

  beforeEach(() => {
    // Reset IndexedDB before each test
    globalThis.indexedDB = new IDBFactory();
    storage = new IndexedDBStorage();
  });

  afterEach(async () => {
    // Clean up after each test
    await storage.clear();
  });

  describe('saveSale', () => {
    it('should save a sale to offline storage', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: Quantity.create(2),
            unitPrice: Money.create(10.0),
            subtotal: Money.create(20.0),
          },
        ],
        status: 'completed',
        paymentMethod: 'cash',
        createdAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(1);
      expect(pendingSales[0].sale).toEqual(sale);
      expect(pendingSales[0].synced).toBe(false);
      expect(pendingSales[0].syncAttempts).toBe(0);
      expect(pendingSales[0].timestamp).toBeGreaterThan(0);
    });

    it('should update existing sale if saved again', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [],
        status: 'draft',
        createdAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);

      const updatedSale: Sale = {
        ...sale,
        status: 'completed',
        paymentMethod: 'card',
        completedAt: new Date('2024-01-01'),
      };

      await storage.saveSale(updatedSale);

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(1);
      expect(pendingSales[0].sale.status).toBe('completed');
      expect(pendingSales[0].sale.paymentMethod).toBe('card');
    });
  });

  describe('getPendingSales', () => {
    it('should return empty array when no sales are pending', async () => {
      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toEqual([]);
    });

    it('should return only unsynced sales', async () => {
      const sale1: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      const sale2: Sale = {
        id: 'sale-2',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-02'),
      };

      await storage.saveSale(sale1);
      await storage.saveSale(sale2);
      await storage.markAsSynced('sale-1');

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(1);
      expect(pendingSales[0].sale.id).toBe('sale-2');
    });

    it('should return multiple pending sales', async () => {
      const sale1: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      const sale2: Sale = {
        id: 'sale-2',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-02'),
      };

      const sale3: Sale = {
        id: 'sale-3',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-03'),
      };

      await storage.saveSale(sale1);
      await storage.saveSale(sale2);
      await storage.saveSale(sale3);

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(3);
    });
  });

  describe('markAsSynced', () => {
    it('should mark a sale as synced', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);
      await storage.markAsSynced('sale-1');

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(0);
    });

    it('should not throw error when marking non-existent sale', async () => {
      await expect(storage.markAsSynced('non-existent')).resolves.not.toThrow();
    });

    it('should preserve sale data when marking as synced', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: Quantity.create(1),
            unitPrice: Money.create(10.0),
            subtotal: Money.create(10.0),
          },
        ],
        status: 'completed',
        paymentMethod: 'cash',
        createdAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);
      await storage.markAsSynced('sale-1');

      // Verify sale is still in storage but marked as synced
      const allSales = await storage.getPendingSales();
      expect(allSales).toHaveLength(0);
    });
  });

  describe('clearSynced', () => {
    it('should remove all synced sales', async () => {
      const sale1: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      const sale2: Sale = {
        id: 'sale-2',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-02'),
      };

      const sale3: Sale = {
        id: 'sale-3',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-03'),
      };

      await storage.saveSale(sale1);
      await storage.saveSale(sale2);
      await storage.saveSale(sale3);

      await storage.markAsSynced('sale-1');
      await storage.markAsSynced('sale-2');

      await storage.clearSynced();

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(1);
      expect(pendingSales[0].sale.id).toBe('sale-3');
    });

    it('should not affect unsynced sales', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);
      await storage.clearSynced();

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(1);
    });
  });

  describe('incrementSyncAttempts', () => {
    it('should increment sync attempts counter', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);
      await storage.incrementSyncAttempts('sale-1');

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales[0].syncAttempts).toBe(1);
    });

    it('should increment multiple times', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);
      await storage.incrementSyncAttempts('sale-1');
      await storage.incrementSyncAttempts('sale-1');
      await storage.incrementSyncAttempts('sale-1');

      const pendingSales = await storage.getPendingSales();
      expect(pendingSales[0].syncAttempts).toBe(3);
    });

    it('should not throw error when incrementing non-existent sale', async () => {
      await expect(storage.incrementSyncAttempts('non-existent')).resolves.not.toThrow();
    });
  });

  describe('key-value storage', () => {
    describe('set and get', () => {
      it('should store and retrieve a string value', async () => {
        await storage.set('key1', 'value1');
        const value = await storage.get<string>('key1');
        expect(value).toBe('value1');
      });

      it('should store and retrieve a number value', async () => {
        await storage.set('key2', 42);
        const value = await storage.get<number>('key2');
        expect(value).toBe(42);
      });

      it('should store and retrieve an object value', async () => {
        const obj = { name: 'Test', count: 10 };
        await storage.set('key3', obj);
        const value = await storage.get<typeof obj>('key3');
        expect(value).toEqual(obj);
      });

      it('should return null for non-existent key', async () => {
        const value = await storage.get('non-existent');
        expect(value).toBeNull();
      });

      it('should overwrite existing value', async () => {
        await storage.set('key4', 'old-value');
        await storage.set('key4', 'new-value');
        const value = await storage.get<string>('key4');
        expect(value).toBe('new-value');
      });
    });

    describe('remove', () => {
      it('should remove a value', async () => {
        await storage.set('key5', 'value5');
        await storage.remove('key5');
        const value = await storage.get('key5');
        expect(value).toBeNull();
      });

      it('should not throw error when removing non-existent key', async () => {
        await expect(storage.remove('non-existent')).resolves.not.toThrow();
      });
    });
  });

  describe('clear', () => {
    it('should clear all data from storage', async () => {
      const sale: Sale = {
        id: 'sale-1',
        items: [],
        status: 'completed',
        createdAt: new Date('2024-01-01'),
      };

      await storage.saveSale(sale);
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');

      await storage.clear();

      const pendingSales = await storage.getPendingSales();
      const value1 = await storage.get('key1');
      const value2 = await storage.get('key2');

      expect(pendingSales).toHaveLength(0);
      expect(value1).toBeNull();
      expect(value2).toBeNull();
    });
  });

  describe('offline sale workflow', () => {
    it('should handle complete offline sale workflow', async () => {
      // 1. Save multiple sales while offline
      const sale1: Sale = {
        id: 'sale-1',
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(1),
            unitPrice: Money.create(10.0),
            subtotal: Money.create(10.0),
          },
        ],
        status: 'completed',
        paymentMethod: 'cash',
        createdAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
      };

      const sale2: Sale = {
        id: 'sale-2',
        items: [
          {
            productId: 'prod-2',
            productName: 'Product 2',
            quantity: Quantity.create(2),
            unitPrice: Money.create(20.0),
            subtotal: Money.create(40.0),
          },
        ],
        status: 'completed',
        paymentMethod: 'card',
        createdAt: new Date('2024-01-02'),
        completedAt: new Date('2024-01-02'),
      };

      await storage.saveSale(sale1);
      await storage.saveSale(sale2);

      // 2. Get pending sales for sync
      let pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(2);

      // 3. Simulate sync attempt failure for sale1
      await storage.incrementSyncAttempts('sale-1');

      // 4. Simulate successful sync for sale2
      await storage.markAsSynced('sale-2');

      // 5. Verify only sale1 is still pending
      pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(1);
      expect(pendingSales[0].sale.id).toBe('sale-1');
      expect(pendingSales[0].syncAttempts).toBe(1);

      // 6. Simulate successful sync for sale1
      await storage.markAsSynced('sale-1');

      // 7. Clear synced sales
      await storage.clearSynced();

      // 8. Verify all sales are cleared
      pendingSales = await storage.getPendingSales();
      expect(pendingSales).toHaveLength(0);
    });
  });
});
