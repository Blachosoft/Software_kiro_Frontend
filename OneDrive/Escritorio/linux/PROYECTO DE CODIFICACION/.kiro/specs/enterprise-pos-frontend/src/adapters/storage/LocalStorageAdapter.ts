/**
 * LocalStorageAdapter
 * 
 * Adapter for storing user preferences using browser localStorage.
 * Provides simple key-value storage for settings like language and theme.
 * 
 * This adapter handles quota exceeded errors gracefully and provides
 * type-safe methods for storing and retrieving preferences.
 */

/**
 * User preferences that can be stored
 */
export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  [key: string]: unknown;
}

/**
 * Error thrown when localStorage quota is exceeded
 */
export class StorageQuotaExceededError extends Error {
  constructor(message: string = 'Storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * LocalStorage adapter for user preferences
 */
export class LocalStorageAdapter {
  private readonly prefix: string;

  /**
   * Creates a new LocalStorageAdapter
   * @param prefix - Optional prefix for all keys to avoid collisions
   */
  constructor(prefix: string = 'pos_') {
    this.prefix = prefix;
  }

  /**
   * Checks if localStorage is available
   * @returns true if localStorage is available, false otherwise
   */
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the full key with prefix
   * @param key - The key without prefix
   * @returns The key with prefix
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Saves a preference value
   * @param key - The preference key
   * @param value - The value to store
   * @throws StorageQuotaExceededError if storage quota is exceeded
   * @throws Error if localStorage is not available
   */
  save<T>(key: string, value: T): void {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new StorageQuotaExceededError(
          'Failed to save preference: storage quota exceeded'
        );
      }
      throw error;
    }
  }

  /**
   * Retrieves a preference value
   * @param key - The preference key
   * @returns The stored value or null if not found
   * @throws Error if localStorage is not available
   */
  retrieve<T>(key: string): T | null {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      // If parsing fails, return null
      console.error(`Failed to parse stored value for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Removes a preference
   * @param key - The preference key
   * @throws Error if localStorage is not available
   */
  remove(key: string): void {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    localStorage.removeItem(this.getKey(key));
  }

  /**
   * Clears all preferences with the configured prefix
   * @throws Error if localStorage is not available
   */
  clear(): void {
    if (!this.isAvailable()) {
      throw new Error('localStorage is not available');
    }

    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Saves user language preference
   * @param language - The language code (e.g., 'en', 'es')
   * @throws StorageQuotaExceededError if storage quota is exceeded
   */
  saveLanguage(language: string): void {
    this.save('language', language);
  }

  /**
   * Retrieves user language preference
   * @returns The stored language code or null if not set
   */
  retrieveLanguage(): string | null {
    return this.retrieve<string>('language');
  }

  /**
   * Saves user theme preference
   * @param theme - The theme setting
   * @throws StorageQuotaExceededError if storage quota is exceeded
   */
  saveTheme(theme: 'light' | 'dark' | 'system'): void {
    this.save('theme', theme);
  }

  /**
   * Retrieves user theme preference
   * @returns The stored theme or null if not set
   */
  retrieveTheme(): 'light' | 'dark' | 'system' | null {
    return this.retrieve<'light' | 'dark' | 'system'>('theme');
  }

  /**
   * Saves all user preferences at once
   * @param preferences - The preferences object
   * @throws StorageQuotaExceededError if storage quota is exceeded
   */
  savePreferences(preferences: UserPreferences): void {
    this.save('preferences', preferences);
  }

  /**
   * Retrieves all user preferences
   * @returns The stored preferences or null if not set
   */
  retrievePreferences(): UserPreferences | null {
    return this.retrieve<UserPreferences>('preferences');
  }
}
