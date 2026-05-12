/**
 * SalesScreen Component
 * 
 * Main screen for processing sales transactions.
 * Composes ProductSearch, SaleItemList, and PaymentPanel components.
 * Integrates with useSale hook for sale operations.
 * 
 * **Validates: Requirements 4.1, 5.1, 5.2, 5.3, 5.4, 13.6, 14.3, 15.3**
 */

'use client';

import { useCallback, useState } from 'react';
import { ProductSearch } from '../components/ProductSearch';
import { SaleItemList } from '../components/SaleItemList';
import { PaymentPanel } from '../components/PaymentPanel';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { PaymentMethod } from '../../../domain/entities/Sale';
import type { UseSaleReturn } from '../hooks/useSale';
import type { UseInventoryReturn } from '../hooks/useInventory';

/**
 * SalesScreen Props
 */
export interface SalesScreenProps {
  sale: UseSaleReturn;
  inventory: UseInventoryReturn;
}

/**
 * SalesScreen Component
 * 
 * Provides complete sales transaction interface with:
 * - Product search and selection
 * - Sale item list with quantity management
 * - Payment processing panel
 * - Loading and error states
 * - Keyboard navigation support
 * - Accessibility features
 */
export function SalesScreen({ sale, inventory }: SalesScreenProps) {
  const [lastAction, setLastAction] = useState<string>('');

  /**
   * Handle product selection from search
   */
  const handleProductSelect = useCallback(
    async (productId: string, quantity: number) => {
      try {
        await sale.addItem(productId, quantity);
        setLastAction(`Added product to sale`);
      } catch (error) {
        // Error is handled by the sale hook
        console.error('Failed to add product:', error);
      }
    },
    [sale]
  );

  /**
   * Handle item removal
   */
  const handleRemoveItem = useCallback(
    async (itemIndex: number) => {
      try {
        await sale.removeItem(itemIndex);
        setLastAction(`Removed item from sale`);
      } catch (error) {
        console.error('Failed to remove item:', error);
      }
    },
    [sale]
  );

  /**
   * Handle quantity update
   */
  const handleUpdateQuantity = useCallback(
    async (itemIndex: number, newQuantity: number) => {
      try {
        await sale.updateQuantity(itemIndex, newQuantity);
        setLastAction(`Updated item quantity`);
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    },
    [sale]
  );

  /**
   * Handle sale completion
   */
  const handleCompleteSale = useCallback(
    async (paymentMethod: PaymentMethod) => {
      try {
        await sale.completeSale(paymentMethod);
        setLastAction(`Sale completed successfully`);
      } catch (error) {
        console.error('Failed to complete sale:', error);
      }
    },
    [sale]
  );

  return (
    <ErrorBoundary>
      <div className="sales-screen min-h-screen bg-gray-50 p-6">
        {/* Screen reader announcement for actions */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {lastAction}
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-gray-600 mt-1">
            Process customer transactions
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product Search and Sale Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Search */}
            <section aria-labelledby="search-heading">
              <h2 id="search-heading" className="sr-only">
                Product Search
              </h2>
              <ProductSearch
                inventory={inventory}
                onProductSelect={handleProductSelect}
                className="w-full"
              />
            </section>

            {/* Sale Items List */}
            <section aria-labelledby="items-heading">
              <h2 id="items-heading" className="text-xl font-semibold text-gray-900 mb-4">
                Sale Items
              </h2>
              <SaleItemList
                items={sale.sale?.items || []}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                isLoading={sale.isLoading}
              />
            </section>

            {/* Error Display */}
            {sale.error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
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
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {sale.error}
                    </p>
                    <button
                      onClick={() => sale.clearSale()}
                      className="mt-3 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                    >
                      Clear and start new sale
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Payment Panel */}
          <div className="lg:col-span-1">
            <section aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="text-xl font-semibold text-gray-900 mb-4">
                Payment
              </h2>
              <div className="sticky top-6">
                <PaymentPanel
                  total={sale.total}
                  onCompleteSale={handleCompleteSale}
                  isLoading={sale.isLoading}
                  error={sale.error}
                  disabled={!sale.sale || sale.sale.items.length === 0}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Loading Overlay */}
        {sale.isLoading && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
            role="status"
            aria-label="Processing"
          >
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <svg
                className="animate-spin h-8 w-8 text-blue-600 mx-auto"
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
              <p className="text-gray-700 mt-4 text-center">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
