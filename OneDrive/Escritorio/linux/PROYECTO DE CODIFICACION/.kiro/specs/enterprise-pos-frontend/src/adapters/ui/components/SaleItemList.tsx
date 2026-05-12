/**
 * SaleItemList Component
 * 
 * Displays a list of sale items with product information, subtotals,
 * and controls for removing items and updating quantities.
 * 
 * **Validates: Requirements 4.1, 5.2, 5.3, 14.1, 14.5, 15.3**
 */

'use client';

import { useState, useCallback } from 'react';
import type { SaleItem } from '../../../domain/entities/Sale';

/**
 * SaleItemList Props
 */
export interface SaleItemListProps {
  items: SaleItem[];
  onRemoveItem: (itemIndex: number) => void;
  onUpdateQuantity: (itemIndex: number, newQuantity: number) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * SaleItemList Component
 * 
 * Displays sale items with:
 * - Product information and subtotals
 * - Remove item functionality
 * - Quantity update functionality
 * - ARIA live region for updates
 * - Keyboard accessible controls
 */
export function SaleItemList({
  items,
  onRemoveItem,
  onUpdateQuantity,
  isLoading = false,
  className = '',
}: SaleItemListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [lastAction, setLastAction] = useState<string>('');

  /**
   * Handle remove item
   */
  const handleRemove = useCallback(
    (index: number, productName: string) => {
      onRemoveItem(index);
      setLastAction(`Removed ${productName} from sale`);
    },
    [onRemoveItem]
  );

  /**
   * Start editing quantity
   */
  const handleStartEdit = useCallback((index: number, currentQuantity: number) => {
    setEditingIndex(index);
    setEditQuantity(currentQuantity);
  }, []);

  /**
   * Cancel editing
   */
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  /**
   * Save quantity change
   */
  const handleSaveQuantity = useCallback(
    (index: number, productName: string) => {
      if (editQuantity > 0) {
        onUpdateQuantity(index, editQuantity);
        setLastAction(`Updated ${productName} quantity to ${editQuantity}`);
      }
      setEditingIndex(null);
    },
    [editQuantity, onUpdateQuantity]
  );

  /**
   * Handle quantity input change
   */
  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setEditQuantity(value);
    }
  }, []);

  /**
   * Handle keyboard events for quantity editing
   */
  const handleQuantityKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number, productName: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveQuantity(index, productName);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveQuantity, handleCancelEdit]
  );

  if (items.length === 0) {
    return (
      <div
        className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <p className="text-gray-500">No items in sale</p>
        <p className="text-sm text-gray-400 mt-1">
          Search and add products to start a sale
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Screen reader announcement for updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {lastAction}
      </div>

      <div
        role="list"
        aria-label="Sale items"
        className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200"
      >
        {items.map((item, index) => (
          <div
            key={`${item.productId}-${index}`}
            role="listitem"
            className={`p-4 ${isLoading ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {item.productName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  ${item.unitPrice.amount.toFixed(2)} each
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                {editingIndex === index ? (
                  <div className="flex items-center gap-1">
                    <label htmlFor={`quantity-${index}`} className="sr-only">
                      Edit quantity for {item.productName}
                    </label>
                    <input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      value={editQuantity}
                      onChange={handleQuantityChange}
                      onKeyDown={(e) =>
                        handleQuantityKeyDown(e, index, item.productName)
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      aria-label={`Quantity for ${item.productName}`}
                    />
                    <button
                      onClick={() => handleSaveQuantity(index, item.productName)}
                      className="p-1 text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                      aria-label="Save quantity"
                      disabled={isLoading}
                    >
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
                      aria-label="Cancel editing"
                      disabled={isLoading}
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      handleStartEdit(index, item.quantity.value)
                    }
                    className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={`Edit quantity for ${item.productName}, current quantity: ${item.quantity.value}`}
                    disabled={isLoading}
                  >
                    Qty: {item.quantity.value}
                  </button>
                )}
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[80px]">
                <p className="font-semibold text-gray-900">
                  ${item.subtotal.amount.toFixed(2)}
                </p>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(index, item.productName)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Remove ${item.productName} from sale`}
                disabled={isLoading}
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
