/**
 * useInventory Hook
 * 
 * Custom hook for inventory operations.
 * Provides methods for searching, getting, and updating products.
 * Integrates with ManageInventoryUseCase for business logic.
 * 
 * **Validates: Requirements 2.3, 4.3, 10.2, 15.4**
 */

'use client';

import { useState, useCallback } from 'react';
import type { Product } from '../../../domain/entities/Product';
import { ManageInventoryUseCase } from '../../../application/use-cases/ManageInventoryUseCase';

/**
 * useInventory Hook Return Type
 */
export interface UseInventoryReturn {
  // State
  products: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  searchProducts: (query: string) => Promise<void>;
  getProduct: (productId: string) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  clearError: () => void;
}

/**
 * useInventory Hook Configuration
 */
export interface UseInventoryConfig {
  manageInventoryUseCase: ManageInventoryUseCase;
}

/**
 * useInventory Hook
 * 
 * Provides access to inventory operations.
 * 
 * @param config - Configuration with use case instance
 * @returns Inventory state and operations
 */
export function useInventory(config: UseInventoryConfig): UseInventoryReturn {
  const { manageInventoryUseCase } = config;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Search products by query
   */
  const searchProducts = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await manageInventoryUseCase.searchProducts(query);
      setProducts(results);
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search products';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [manageInventoryUseCase]);
  
  /**
   * Get product by ID
   */
  const getProduct = useCallback(async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const product = await manageInventoryUseCase.getProductById(productId);
      setCurrentProduct(product);
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get product';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [manageInventoryUseCase]);
  
  /**
   * Update product
   */
  const updateProduct = useCallback(async (product: Product) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedProduct = await manageInventoryUseCase.updateProduct(product);
      setCurrentProduct(updatedProduct);
      
      // Update in products list if present
      setProducts(prev => 
        prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [manageInventoryUseCase]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    products,
    currentProduct,
    isLoading,
    error,
    searchProducts,
    getProduct,
    updateProduct,
    clearError,
  };
}
