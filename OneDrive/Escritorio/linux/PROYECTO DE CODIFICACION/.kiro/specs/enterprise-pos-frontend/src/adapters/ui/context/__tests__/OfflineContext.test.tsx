/**
 * OfflineContext Unit Tests
 * 
 * Tests for offline reducer logic and network status management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { offlineReducer, OfflineState, OfflineAction, PendingSync } from '../OfflineContext';

describe('OfflineContext - offlineReducer', () => {
  const mockPendingSync: PendingSync = {
    id: 'sync-1',
    type: 'sale:create',
    payload: { saleId: 'sale-1' },
    timestamp: new Date('2024-01-01'),
    retryCount: 0,
  };

  const initialState: OfflineState = {
    isOnline: true,
    pendingSyncs: [],
    isSyncing: false,
    lastSyncAttempt: null,
    syncError: null,
  };

  describe('SET_ONLINE', () => {
    it('should set online status to true', () => {
      const offlineState: OfflineState = {
        ...initialState,
        isOnline: false,
      };

      const action: OfflineAction = {
        type: 'SET_ONLINE',
        payload: true,
      };

      const newState = offlineReducer(offlineState, action);

      expect(newState.isOnline).toBe(true);
    });

    it('should set online status to false', () => {
      const action: OfflineAction = {
        type: 'SET_ONLINE',
        payload: false,
      };

      const newState = offlineReducer(initialState, action);

      expect(newState.isOnline).toBe(false);
    });

    it('should clear sync error when coming back online', () => {
      const stateWithError: OfflineState = {
        ...initialState,
        isOnline: false,
        syncError: 'Previous sync error',
      };

      const action: OfflineAction = {
        type: 'SET_ONLINE',
        payload: true,
      };

      const newState = offlineReducer(stateWithError, action);

      expect(newState.isOnline).toBe(true);
      expect(newState.syncError).toBeNull();
    });

    it('should preserve sync error when going offline', () => {
      const stateWithError: OfflineState = {
        ...initialState,
        isOnline: true,
        syncError: 'Previous sync error',
      };

      const action: OfflineAction = {
        type: 'SET_ONLINE',
        payload: false,
      };

      const newState = offlineReducer(stateWithError, action);

      expect(newState.isOnline).toBe(false);
      expect(newState.syncError).toBe('Previous sync error');
    });
  });

  describe('ADD_PENDING_SYNC', () => {
    it('should add pending sync to queue', () => {
      const action: OfflineAction = {
        type: 'ADD_PENDING_SYNC',
        payload: mockPendingSync,
      };

      const newState = offlineReducer(initialState, action);

      expect(newState.pendingSyncs).toHaveLength(1);
      expect(newState.pendingSyncs[0]).toEqual(mockPendingSync);
    });

    it('should append to existing queue', () => {
      const stateWithSync: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync],
      };

      const newSync: PendingSync = {
        id: 'sync-2',
        type: 'sale:update',
        payload: { saleId: 'sale-2' },
        timestamp: new Date('2024-01-02'),
        retryCount: 0,
      };

      const action: OfflineAction = {
        type: 'ADD_PENDING_SYNC',
        payload: newSync,
      };

      const newState = offlineReducer(stateWithSync, action);

      expect(newState.pendingSyncs).toHaveLength(2);
      expect(newState.pendingSyncs[1]).toEqual(newSync);
    });
  });

  describe('REMOVE_PENDING_SYNC', () => {
    it('should remove pending sync by id', () => {
      const stateWithSync: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync],
      };

      const action: OfflineAction = {
        type: 'REMOVE_PENDING_SYNC',
        payload: { id: 'sync-1' },
      };

      const newState = offlineReducer(stateWithSync, action);

      expect(newState.pendingSyncs).toHaveLength(0);
    });

    it('should only remove matching sync', () => {
      const sync2: PendingSync = {
        id: 'sync-2',
        type: 'sale:update',
        payload: { saleId: 'sale-2' },
        timestamp: new Date('2024-01-02'),
        retryCount: 0,
      };

      const stateWithSyncs: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync, sync2],
      };

      const action: OfflineAction = {
        type: 'REMOVE_PENDING_SYNC',
        payload: { id: 'sync-1' },
      };

      const newState = offlineReducer(stateWithSyncs, action);

      expect(newState.pendingSyncs).toHaveLength(1);
      expect(newState.pendingSyncs[0].id).toBe('sync-2');
    });
  });

  describe('UPDATE_PENDING_SYNC', () => {
    it('should update pending sync properties', () => {
      const stateWithSync: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync],
      };

      const action: OfflineAction = {
        type: 'UPDATE_PENDING_SYNC',
        payload: {
          id: 'sync-1',
          updates: {
            retryCount: 3,
            lastError: 'Network timeout',
          },
        },
      };

      const newState = offlineReducer(stateWithSync, action);

      expect(newState.pendingSyncs[0].retryCount).toBe(3);
      expect(newState.pendingSyncs[0].lastError).toBe('Network timeout');
    });

    it('should only update matching sync', () => {
      const sync2: PendingSync = {
        id: 'sync-2',
        type: 'sale:update',
        payload: { saleId: 'sale-2' },
        timestamp: new Date('2024-01-02'),
        retryCount: 0,
      };

      const stateWithSyncs: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync, sync2],
      };

      const action: OfflineAction = {
        type: 'UPDATE_PENDING_SYNC',
        payload: {
          id: 'sync-1',
          updates: { retryCount: 5 },
        },
      };

      const newState = offlineReducer(stateWithSyncs, action);

      expect(newState.pendingSyncs[0].retryCount).toBe(5);
      expect(newState.pendingSyncs[1].retryCount).toBe(0);
    });
  });

  describe('CLEAR_PENDING_SYNCS', () => {
    it('should clear all pending syncs', () => {
      const stateWithSyncs: OfflineState = {
        ...initialState,
        pendingSyncs: [
          mockPendingSync,
          {
            id: 'sync-2',
            type: 'sale:update',
            payload: { saleId: 'sale-2' },
            timestamp: new Date('2024-01-02'),
            retryCount: 0,
          },
        ],
      };

      const action: OfflineAction = {
        type: 'CLEAR_PENDING_SYNCS',
      };

      const newState = offlineReducer(stateWithSyncs, action);

      expect(newState.pendingSyncs).toHaveLength(0);
    });
  });

  describe('START_SYNC', () => {
    it('should set syncing state and update last sync attempt', () => {
      const action: OfflineAction = {
        type: 'START_SYNC',
      };

      const newState = offlineReducer(initialState, action);

      expect(newState.isSyncing).toBe(true);
      expect(newState.lastSyncAttempt).toBeInstanceOf(Date);
      expect(newState.syncError).toBeNull();
    });

    it('should clear previous sync error', () => {
      const stateWithError: OfflineState = {
        ...initialState,
        syncError: 'Previous error',
      };

      const action: OfflineAction = {
        type: 'START_SYNC',
      };

      const newState = offlineReducer(stateWithError, action);

      expect(newState.syncError).toBeNull();
    });
  });

  describe('SYNC_SUCCESS', () => {
    it('should remove synced items and stop syncing', () => {
      const sync2: PendingSync = {
        id: 'sync-2',
        type: 'sale:update',
        payload: { saleId: 'sale-2' },
        timestamp: new Date('2024-01-02'),
        retryCount: 0,
      };

      const stateWithSyncs: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync, sync2],
        isSyncing: true,
      };

      const action: OfflineAction = {
        type: 'SYNC_SUCCESS',
        payload: { syncedIds: ['sync-1'] },
      };

      const newState = offlineReducer(stateWithSyncs, action);

      expect(newState.isSyncing).toBe(false);
      expect(newState.pendingSyncs).toHaveLength(1);
      expect(newState.pendingSyncs[0].id).toBe('sync-2');
      expect(newState.syncError).toBeNull();
    });

    it('should clear all syncs if all were synced', () => {
      const stateWithSync: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync],
        isSyncing: true,
      };

      const action: OfflineAction = {
        type: 'SYNC_SUCCESS',
        payload: { syncedIds: ['sync-1'] },
      };

      const newState = offlineReducer(stateWithSync, action);

      expect(newState.pendingSyncs).toHaveLength(0);
    });
  });

  describe('SYNC_FAILURE', () => {
    it('should set error and stop syncing', () => {
      const stateWithSync: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync],
        isSyncing: true,
      };

      const action: OfflineAction = {
        type: 'SYNC_FAILURE',
        payload: { error: 'Network error' },
      };

      const newState = offlineReducer(stateWithSync, action);

      expect(newState.isSyncing).toBe(false);
      expect(newState.syncError).toBe('Network error');
      expect(newState.pendingSyncs).toHaveLength(1); // Syncs remain in queue
    });
  });

  describe('INCREMENT_RETRY_COUNT', () => {
    it('should increment retry count for specific sync', () => {
      const stateWithSync: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync],
      };

      const action: OfflineAction = {
        type: 'INCREMENT_RETRY_COUNT',
        payload: { id: 'sync-1' },
      };

      const newState = offlineReducer(stateWithSync, action);

      expect(newState.pendingSyncs[0].retryCount).toBe(1);
    });

    it('should only increment matching sync', () => {
      const sync2: PendingSync = {
        id: 'sync-2',
        type: 'sale:update',
        payload: { saleId: 'sale-2' },
        timestamp: new Date('2024-01-02'),
        retryCount: 0,
      };

      const stateWithSyncs: OfflineState = {
        ...initialState,
        pendingSyncs: [mockPendingSync, sync2],
      };

      const action: OfflineAction = {
        type: 'INCREMENT_RETRY_COUNT',
        payload: { id: 'sync-1' },
      };

      const newState = offlineReducer(stateWithSyncs, action);

      expect(newState.pendingSyncs[0].retryCount).toBe(1);
      expect(newState.pendingSyncs[1].retryCount).toBe(0);
    });
  });
});
