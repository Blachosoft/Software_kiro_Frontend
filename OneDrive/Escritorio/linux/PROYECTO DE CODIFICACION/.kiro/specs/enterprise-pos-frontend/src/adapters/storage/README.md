# Storage Adapters

This directory contains storage adapter implementations for the POS frontend application.

## LocalStorageAdapter

The `LocalStorageAdapter` provides a simple, type-safe interface for storing user preferences using browser localStorage.

### Features

- Type-safe storage and retrieval
- Automatic JSON serialization/deserialization
- Error handling for quota exceeded scenarios
- Configurable key prefix to avoid collisions
- Convenience methods for common preferences (language, theme)

### Usage

```typescript
import { LocalStorageAdapter } from '@/adapters/storage';

// Create an instance with optional prefix
const storage = new LocalStorageAdapter('myapp_');

// Save and retrieve generic values
storage.save('setting', { value: 'example' });
const setting = storage.retrieve<{ value: string }>('setting');

// Save and retrieve language preference
storage.saveLanguage('es');
const language = storage.retrieveLanguage(); // 'es'

// Save and retrieve theme preference
storage.saveTheme('dark');
const theme = storage.retrieveTheme(); // 'dark'

// Save all preferences at once
storage.savePreferences({
  language: 'en',
  theme: 'light',
  customSetting: 'value'
});
const prefs = storage.retrievePreferences();

// Remove a specific preference
storage.remove('setting');

// Clear all preferences with the configured prefix
storage.clear();
```

### Error Handling

The adapter throws specific errors for different failure scenarios:

```typescript
import { LocalStorageAdapter, StorageQuotaExceededError } from '@/adapters/storage';

const storage = new LocalStorageAdapter();

try {
  storage.save('key', largeValue);
} catch (error) {
  if (error instanceof StorageQuotaExceededError) {
    // Handle quota exceeded - maybe clear old data or notify user
    console.error('Storage quota exceeded');
  } else {
    // Handle other errors
    console.error('Failed to save preference', error);
  }
}
```

### Browser Compatibility

The adapter automatically detects if localStorage is available and throws an error if it's not. This handles cases where:
- The browser doesn't support localStorage
- localStorage is disabled by user settings
- The app is running in a private/incognito mode with storage disabled

## IndexedDBStorage

The `IndexedDBStorage` adapter provides persistent storage for offline sales data using IndexedDB.

See `IndexedDBStorage.ts` for implementation details.

## OfflineSyncQueue

The `OfflineSyncQueue` manages synchronization of offline sales when the connection is restored.

See `OfflineSyncQueue.ts` for implementation details.
