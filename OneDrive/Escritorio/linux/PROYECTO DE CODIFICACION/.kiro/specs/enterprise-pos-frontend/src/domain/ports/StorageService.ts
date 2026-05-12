/**
 * StorageService Port
 * 
 * Defines the contract for offline data storage.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

import type { Sale } from '../entities/Sale';

/**
 * Offline sale with sync metadata
 */
export interface OfflineSale {
  readonly sale: Sale;
  readonly timestamp: number;
  readonly synced: boolean;
  readonly syncAttempts: number;
}

/**
 * Service interface for offline storage
 * Defines operations for storing and syncing data when offline
 */
export interface StorageService {
  /**
   * Saves a sale to offline storage
   * @param sale - The sale to save
   * @returns Promise resolving when save is complete
   */
  saveSale(sale: Sale): Promise<void>;

  /**
   * Gets all pending (unsynced) sales
   * @returns Promise resolving to array of offline sales
   */
  getPendingSales(): Promise<OfflineSale[]>;

  /**
   * Marks a sale as synced
   * @param saleId - The sale ID
   * @returns Promise resolving when update is complete
   */
  markAsSynced(saleId: string): Promise<void>;

  /**
   * Clears all synced sales from storage
   * @returns Promise resolving when clear is complete
   */
  clearSynced(): Promise<void>;

  /**
   * Increments sync attempt counter for a sale
   * @param saleId - The sale ID
   * @returns Promise resolving when update is complete
   */
  incrementSyncAttempts(saleId: string): Promise<void>;

  /**
   * Saves a key-value pair to storage
   * @param key - The storage key
   * @param value - The value to store
   * @returns Promise resolving when save is complete
   */
  set(key: string, value: unknown): Promise<void>;

  /**
   * Gets a value from storage
   * @param key - The storage key
   * @returns Promise resolving to the value or null if not found
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Removes a value from storage
   * @param key - The storage key
   * @returns Promise resolving when removal is complete
   */
  remove(key: string): Promise<void>;

  /**
   * Clears all data from storage
   * @returns Promise resolving when clear is complete
   */
  clear(): Promise<void>;
}
