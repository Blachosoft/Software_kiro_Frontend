/**
 * ProductSearch Component
 * 
 * Search input component for finding products with debouncing,
 * keyboard navigation, and accessibility features.
 * 
 * **Validates: Requirements 4.1, 6.2, 14.1, 14.2, 14.3, 15.3**
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Product } from '../../../domain/entities/Product';
import type { UseInventoryReturn } from '../hooks/useInventory';

/**
 * ProductSearch Props
 */
export interface ProductSearchProps {
  inventory: UseInventoryReturn;
  onProductSelect: (productId: string, quantity: number) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
}

/**
 * ProductSearch Component
 * 
 * Provides a search interface for products with:
 * - Debounced search input
 * - Keyboard navigation (arrow keys, enter, escape)
 * - ARIA attributes for accessibility
 * - Loading and error states
 */
export function ProductSearch({
  inventory,
  onProductSelect,
  debounceMs = 300,
  placeholder = 'Search products...',
  className = '',
}: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quantity, setQuantity] = useState(1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const { products, isLoading, error, searchProducts, clearError } = inventory;

  /**
   * Debounced search effect
   */
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search for empty queries
    if (!query.trim()) {
      setIsOpen(false);
      return;
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      await searchProducts(query);
      setIsOpen(true);
      setSelectedIndex(-1);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, searchProducts]);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  /**
   * Handle product selection
   */
  const handleSelectProduct = useCallback(
    (product: Product) => {
      onProductSelect(product.id, quantity);
      setQuery('');
      setIsOpen(false);
      setSelectedIndex(-1);
      setQuantity(1);
      searchInputRef.current?.focus();
    },
    [onProductSelect, quantity]
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || products.length === 0) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < products.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < products.length) {
            handleSelectProduct(products[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;

        default:
          break;
      }
    },
    [isOpen, products, selectedIndex, handleSelectProduct]
  );

  /**
   * Handle quantity change
   */
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  }, []);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            ref={searchInputRef}
            id="product-search"
            type="search"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search products"
            aria-autocomplete="list"
            aria-controls="product-results"
            aria-expanded={isOpen}
            aria-activedescendant={
              selectedIndex >= 0 ? `product-${products[selectedIndex]?.id}` : undefined
            }
            autoComplete="off"
          />
          {isLoading && (
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              role="status"
              aria-label="Loading"
            >
              <svg
                className="animate-spin h-5 w-5 text-gray-400"
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
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="w-24">
          <label htmlFor="product-quantity" className="sr-only">
            Quantity
          </label>
          <input
            id="product-quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Quantity"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Search Results */}
      {isOpen && !error && (
        <div
          ref={resultsRef}
          id="product-results"
          role="listbox"
          aria-label="Product search results"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {products.length === 0 && !isLoading && (
            <div className="px-4 py-3 text-gray-500 text-sm">
              No products found
            </div>
          )}

          {products.map((product, index) => (
            <button
              key={product.id}
              id={`product-${product.id}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelectProduct(product)}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    Code: {product.code} | Stock: {product.stock.value}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-gray-900">
                    ${product.price.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">{product.category}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
