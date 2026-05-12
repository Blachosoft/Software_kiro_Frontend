/**
 * OfflineSyncQueue Adapter
 * 
 * Manages synchronization of offline sales with the backend.
 * Queues sales when offline and syncs them when connection is restored.
 * Implements retry logic with exponential backoff for failed sync attempts.
 * 
 * This adapter coordinates between IndexedDBStorage (for persistence) and
 * SaleRepository (for backend sync).
 */

import type { Sale } from '../../domain/entities/Sale';
import type { SaleRepository } from '../../domain/ports/SaleRepository';
import type { StorageService, OfflineSale } from '../../domain/ports/StorageService';

/**
 * Configuration for sync retry behavior
 */
export interface SyncConfig {
  readonly maxRetries: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

/**
 * Default sync configuration
 */
const DEFAULT_SYNC_CONFIG: SyncConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Result of a sync operation
 */
export interface SyncResult {
  readonly success: boolean;
  readonly syncedCount: number;
  readonly failedCount: number;
  readonly errors: Array<{ saleId: string; error: string }>;
}

/**
 * OfflineSyncQueue manages the synchronization of offline sales
 */
export class OfflineSyncQueue {
  private syncInProgress = false;
  private networkOnline = true;

  constructor(
    private readonly storage: StorageService,
    private readonly saleRepository: SaleRepository,
    private readonly config: SyncConfig = DEFAULT_SYNC_CONFIG
  ) {
    this.initNetworkDetection();
  }

  /**
   * Initialize network status detection
   * Sets up event listeners for online/offline events
   */
  private initNetworkDetection(): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      this.networkOnline = navigator.onLine;

      window.addEventListener('online', () => {
        this.networkOnline = true;
        // Automatically trigger sync when connection is restored
        this.syncPendingSales().catch((error) => {
          console.error('Auto-sync failed after coming online:', error);
        });
      });

      window.addEventListener('offline', () => {
        this.networkOnline = false;
      });
    }
  }

  /**
   * Checks if the network is currently online
   * @returns true if online, false if offline
   */
  isOnline(): boolean {
    return this.networkOnline;
  }

  /**
   * Queues a sale for later synchronization
   * @param sale - The sale to queue
   * @returns Promise resolving when sale is queued
   */
  async queueSale(sale: Sale): Promise<void> {
    await this.storage.saveSale(sale);
  }

  /**
   * Synchronizes all pending sales with the backend
   * Implements retry logic with exponential backoff
   * @returns Promise resolving to sync result
   */
  async syncPendingSales(): Promise<SyncResult> {
    // Prevent concurrent sync operations
    if (this.syncInProgress) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [{ saleId: 'N/A', error: 'Sync already in progress' }],
      };
    }

    // Don't attempt sync if offline
    if (!this.isOnline()) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [{ saleId: 'N/A', error: 'Network is offline' }],
      };
    }

    this.syncInProgress = true;

    try {
      const pendingSales = await this.storage.getPendingSales();

      if (pendingSales.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      const results = await Promise.allSettled(
        pendingSales.map((offlineSale) => this.syncSale(offlineSale))
      );

      let syncedCount = 0;
      let failedCount = 0;
      const errors: Array<{ saleId: string; error: string }> = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          syncedCount++;
        } else {
          failedCount++;
          const saleId = pendingSales[index].sale.id;
          const error =
            result.status === 'rejected'
              ? result.reason?.message || 'Unknown error'
              : 'Sync failed';
          errors.push({ saleId, error });
        }
      });

      // Clean up successfully synced sales
      await this.storage.clearSynced();

      return {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Syncs a single sale with retry logic
   * @param offlineSale - The offline sale to sync
   * @returns Promise resolving to true if successful, false otherwise
   */
  private async syncSale(offlineSale: OfflineSale): Promise<boolean> {
    const { sale, syncAttempts } = offlineSale;

    // Check if max retries exceeded
    if (syncAttempts >= this.config.maxRetries) {
      console.error(
        `Sale ${sale.id} exceeded max retry attempts (${this.config.maxRetries})`
      );
      return false;
    }

    try {
      // Attempt to save to backend
      await this.saleRepository.save(sale);

      // Mark as synced in storage
      await this.storage.markAsSynced(sale.id);

      return true;
    } catch (error) {
      // Increment sync attempts
      await this.storage.incrementSyncAttempts(sale.id);

      // Calculate delay for next retry using exponential backoff
      const delay = Math.min(
        this.config.initialDelayMs *
          Math.pow(this.config.backoffMultiplier, syncAttempts),
        this.config.maxDelayMs
      );

      console.warn(
        `Failed to sync sale ${sale.id} (attempt ${syncAttempts + 1}/${
          this.config.maxRetries
        }). Will retry in ${delay}ms. Error:`,
        error
      );

      // Wait before retrying
      await this.sleep(delay);

      // Retry by recursively calling syncSale with updated attempt count
      const updatedOfflineSale: OfflineSale = {
        ...offlineSale,
        syncAttempts: syncAttempts + 1,
      };

      return this.syncSale(updatedOfflineSale);
    }
  }

  /**
   * Helper method to sleep for a specified duration
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gets the count of pending sales
   * @returns Promise resolving to the number of pending sales
   */
  async getPendingCount(): Promise<number> {
    const pendingSales = await this.storage.getPendingSales();
    return pendingSales.length;
  }

  /**
   * Checks if sync is currently in progress
   * @returns true if sync is in progress, false otherwise
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Manually triggers a sync operation
   * Useful for user-initiated sync or periodic background sync
   * @returns Promise resolving to sync result
   */
  async triggerSync(): Promise<SyncResult> {
    return this.syncPendingSales();
  }
}
