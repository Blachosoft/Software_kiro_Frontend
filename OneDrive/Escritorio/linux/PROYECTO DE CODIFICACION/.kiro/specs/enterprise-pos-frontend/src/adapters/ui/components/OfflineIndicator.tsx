/**
 * OfflineIndicator Component
 * 
 * Displays network status and pending sync operations.
 * Shows when the application is offline and syncing status.
 * 
 * **Validates: Requirements 20.1, 20.5**
 */

'use client';

import { useOffline } from '../context/OfflineContext';

export function OfflineIndicator() {
  const { state } = useOffline();

  if (state.isOnline && state.pendingSyncs.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50"
    >
      {!state.isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <div>
            <p className="font-semibold">Offline</p>
            <p className="text-sm">
              Changes will be synced when connection is restored
            </p>
          </div>
        </div>
      )}

      {state.isSyncing && (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 mt-2">
          <svg
            className="animate-spin w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <div>
            <p className="font-semibold">Syncing...</p>
            <p className="text-sm">
              {state.pendingSyncs.length} pending operations
            </p>
          </div>
        </div>
      )}

      {state.syncError && (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 mt-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-semibold">Sync Failed</p>
            <p className="text-sm">{state.syncError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
