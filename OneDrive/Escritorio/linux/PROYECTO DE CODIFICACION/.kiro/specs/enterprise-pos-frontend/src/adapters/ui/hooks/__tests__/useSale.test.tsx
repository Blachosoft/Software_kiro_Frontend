/**
 * useSale Hook Tests
 * 
 * Component tests for useSale hook using React Testing Library.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useSale } from '../useSale';
import { SaleProvider } from '../../context/SaleContext';
import { ProcessSaleUseCase } from '../../../../application/use-cases/ProcessSaleUseCase';
import type { Sale, PaymentMethod } from '../../../../domain/entities/Sale';
import type { SaleRepository } from '../../../../domain/ports/SaleRepository';
import type { ProductRepository } from '../../../../domain/ports/ProductRepository';
import { Money } from '../../../../domain/value-objects/Money';
import { Quantity } from '../../../../domain/value-objects/Quantity';

describe('useSale Hook', () => {
  let mockSaleRepository: SaleRepository;
  let mockProductRepository: ProductRepository;
  let processSaleUseCase: ProcessSaleUseCase;
  
  const mockSale: Sale = {
    id: 'sale-1',
    items: [],
    status: 'draft',
    createdAt: new Date(),
  };
  
  const mockProduct = {
    id: 'product-1',
    code: 'P001',
    name: 'Test Product',
    price: Money.create(10),
    stock: Quantity.create(100),
    category: 'Test',
  };
  
  beforeEach(() => {
    mockSaleRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findByDateRange: vi.fn(),
      findByCustomerId: vi.fn(),
      findAll: vi.fn(),
    };
    
    mockProductRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      search: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    
    processSaleUseCase = new ProcessSaleUseCase(mockSaleRepository, mockProductRepository);
  });
  
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SaleProvider initialState={{ currentSale: mockSale }}>
      {children}
    </SaleProvider>
  );
  
  it('should throw error when used outside SaleProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useSale({ processSaleUseCase }));
    }).toThrow('useSale must be used within a SaleProvider');
    
    consoleError.mockRestore();
  });
  
  it('should return initial state', () => {
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper });
    
    expect(result.current.sale).toEqual(mockSale);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.total).toEqual(Money.create(0));
  });
  
  it('should add item to sale', async () => {
    vi.mocked(mockSaleRepository.findById).mockResolvedValue(mockSale);
    vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
    
    const updatedSale: Sale = {
      ...mockSale,
      items: [{
        productId: mockProduct.id,
        productName: mockProduct.name,
        quantity: Quantity.create(2),
        unitPrice: mockProduct.price,
        subtotal: Money.create(20),
      }],
    };
    
    vi.mocked(mockSaleRepository.save).mockResolvedValue(updatedSale);
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.addItem('product-1', 2);
    });
    
    await waitFor(() => {
      expect(result.current.sale?.items).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should handle add item error', async () => {
    vi.mocked(mockSaleRepository.findById).mockResolvedValue(mockSale);
    vi.mocked(mockProductRepository.findById).mockRejectedValue(new Error('Product not found'));
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper });
    
    await act(async () => {
      await result.current.addItem('invalid-product', 2);
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe('Product not found');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should remove item from sale', async () => {
    const saleWithItems: Sale = {
      ...mockSale,
      items: [{
        productId: 'product-1',
        productName: 'Test Product',
        quantity: Quantity.create(2),
        unitPrice: Money.create(10),
        subtotal: Money.create(20),
      }],
    };
    
    const wrapperWithItems = ({ children }: { children: ReactNode }) => (
      <SaleProvider initialState={{ currentSale: saleWithItems }}>
        {children}
      </SaleProvider>
    );
    
    vi.mocked(mockSaleRepository.findById).mockResolvedValue(saleWithItems);
    vi.mocked(mockSaleRepository.save).mockResolvedValue(mockSale);
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper: wrapperWithItems });
    
    await act(async () => {
      await result.current.removeItem(0);
    });
    
    await waitFor(() => {
      expect(result.current.sale?.items).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should update item quantity', async () => {
    const saleWithItems: Sale = {
      ...mockSale,
      items: [{
        productId: 'product-1',
        productName: 'Test Product',
        quantity: Quantity.create(2),
        unitPrice: Money.create(10),
        subtotal: Money.create(20),
      }],
    };
    
    const wrapperWithItems = ({ children }: { children: ReactNode }) => (
      <SaleProvider initialState={{ currentSale: saleWithItems }}>
        {children}
      </SaleProvider>
    );
    
    vi.mocked(mockSaleRepository.findById).mockResolvedValue(saleWithItems);
    vi.mocked(mockProductRepository.findById).mockResolvedValue(mockProduct);
    
    const updatedSale: Sale = {
      ...saleWithItems,
      items: [{
        ...saleWithItems.items[0],
        quantity: Quantity.create(5),
        subtotal: Money.create(50),
      }],
    };
    
    vi.mocked(mockSaleRepository.save).mockResolvedValue(updatedSale);
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper: wrapperWithItems });
    
    await act(async () => {
      await result.current.updateQuantity(0, 5);
    });
    
    await waitFor(() => {
      expect(result.current.sale?.items[0].quantity.value).toBe(5);
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should complete sale', async () => {
    const saleWithItems: Sale = {
      ...mockSale,
      items: [{
        productId: 'product-1',
        productName: 'Test Product',
        quantity: Quantity.create(2),
        unitPrice: Money.create(10),
        subtotal: Money.create(20),
      }],
    };
    
    const wrapperWithItems = ({ children }: { children: ReactNode }) => (
      <SaleProvider initialState={{ currentSale: saleWithItems }}>
        {children}
      </SaleProvider>
    );
    
    vi.mocked(mockSaleRepository.findById).mockResolvedValue(saleWithItems);
    
    const completedSale: Sale = {
      ...saleWithItems,
      status: 'completed',
      paymentMethod: 'cash' as PaymentMethod,
      completedAt: new Date(),
    };
    
    vi.mocked(mockSaleRepository.save).mockResolvedValue(completedSale);
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper: wrapperWithItems });
    
    await act(async () => {
      await result.current.completeSale('cash');
    });
    
    await waitFor(() => {
      expect(result.current.sale?.status).toBe('completed');
      expect(result.current.sale?.paymentMethod).toBe('cash');
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  it('should calculate total correctly', () => {
    const saleWithItems: Sale = {
      ...mockSale,
      items: [
        {
          productId: 'product-1',
          productName: 'Product 1',
          quantity: Quantity.create(2),
          unitPrice: Money.create(10),
          subtotal: Money.create(20),
        },
        {
          productId: 'product-2',
          productName: 'Product 2',
          quantity: Quantity.create(3),
          unitPrice: Money.create(15),
          subtotal: Money.create(45),
        },
      ],
    };
    
    const wrapperWithItems = ({ children }: { children: ReactNode }) => (
      <SaleProvider initialState={{ currentSale: saleWithItems }}>
        {children}
      </SaleProvider>
    );
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper: wrapperWithItems });
    
    expect(result.current.total.amount).toBe(65);
  });
  
  it('should clear sale', () => {
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper });
    
    act(() => {
      result.current.clearSale();
    });
    
    expect(result.current.sale).toBe(null);
  });
  
  it('should handle error when no active sale', async () => {
    const wrapperNoSale = ({ children }: { children: ReactNode }) => (
      <SaleProvider initialState={{ currentSale: null }}>
        {children}
      </SaleProvider>
    );
    
    const { result } = renderHook(() => useSale({ processSaleUseCase }), { wrapper: wrapperNoSale });
    
    await act(async () => {
      await result.current.addItem('product-1', 2);
    });
    
    expect(result.current.error).toBe('No active sale');
  });
});
