/**
 * useCustomer Hook Tests
 * 
 * Component tests for useCustomer hook using React Testing Library.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCustomer } from '../useCustomer';
import { ManageCustomerUseCase } from '../../../../application/use-cases/ManageCustomerUseCase';
import type { Customer } from '../../../../domain/entities/Customer';
import type { CustomerRepository } from '../../../../domain/ports/CustomerRepository';
import type { SaleRepository } from '../../../../domain/ports/SaleRepository';
import { Email } from '../../../../domain/value-objects/Email';
import { PhoneNumber } from '../../../../domain/value-objects/PhoneNumber';
import { Money } from '../../../../domain/value-objects/Money';

describe('useCustomer Hook', () => {
  let mockCustomerRepository: CustomerRepository;
  let mockSaleRepository: SaleRepository;
  let manageCustomerUseCase: ManageCustomerUseCase;
  
  const mockCustomer: Customer = {
    id: 'customer-1',
    name: 'John Doe',
    email: Email.create('john@example.com'),
    phone: PhoneNumber.create('+1234567890'),
    createdAt: new Date(),
    totalPurchases: Money.create(0),
  };
  
  const mockCustomers: Customer[] = [
    mockCustomer,
    {
      id: 'customer-2',
      name: 'Jane Smith',
      email: Email.create('jane@example.com'),
      phone: PhoneNumber.create('+0987654321'),
      createdAt: new Date(),
      totalPurchases: Money.create(100),
    },
  ];
  
  beforeEach(() => {
    mockCustomerRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      search: vi.fn(),
      update: vi.fn(),
      findAll: vi.fn(),
      delete: vi.fn(),
    };
    
    mockSaleRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByDateRange: vi.fn(),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
    };
    
    manageCustomerUseCase = new ManageCustomerUseCase(mockCustomerRepository, mockSaleRepository);
  });
  
  it('should return initial state', () => {
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    expect(result.current.customers).toEqual([]);
    expect(result.current.currentCustomer).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
  
  it('should create customer', async () => {
    vi.mocked(mockCustomerRepository.save).mockResolvedValue(mockCustomer);
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.createCustomer(mockCustomer);
    });
    
    await waitFor(() => {
      expect(result.current.currentCustomer).toEqual(mockCustomer);
      expect(result.current.customers).toContainEqual(mockCustomer);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should handle create customer error', async () => {
    vi.mocked(mockCustomerRepository.save).mockRejectedValue(new Error('Email already exists'));
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.createCustomer(mockCustomer);
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Email already exists');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should search customers', async () => {
    vi.mocked(mockCustomerRepository.search).mockResolvedValue(mockCustomers);
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.searchCustomers('john');
    });
    
    await waitFor(() => {
      expect(result.current.customers).toEqual(mockCustomers);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should handle search error', async () => {
    vi.mocked(mockCustomerRepository.search).mockRejectedValue(new Error('Search failed'));
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.searchCustomers('test');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should get customer by ID', async () => {
    vi.mocked(mockCustomerRepository.findById).mockResolvedValue(mockCustomer);
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.getCustomer('customer-1');
    });
    
    await waitFor(() => {
      expect(result.current.currentCustomer).toEqual(mockCustomer);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should handle get customer error', async () => {
    vi.mocked(mockCustomerRepository.findById).mockRejectedValue(new Error('Customer not found'));
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.getCustomer('invalid-id');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Customer not found');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should clear error', async () => {
    vi.mocked(mockCustomerRepository.search).mockRejectedValue(new Error('Search failed'));
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    // Trigger an error
    await act(async () => {
      await result.current.searchCustomers('test');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
    });
    
    // Clear the error
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.error).toBe(null);
  });
  
  it('should set loading state during operations', async () => {
    let resolveSearch: (value: Customer[]) => void;
    const searchPromise = new Promise<Customer[]>((resolve) => {
      resolveSearch = resolve;
    });
    
    vi.mocked(mockCustomerRepository.search).mockReturnValue(searchPromise);
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    act(() => {
      result.current.searchCustomers('test');
    });
    
    // Should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Resolve the promise
    await act(async () => {
      resolveSearch(mockCustomers);
      await searchPromise;
    });
    
    // Should no longer be loading
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should handle validation errors', async () => {
    const invalidCustomer: Customer = {
      ...mockCustomer,
      name: '', // Invalid: empty name
    };
    
    vi.mocked(mockCustomerRepository.save).mockRejectedValue(
      new Error('Name is required')
    );
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.createCustomer(invalidCustomer);
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Name is required');
    });
  });
  
  it('should add created customer to customers list', async () => {
    vi.mocked(mockCustomerRepository.save).mockResolvedValue(mockCustomer);
    
    const { result } = renderHook(() => useCustomer({ manageCustomerUseCase }));
    
    await act(async () => {
      await result.current.createCustomer(mockCustomer);
    });
    
    await waitFor(() => {
      expect(result.current.customers).toHaveLength(1);
      expect(result.current.customers[0]).toEqual(mockCustomer);
    });
  });
});
