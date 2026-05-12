/**
 * useInventory Hook Tests
 * 
 * Component tests for useInventory hook using React Testing Library.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInventory } from '../useInventory';
import { ManageInventoryUseCase } from '../../../../application/use-cases/ManageInventoryUseCase';
import type { Product } from '../../../../domain/entities/Product';
import type { ProductRepository } from '../../../../domain/ports/ProductRepository';
import { Money } from '../../../../domain/value-objects/Money';
import { Quantity } from '../../../../domain/value-objects/Quantity';

describe('useInventory Hook', () => {
  let mockProductRepository: ProductRepository;
  let manageInventoryUseCase: ManageInventoryUseCase;
  
  const mockProduct: Product = {
    id: 'product-1',
    code: 'P001',
    name: 'Test Product',
    price: Money.create(10),
    stock: Quantity.create(100),
    category: 'Test',
  };
  
  const mockProducts: Product[] = [
    mockProduct,
    {
      id: 'product-2',
      code: 'P002',
      name: 'Another Product',
      price: Money.create(20),
      stock: Quantity.create(50),
      category: 'Test',
    },
  ];
  
  beforeEach(() => {
    mockProductRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      search: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    
    manageInventoryUseCase = new ManageInventoryUseCase(mockProductRepository);
  });
  
  it('should return initial state', () => {
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    expect(result.current.products).toEqual([]);
    expect(result.current.currentProduct).toBe(null);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
  
  it('should search products', async () => {
    vi.mocked(mockProductRepository.search).mockResolvedValue(mockProducts);
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    await act(async () => {
      await result.current.searchProducts('test');
    });
    
    await waitFor(() => {
      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should handle search error', async () => {
    vi.mocked(mockProductRepository.search).mockRejectedValue(new Error('Search failed'));
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    await act(async () => {
      await result.current.searchProducts('test');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should get product by ID', async () => {
    vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    await act(async () => {
      await result.current.getProduct('product-1');
    });
    
    await waitFor(() => {
      expect(result.current.currentProduct).toEqual(mockProduct);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should handle get product error', async () => {
    vi.mocked(mockProductRepository.findById).mockRejectedValue(new Error('Product not found'));
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    await act(async () => {
      await result.current.getProduct('invalid-id');
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Product not found');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should update product', async () => {
    const updatedProduct: Product = {
      ...mockProduct,
      price: Money.create(15),
    };
    
    vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
    vi.mocked(mockProductRepository.update).mockResolvedValue(updatedProduct);
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    // First set current product
    await act(async () => {
      await result.current.getProduct('product-1');
    });
    
    // Then update it
    await act(async () => {
      await result.current.updateProduct(updatedProduct);
    });
    
    await waitFor(() => {
      expect(result.current.currentProduct?.price.amount).toBe(15);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });
  
  it('should update product in products list', async () => {
    const updatedProduct: Product = {
      ...mockProduct,
      price: Money.create(15),
    };
    
    vi.mocked(mockProductRepository.search).mockResolvedValue(mockProducts);
    vi.mocked(mockProductRepository.update).mockResolvedValue(updatedProduct);
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    // First search to populate products list
    await act(async () => {
      await result.current.searchProducts('test');
    });
    
    // Then update a product
    await act(async () => {
      await result.current.updateProduct(updatedProduct);
    });
    
    await waitFor(() => {
      const updatedInList = result.current.products.find(p => p.id === 'product-1');
      expect(updatedInList?.price.amount).toBe(15);
    });
  });
  
  it('should handle update product error', async () => {
    vi.mocked(mockProductRepository.update).mockRejectedValue(new Error('Update failed'));
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    await act(async () => {
      await result.current.updateProduct(mockProduct);
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Update failed');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should clear error', async () => {
    vi.mocked(mockProductRepository.search).mockRejectedValue(new Error('Search failed'));
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    // Trigger an error
    await act(async () => {
      await result.current.searchProducts('test');
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
    let resolveSearch: (value: Product[]) => void;
    const searchPromise = new Promise<Product[]>((resolve) => {
      resolveSearch = resolve;
    });
    
    vi.mocked(mockProductRepository.search).mockReturnValue(searchPromise);
    
    const { result } = renderHook(() => useInventory({ manageInventoryUseCase }));
    
    act(() => {
      result.current.searchProducts('test');
    });
    
    // Should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Resolve the promise
    await act(async () => {
      resolveSearch(mockProducts);
      await searchPromise;
    });
    
    // Should no longer be loading
    expect(result.current.isLoading).toBe(false);
  });
});
