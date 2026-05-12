'use client';

/**
 * OfflineContext - React Context for Offline/Network State Management
 * 
 * Provides offline state management using React Context and useReducer.
 * Manages network status and pending sync operations.
 * Includes network status listeners and automatic sync triggering.
 * 
 * **Validates: Requirements 20.1, 20.5**
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

/**
 * Pending Sync Operation
 * Represents an operation that needs to be synced when online
 */
export interface PendingSync {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  retryCount: number;
  lastError?: string;
}

/**
 * OfflineState Interface
 * Represents the complete offline/network state
 */
export interface OfflineState {
  isOnline: boolean;
  pendingSyncs: PendingSync[];
  isSyncing: boolean;
  lastSyncAttempt: Date | null;
  syncError: string | null;
}

/**
 * OfflineAction Union Type
 * All possible state transitions for offline management
 */
export type OfflineAction =
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'ADD_PENDING_SYNC'; payload: PendingSync }
  | { type: 'REMOVE_PENDING_SYNC'; payload: { id: string } }
  | { type: 'UPDATE_PENDING_SYNC'; payload: { id: string; updates: Partial<PendingSync> } }
  | { type: 'CLEAR_PENDING_SYNCS' }
  | { type: 'START_SYNC' }
  | { type: 'SYNC_SUCCESS'; payload: { syncedIds: string[] } }
  | { type: 'SYNC_FAILURE'; payload: { error: string } }
  | { type: 'INCREMENT_RETRY_COUNT'; payload: { id: string } };

/**
 * Initial State
 */
const initialState: OfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncs: [],
  isSyncing: false,
  lastSyncAttempt: null,
  syncError: null,
};

/**
 * Offline Reducer
 * Handles all offline state transitions
 */
export function offlineReducer(state: OfflineState, action: OfflineAction): OfflineState {
  switch (action.type) {
    case 'SET_ONLINE':
      return {
        ...state,
        isOnline: action.payload,
        // Clear sync error when coming back online
        syncError: action.payload ? null : state.syncError,
      };

    case 'ADD_PENDING_SYNC':
      return {
        ...state,
        pendingSyncs: [...state.pendingSyncs, action.payload],
      };

    case 'REMOVE_PENDING_SYNC':
      return {
        ...state,
        pendingSyncs: state.pendingSyncs.filter((sync) => sync.id !== action.payload.id),
      };

    case 'UPDATE_PENDING_SYNC':
      return {
        ...state,
        pendingSyncs: state.pendingSyncs.map((sync) =>
          sync.id === action.payload.id ? { ...sync, ...action.payload.updates } : sync
        ),
      };

    case 'CLEAR_PENDING_SYNCS':
      return {
        ...state,
        pendingSyncs: [],
      };

    case 'START_SYNC':
      return {
        ...state,
        isSyncing: true,
        lastSyncAttempt: new Date(),
        syncError: null,
      };

    case 'SYNC_SUCCESS':
      return {
        ...state,
        isSyncing: false,
        pendingSyncs: state.pendingSyncs.filter(
          (sync) => !action.payload.syncedIds.includes(sync.id)
        ),
        syncError: null,
      };

    case 'SYNC_FAILURE':
      return {
        ...state,
        isSyncing: false,
        syncError: action.payload.error,
      };

    case 'INCREMENT_RETRY_COUNT':
      return {
        ...state,
        pendingSyncs: state.pendingSyncs.map((sync) =>
          sync.id === action.payload.id ? { ...sync, retryCount: sync.retryCount + 1 } : sync
        ),
      };

    default:
      return state;
  }
}

/**
 * OfflineContext
 */
export interface OfflineContextValue {
  state: OfflineState;
  dispatch: React.Dispatch<OfflineAction>;
  addPendingSync: (type: string, payload: any) => string;
  removePendingSync: (id: string) => void;
  clearPendingSyncs: () => void;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

/**
 * OfflineProvider Component
 * Provides offline state to the component tree
 * Handles network status listeners and automatic sync triggering
 */
export interface OfflineProviderProps {
  children: ReactNode;
  initialState?: Partial<OfflineState>;
  onSync?: (pendingSyncs: PendingSync[]) => Promise<string[]>;
  autoSync?: boolean;
}

export function OfflineProvider({
  children,
  initialState: customInitialState,
  onSync,
  autoSync = true,
}: OfflineProviderProps) {
  const [state, dispatch] = useReducer(
    offlineReducer,
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE', payload: true });
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE', payload: false });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial online status
    dispatch({ type: 'SET_ONLINE', payload: navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (autoSync && state.isOnline && state.pendingSyncs.length > 0 && !state.isSyncing) {
      // Delay sync slightly to ensure connection is stable
      const syncTimeout = setTimeout(() => {
        triggerSync();
      }, 1000);

      return () => clearTimeout(syncTimeout);
    }
  }, [state.isOnline, state.pendingSyncs.length, state.isSyncing, autoSync]);

  /**
   * Add a pending sync operation
   * Returns the generated sync ID
   */
  const addPendingSync = (type: string, payload: any): string => {
    const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pendingSync: PendingSync = {
      id: syncId,
      type,
      payload,
      timestamp: new Date(),
      retryCount: 0,
    };

    dispatch({ type: 'ADD_PENDING_SYNC', payload: pendingSync });
    return syncId;
  };

  /**
   * Remove a pending sync operation
   */
  const removePendingSync = (id: string) => {
    dispatch({ type: 'REMOVE_PENDING_SYNC', payload: { id } });
  };

  /**
   * Clear all pending sync operations
   */
  const clearPendingSyncs = () => {
    dispatch({ type: 'CLEAR_PENDING_SYNCS' });
  };

  /**
   * Trigger sync of pending operations
   */
  const triggerSync = async (): Promise<void> => {
    if (!state.isOnline) {
      return;
    }

    if (state.pendingSyncs.length === 0) {
      return;
    }

    if (state.isSyncing) {
      return;
    }

    dispatch({ type: 'START_SYNC' });

    try {
      if (onSync) {
        // Call the provided sync handler
        const syncedIds = await onSync(state.pendingSyncs);
        dispatch({ type: 'SYNC_SUCCESS', payload: { syncedIds } });
      } else {
        // No sync handler provided, just clear the queue
        const syncedIds = state.pendingSyncs.map((sync) => sync.id);
        dispatch({ type: 'SYNC_SUCCESS', payload: { syncedIds } });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      dispatch({ type: 'SYNC_FAILURE', payload: { error: errorMessage } });

      // Increment retry count for all pending syncs
      state.pendingSyncs.forEach((sync) => {
        dispatch({ type: 'INCREMENT_RETRY_COUNT', payload: { id: sync.id } });
      });
    }
  };

  const contextValue: OfflineContextValue = {
    state,
    dispatch,
    addPendingSync,
    removePendingSync,
    clearPendingSyncs,
    triggerSync,
  };

  return <OfflineContext.Provider value={contextValue}>{children}</OfflineContext.Provider>;
}

/**
 * useOffline Hook
 * Custom hook to access offline context
 */
export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
