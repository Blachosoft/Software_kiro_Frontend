/**
 * useSale Hook
 * 
 * Custom hook for sale operations that consumes SaleContext.
 * Provides methods for adding, removing, updating items, and completing sales.
 * Integrates with ProcessSaleUseCase for business logic.
 * 
 * **Validates: Requirements 2.3, 4.3, 10.2, 15.4**
 */

'use client';

import { useContext, useCallback } from 'react';
import { SaleContext } from '../context/SaleContext';
import type { Sale, PaymentMethod } from '../../../domain/entities/Sale';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { Money } from '../../../domain/value-objects/Money';
import { ProcessSaleUseCase } from '../../../application/use-cases/ProcessSaleUseCase';

/**
 * useSale Hook Return Type
 */
export interface UseSaleReturn {
  // State
  sale: Sale | null;
  isLoading: boolean;
  error: string | null;
  total: Money;
  
  // Actions
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemIndex: number) => Promise<void>;
  updateQuantity: (itemIndex: number, newQuantity: number) => Promise<void>;
  completeSale: (paymentMethod: PaymentMethod) => Promise<void>;
  clearSale: () => void;
}

/**
 * useSale Hook Configuration
 */
export interface UseSaleConfig {
  processSaleUseCase: ProcessSaleUseCase;
}

/**
 * useSale Hook
 * 
 * Provides access to sale state and operations.
 * Must be used within a SaleProvider.
 * 
 * @param config - Configuration with use case instance
 * @returns Sale state and operations
 * @throws Error if used outside SaleProvider
 */
export function useSale(config: UseSaleConfig): UseSaleReturn {
  const context = useContext(SaleContext);
  
  if (!context) {
    throw new Error('useSale must be used within a SaleProvider');
  }
  
  const { state, dispatch } = context;
  const { processSaleUseCase } = config;
  
  /**
   * Calculate total for current sale
   */
  const total = state.currentSale
    ? processSaleUseCase.calculateTotal(state.currentSale)
    : Money.create(0);
  
  /**
   * Add item to sale
   */
  const addItem = useCallback(async (productId: string, quantity: number) => {
    if (!state.currentSale) {
      dispatch({ type: 'SET_ERROR', payload: 'No active sale' });
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const quantityVO = Quantity.create(quantity);
      const updatedSale = await processSaleUseCase.addItem(
        state.currentSale.id,
        productId,
        quantityVO
      );
      
      dispatch({ type: 'SET_CURRENT_SALE', payload: updatedSale });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add item';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentSale, dispatch, processSaleUseCase]);
  
  /**
   * Remove item from sale
   */
  const removeItem = useCallback(async (itemIndex: number) => {
    if (!state.currentSale) {
      dispatch({ type: 'SET_ERROR', payload: 'No active sale' });
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const updatedSale = await processSaleUseCase.removeItem(
        state.currentSale.id,
        itemIndex
      );
      
      dispatch({ type: 'SET_CURRENT_SALE', payload: updatedSale });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentSale, dispatch, processSaleUseCase]);
  
  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(async (itemIndex: number, newQuantity: number) => {
    if (!state.currentSale) {
      dispatch({ type: 'SET_ERROR', payload: 'No active sale' });
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const quantityVO = Quantity.create(newQuantity);
      const updatedSale = await processSaleUseCase.updateItemQuantity(
        state.currentSale.id,
        itemIndex,
        quantityVO
      );
      
      dispatch({ type: 'SET_CURRENT_SALE', payload: updatedSale });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update quantity';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentSale, dispatch, processSaleUseCase]);
  
  /**
   * Complete sale
   */
  const completeSale = useCallback(async (paymentMethod: PaymentMethod) => {
    if (!state.currentSale) {
      dispatch({ type: 'SET_ERROR', payload: 'No active sale' });
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const completedSale = await processSaleUseCase.completeSale(
        state.currentSale.id,
        paymentMethod
      );
      
      dispatch({ type: 'SET_CURRENT_SALE', payload: completedSale });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete sale';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.currentSale, dispatch, processSaleUseCase]);
  
  /**
   * Clear current sale
   */
  const clearSale = useCallback(() => {
    dispatch({ type: 'CLEAR_SALE' });
  }, [dispatch]);
  
  return {
    sale: state.currentSale,
    isLoading: state.isLoading,
    error: state.error,
    total,
    addItem,
    removeItem,
    updateQuantity,
    completeSale,
    clearSale,
  };
}
