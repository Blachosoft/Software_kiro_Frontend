/**
 * Storage Adapters
 * 
 * Exports all storage adapter implementations.
 */

export { IndexedDBStorage } from './IndexedDBStorage';
export { OfflineSyncQueue } from './OfflineSyncQueue';
export type { SyncConfig, SyncResult } from './OfflineSyncQueue';
export { LocalStorageAdapter, StorageQuotaExceededError } from './LocalStorageAdapter';
export type { UserPreferences } from './LocalStorageAdapter';
