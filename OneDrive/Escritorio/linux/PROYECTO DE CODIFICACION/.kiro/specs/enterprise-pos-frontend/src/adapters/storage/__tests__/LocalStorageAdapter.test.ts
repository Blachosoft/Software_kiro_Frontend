/**
 * Unit tests for LocalStorageAdapter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageAdapter, StorageQuotaExceededError } from '../LocalStorageAdapter';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let originalSetItem: typeof Storage.prototype.setItem;
  let originalGetItem: typeof Storage.prototype.getItem;
  let originalRemoveItem: typeof Storage.prototype.removeItem;

  beforeEach(() => {
    // Store original implementations
    originalSetItem = Storage.prototype.setItem;
    originalGetItem = Storage.prototype.getItem;
    originalRemoveItem = Storage.prototype.removeItem;
    
    // Clear localStorage before each test
    localStorage.clear();
    adapter = new LocalStorageAdapter('test_');
  });

  afterEach(() => {
    // Restore original implementations after each test
    Storage.prototype.setItem = originalSetItem;
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.removeItem = originalRemoveItem;
    
    localStorage.clear();
  });

  describe('save and retrieve', () => {
    it('should save and retrieve a string value', () => {
      adapter.save('key1', 'value1');
      const result = adapter.retrieve<string>('key1');
      expect(result).toBe('value1');
    });

    it('should save and retrieve a number value', () => {
      adapter.save('key2', 42);
      const result = adapter.retrieve<number>('key2');
      expect(result).toBe(42);
    });

    it('should save and retrieve an object value', () => {
      const obj = { name: 'Test', count: 5 };
      adapter.save('key3', obj);
      const result = adapter.retrieve<typeof obj>('key3');
      expect(result).toEqual(obj);
    });

    it('should save and retrieve an array value', () => {
      const arr = [1, 2, 3, 4, 5];
      adapter.save('key4', arr);
      const result = adapter.retrieve<number[]>('key4');
      expect(result).toEqual(arr);
    });

    it('should return null for non-existent key', () => {
      const result = adapter.retrieve<string>('nonexistent');
      expect(result).toBeNull();
    });

    it('should overwrite existing value', () => {
      adapter.save('key5', 'first');
      adapter.save('key5', 'second');
      const result = adapter.retrieve<string>('key5');
      expect(result).toBe('second');
    });

    it('should use prefix for keys', () => {
      adapter.save('mykey', 'myvalue');
      const rawValue = localStorage.getItem('test_mykey');
      expect(rawValue).toBe(JSON.stringify('myvalue'));
    });
  });

  describe('remove', () => {
    it('should remove a stored value', () => {
      adapter.save('key6', 'value6');
      expect(adapter.retrieve<string>('key6')).toBe('value6');
      
      adapter.remove('key6');
      expect(adapter.retrieve<string>('key6')).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => adapter.remove('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all values with prefix', () => {
      adapter.save('key7', 'value7');
      adapter.save('key8', 'value8');
      adapter.save('key9', 'value9');
      
      adapter.clear();
      
      expect(adapter.retrieve<string>('key7')).toBeNull();
      expect(adapter.retrieve<string>('key8')).toBeNull();
      expect(adapter.retrieve<string>('key9')).toBeNull();
    });

    it('should not clear values with different prefix', () => {
      // Save with test_ prefix
      adapter.save('key10', 'value10');
      
      // Save with different prefix directly
      localStorage.setItem('other_key', 'other_value');
      
      adapter.clear();
      
      expect(adapter.retrieve<string>('key10')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('other_value');
    });
  });

  describe('language preferences', () => {
    it('should save and retrieve language preference', () => {
      adapter.saveLanguage('es');
      const result = adapter.retrieveLanguage();
      expect(result).toBe('es');
    });

    it('should return null when language is not set', () => {
      const result = adapter.retrieveLanguage();
      expect(result).toBeNull();
    });

    it('should update language preference', () => {
      adapter.saveLanguage('en');
      adapter.saveLanguage('es');
      const result = adapter.retrieveLanguage();
      expect(result).toBe('es');
    });
  });

  describe('theme preferences', () => {
    it('should save and retrieve theme preference', () => {
      adapter.saveTheme('dark');
      const result = adapter.retrieveTheme();
      expect(result).toBe('dark');
    });

    it('should return null when theme is not set', () => {
      const result = adapter.retrieveTheme();
      expect(result).toBeNull();
    });

    it('should handle all theme values', () => {
      adapter.saveTheme('light');
      expect(adapter.retrieveTheme()).toBe('light');
      
      adapter.saveTheme('dark');
      expect(adapter.retrieveTheme()).toBe('dark');
      
      adapter.saveTheme('system');
      expect(adapter.retrieveTheme()).toBe('system');
    });
  });

  describe('user preferences', () => {
    it('should save and retrieve all preferences', () => {
      const prefs = {
        language: 'es',
        theme: 'dark' as const,
        customSetting: 'value',
      };
      
      adapter.savePreferences(prefs);
      const result = adapter.retrievePreferences();
      expect(result).toEqual(prefs);
    });

    it('should return null when preferences are not set', () => {
      const result = adapter.retrievePreferences();
      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should throw StorageQuotaExceededError when quota is exceeded', () => {
      // Create a new adapter instance for this test
      const testAdapter = new LocalStorageAdapter('quota_test_');
      
      // Mock localStorage.setItem to throw QuotaExceededError
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn((key: string) => {
        // Only throw for our test adapter's keys
        if (key.startsWith('quota_test_')) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        return originalSetItem.call(localStorage, key, '');
      });

      expect(() => testAdapter.save('key', 'value')).toThrow(StorageQuotaExceededError);
      expect(() => testAdapter.save('key', 'value')).toThrow(
        'Failed to save preference: storage quota exceeded'
      );

      // Restore original implementation
      Storage.prototype.setItem = originalSetItem;
    });

    it('should return null when retrieving corrupted data', () => {
      // Manually set invalid JSON
      localStorage.setItem('test_corrupted', 'invalid json {');
      
      const result = adapter.retrieve<string>('corrupted');
      expect(result).toBeNull();
    });

    it('should throw error when localStorage is not available during save', () => {
      // Create a new adapter for this test
      const unavailableAdapter = new LocalStorageAdapter('unavailable_test_');
      
      // Mock localStorage.setItem to throw
      Storage.prototype.setItem = vi.fn((key: string) => {
        if (key.startsWith('unavailable_test_')) {
          throw new Error('localStorage not available');
        }
        return originalSetItem.call(localStorage, key, '');
      });

      // The adapter detects unavailability and throws its own error message
      expect(() => unavailableAdapter.save('key', 'value')).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as value', () => {
      adapter.save('empty', '');
      const result = adapter.retrieve<string>('empty');
      expect(result).toBe('');
    });

    it('should handle null as value', () => {
      adapter.save('null', null);
      const result = adapter.retrieve<null>('null');
      expect(result).toBeNull();
    });

    it('should handle undefined as value', () => {
      adapter.save('undefined', undefined);
      const result = adapter.retrieve<undefined>('undefined');
      // JSON.stringify(undefined) returns "undefined" which is not valid JSON
      // So retrieve will return null when parsing fails
      expect(result).toBeNull();
    });

    it('should handle boolean values', () => {
      adapter.save('bool1', true);
      adapter.save('bool2', false);
      
      expect(adapter.retrieve<boolean>('bool1')).toBe(true);
      expect(adapter.retrieve<boolean>('bool2')).toBe(false);
    });

    it('should handle nested objects', () => {
      const nested = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      };
      
      adapter.save('nested', nested);
      const result = adapter.retrieve<typeof nested>('nested');
      expect(result).toEqual(nested);
    });

    it('should work with custom prefix', () => {
      const customAdapter = new LocalStorageAdapter('custom_prefix_');
      customAdapter.save('key', 'value');
      
      const rawValue = localStorage.getItem('custom_prefix_key');
      expect(rawValue).toBe(JSON.stringify('value'));
    });

    it('should work with empty prefix', () => {
      const noPrefixAdapter = new LocalStorageAdapter('');
      noPrefixAdapter.save('key', 'value');
      
      const rawValue = localStorage.getItem('key');
      expect(rawValue).toBe(JSON.stringify('value'));
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user preference workflow', () => {
      // User sets language
      adapter.saveLanguage('en');
      expect(adapter.retrieveLanguage()).toBe('en');
      
      // User sets theme
      adapter.saveTheme('dark');
      expect(adapter.retrieveTheme()).toBe('dark');
      
      // User changes language
      adapter.saveLanguage('es');
      expect(adapter.retrieveLanguage()).toBe('es');
      
      // Theme should still be set
      expect(adapter.retrieveTheme()).toBe('dark');
      
      // Clear all preferences
      adapter.clear();
      expect(adapter.retrieveLanguage()).toBeNull();
      expect(adapter.retrieveTheme()).toBeNull();
    });

    it('should handle multiple adapters with different prefixes', () => {
      const adapter1 = new LocalStorageAdapter('app1_');
      const adapter2 = new LocalStorageAdapter('app2_');
      
      adapter1.save('key', 'value1');
      adapter2.save('key', 'value2');
      
      expect(adapter1.retrieve<string>('key')).toBe('value1');
      expect(adapter2.retrieve<string>('key')).toBe('value2');
      
      adapter1.clear();
      expect(adapter1.retrieve<string>('key')).toBeNull();
      expect(adapter2.retrieve<string>('key')).toBe('value2');
    });
  });
});
