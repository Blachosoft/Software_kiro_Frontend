/**
 * useCustomer Hook
 * 
 * Custom hook for customer operations.
 * Provides methods for creating, searching, and getting customers.
 * Integrates with ManageCustomerUseCase for business logic.
 * 
 * **Validates: Requirements 2.3, 4.3, 10.2, 15.4**
 */

'use client';

import { useState, useCallback } from 'react';
import type { Customer } from '../../../domain/entities/Customer';
import { ManageCustomerUseCase } from '../../../application/use-cases/ManageCustomerUseCase';

/**
 * useCustomer Hook Return Type
 */
export interface UseCustomerReturn {
  // State
  customers: Customer[];
  currentCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createCustomer: (customer: Customer) => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  getCustomer: (customerId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * useCustomer Hook Configuration
 */
export interface UseCustomerConfig {
  manageCustomerUseCase: ManageCustomerUseCase;
}

/**
 * useCustomer Hook
 * 
 * Provides access to customer operations.
 * 
 * @param config - Configuration with use case instance
 * @returns Customer state and operations
 */
export function useCustomer(config: UseCustomerConfig): UseCustomerReturn {
  const { manageCustomerUseCase } = config;
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Create a new customer
   */
  const createCustomer = useCallback(async (customer: Customer) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const createdCustomer = await manageCustomerUseCase.createCustomer(customer);
      setCurrentCustomer(createdCustomer);
      
      // Add to customers list
      setCustomers(prev => [...prev, createdCustomer]);
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [manageCustomerUseCase]);
  
  /**
   * Search customers by query
   */
  const searchCustomers = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await manageCustomerUseCase.searchCustomers(query);
      setCustomers(results);
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search customers';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [manageCustomerUseCase]);
  
  /**
   * Get customer by ID
   */
  const getCustomer = useCallback(async (customerId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const customer = await manageCustomerUseCase.getCustomerById(customerId);
      setCurrentCustomer(customer);
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get customer';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [manageCustomerUseCase]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    customers,
    currentCustomer,
    isLoading,
    error,
    createCustomer,
    searchCustomers,
    getCustomer,
    clearError,
  };
}
