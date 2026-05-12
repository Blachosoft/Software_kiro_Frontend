/**
 * PaymentPanel Component
 * 
 * Displays sale total, payment method selection, and complete sale button.
 * Handles loading and error states with accessibility features.
 * 
 * **Validates: Requirements 4.1, 5.4, 5.5, 14.1, 15.3**
 */

'use client';

import { useState, useCallback } from 'react';
import type { PaymentMethod } from '../../../domain/entities/Sale';
import type { Money } from '../../../domain/value-objects/Money';

/**
 * PaymentPanel Props
 */
export interface PaymentPanelProps {
  total: Money;
  onCompleteSale: (paymentMethod: PaymentMethod) => void;
  isLoading?: boolean;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

/**
 * Payment method option
 */
interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}

/**
 * PaymentPanel Component
 * 
 * Provides payment interface with:
 * - Sale total display
 * - Payment method selection (cash, card, transfer)
 * - Complete sale button
 * - Loading and error states
 * - Keyboard accessible controls
 */
export function PaymentPanel({
  total,
  onCompleteSale,
  isLoading = false,
  error = null,
  disabled = false,
  className = '',
}: PaymentPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');

  /**
   * Payment method options
   */
  const paymentMethods: PaymentMethodOption[] = [
    {
      value: 'cash',
      label: 'Cash',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      value: 'card',
      label: 'Card',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      value: 'transfer',
      label: 'Transfer',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
  ];

  /**
   * Handle payment method selection
   */
  const handleMethodSelect = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method);
  }, []);

  /**
   * Handle complete sale
   */
  const handleCompleteSale = useCallback(() => {
    if (!disabled && !isLoading) {
      onCompleteSale(selectedMethod);
    }
  }, [disabled, isLoading, selectedMethod, onCompleteSale]);

  /**
   * Handle keyboard event for complete sale
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !disabled && !isLoading) {
        handleCompleteSale();
      }
    },
    [disabled, isLoading, handleCompleteSale]
  );

  const isDisabled = disabled || isLoading || total.amount === 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Total Display */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg text-gray-600">Total</span>
          <span
            className="text-3xl font-bold text-gray-900"
            aria-label={`Total amount: ${total.amount.toFixed(2)} ${total.currency}`}
          >
            ${total.amount.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-gray-500 text-right">
          {total.currency}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <label
                key={method.value}
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedMethod === method.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={method.value}
                  checked={selectedMethod === method.value}
                  onChange={() => handleMethodSelect(method.value)}
                  disabled={isDisabled}
                  className="sr-only"
                  aria-label={`Pay with ${method.label}`}
                />
                <div
                  className={`mb-2 ${
                    selectedMethod === method.value
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {method.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    selectedMethod === method.value
                      ? 'text-blue-900'
                      : 'text-gray-700'
                  }`}
                >
                  {method.label}
                </span>
                {selectedMethod === method.value && (
                  <div className="absolute top-2 right-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Complete Sale Button */}
      <button
        onClick={handleCompleteSale}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        }`}
        aria-label={`Complete sale with ${selectedMethod} payment`}
        aria-disabled={isDisabled}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Processing...
          </span>
        ) : (
          'Complete Sale'
        )}
      </button>

      {total.amount === 0 && (
        <p className="mt-2 text-sm text-gray-500 text-center">
          Add items to the sale to continue
        </p>
      )}
    </div>
  );
}
