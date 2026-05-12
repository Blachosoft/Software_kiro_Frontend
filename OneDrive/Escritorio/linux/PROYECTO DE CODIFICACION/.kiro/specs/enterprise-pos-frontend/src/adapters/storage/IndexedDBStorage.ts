/**
 * IndexedDBStorage Adapter
 * 
 * Implements the StorageService port using IndexedDB for offline data persistence.
 * Uses the idb library for promise-based IndexedDB access.
 * 
 * This adapter is part of the infrastructure layer and provides persistent storage
 * for sales when the application is offline.
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Sale } from '../../domain/entities/Sale';
import type { StorageService, OfflineSale } from '../../domain/ports/StorageService';

const DB_NAME = 'pos-offline-storage';
const DB_VERSION = 1;
const SALES_STORE = 'sales';
const KV_STORE = 'keyvalue';

/**
 * IndexedDB implementation of StorageService
 */
export class IndexedDBStorage implements StorageService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB database with required object stores
   */
  private async initDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create sales store for offline sales queue
        // Note: We don't use keyPath because OfflineSale structure has nested sale.id
        if (!db.objectStoreNames.contains(SALES_STORE)) {
          const salesStore = db.createObjectStore(SALES_STORE);
          salesStore.createIndex('by-synced', 'synced');
          salesStore.createIndex('by-timestamp', 'timestamp');
        }

        // Create key-value store for general storage
        if (!db.objectStoreNames.contains(KV_STORE)) {
          db.createObjectStore(KV_STORE);
        }
      },
    });
  }

  /**
   * Saves a sale to offline storage
   * @param sale - The sale to save
   */
  async saveSale(sale: Sale): Promise<void> {
    const db = await this.dbPromise;
    
    const offlineSale: OfflineSale = {
      sale,
      timestamp: Date.now(),
      synced: false,
      syncAttempts: 0,
    };

    // Use sale.id as the key explicitly
    await db.put(SALES_STORE, offlineSale, sale.id);
  }

  /**
   * Gets all pending (unsynced) sales
   * @returns Promise resolving to array of offline sales
   */
  async getPendingSales(): Promise<OfflineSale[]> {
    const db = await this.dbPromise;
    const tx = db.transaction(SALES_STORE, 'readonly');
    const store = tx.objectStore(SALES_STORE);
    
    // Get all sales and filter for unsynced ones
    const allSales = await store.getAll();
    const pendingSales = allSales.filter((sale: OfflineSale) => !sale.synced);
    
    return pendingSales;
  }

  /**
   * Marks a sale as synced
   * @param saleId - The sale ID
   */
  async markAsSynced(saleId: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(SALES_STORE, 'readwrite');
    
    const offlineSale = await tx.store.get(saleId);
    
    if (offlineSale) {
      const updatedSale: OfflineSale = {
        ...offlineSale,
        synced: true,
      };
      await tx.store.put(updatedSale, saleId);
    }
    
    await tx.done;
  }

  /**
   * Clears all synced sales from storage
   */
  async clearSynced(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(SALES_STORE, 'readwrite');
    const store = tx.objectStore(SALES_STORE);
    
    // Get all sales and delete synced ones
    const allKeys = await store.getAllKeys();
    const allSales = await store.getAll();
    
    for (let i = 0; i < allSales.length; i++) {
      if (allSales[i].synced) {
        await store.delete(allKeys[i]);
      }
    }
    
    await tx.done;
  }

  /**
   * Increments sync attempt counter for a sale
   * @param saleId - The sale ID
   */
  async incrementSyncAttempts(saleId: string): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(SALES_STORE, 'readwrite');
    
    const offlineSale = await tx.store.get(saleId);
    
    if (offlineSale) {
      const updatedSale: OfflineSale = {
        ...offlineSale,
        syncAttempts: offlineSale.syncAttempts + 1,
      };
      await tx.store.put(updatedSale, saleId);
    }
    
    await tx.done;
  }

  /**
   * Saves a key-value pair to storage
   * @param key - The storage key
   * @param value - The value to store
   */
  async set(key: string, value: unknown): Promise<void> {
    const db = await this.dbPromise;
    await db.put(KV_STORE, value, key);
  }

  /**
   * Gets a value from storage
   * @param key - The storage key
   * @returns Promise resolving to the value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    const db = await this.dbPromise;
    const value = await db.get(KV_STORE, key);
    return value !== undefined ? (value as T) : null;
  }

  /**
   * Removes a value from storage
   * @param key - The storage key
   */
  async remove(key: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete(KV_STORE, key);
  }

  /**
   * Clears all data from storage
   */
  async clear(): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction([SALES_STORE, KV_STORE], 'readwrite');
    
    await tx.objectStore(SALES_STORE).clear();
    await tx.objectStore(KV_STORE).clear();
    
    await tx.done;
  }
}
