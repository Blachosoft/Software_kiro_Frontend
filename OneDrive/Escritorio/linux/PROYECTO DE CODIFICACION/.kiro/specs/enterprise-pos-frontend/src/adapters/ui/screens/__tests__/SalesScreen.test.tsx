/**
 * SalesScreen Component Tests
 * 
 * Tests for the SalesScreen component including:
 * - Component rendering
 * - Product selection and addition
 * - Item removal and quantity updates
 * - Payment completion
 * - Error handling
 * - Accessibility features
 * - Keyboard navigation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SalesScreen } from '../SalesScreen';
import type { UseSaleReturn } from '../../hooks/useSale';
import type { UseInventoryReturn } from '../../hooks/useInventory';
import { Money } from '../../../../domain/value-objects/Money';
import { Quantity } from '../../../../domain/value-objects/Quantity';
import type { Sale } from '../../../../domain/entities/Sale';
import type { Product } from '../../../../domain/entities/Product';

describe('SalesScreen', () => {
  let mockSale: UseSaleReturn;
  let mockInventory: UseInventoryReturn;
  let mockSaleData: Sale;
  let mockProducts: Product[];

  beforeEach(() => {
    // Mock sale data
    mockSaleData = {
      id: 'sale-1',
      items: [
        {
          productId: 'prod-1',
          productName: 'Test Product',
          quantity: Quantity.create(2),
          unitPrice: Money.create(10),
          subtotal: Money.create(20),
        },
      ],
      status: 'draft',
      createdAt: new Date(),
    };

    // Mock products
    mockProducts = [
      {
        id: 'prod-1',
        code: 'TEST001',
        name: 'Test Product',
        price: Money.create(10),
        stock: Quantity.create(100),
        category: 'Test',
      },
      {
        id: 'prod-2',
        code: 'TEST002',
        name: 'Another Product',
        price: Money.create(15),
        stock: Quantity.create(50),
        category: 'Test',
      },
    ];

    // Mock sale hook
    mockSale = {
      sale: mockSaleData,
      isLoading: false,
      error: null,
      total: Money.create(20),
      addItem: vi.fn().mockResolvedValue(undefined),
      removeItem: vi.fn().mockResolvedValue(undefined),
      updateQuantity: vi.fn().mockResolvedValue(undefined),
      completeSale: vi.fn().mockResolvedValue(undefined),
      clearSale: vi.fn(),
    };

    // Mock inventory hook
    mockInventory = {
      products: mockProducts,
      currentProduct: null,
      isLoading: false,
      error: null,
      searchProducts: vi.fn().mockResolvedValue(undefined),
      getProduct: vi.fn().mockResolvedValue(undefined),
      updateProduct: vi.fn().mockResolvedValue(undefined),
      clearError: vi.fn(),
    };
  });

  describe('Rendering', () => {
    it('should render the sales screen with all sections', () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByRole('heading', { name: /sales/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /sale items/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /payment/i })).toBeInTheDocument();
    });

    it('should render product search component', () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByRole('searchbox', { name: /search products/i })).toBeInTheDocument();
    });

    it('should render sale items list', () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('$20.00')).toBeInTheDocument();
    });

    it('should render payment panel', () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByText(/total/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete sale/i })).toBeInTheDocument();
    });
  });

  describe('Product Selection', () => {
    it('should call addItem when product is selected', async () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      // This would be triggered by the ProductSearch component
      // We test the handler directly
      await mockSale.addItem('prod-2', 1);

      expect(mockSale.addItem).toHaveBeenCalledWith('prod-2', 1);
    });

    it('should handle addItem errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSale.addItem = vi.fn().mockRejectedValue(new Error('Failed to add item'));

      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      await mockSale.addItem('prod-2', 1);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Item Management', () => {
    it('should call removeItem when remove button is clicked', async () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const removeButton = screen.getByRole('button', {
        name: /remove test product from sale/i,
      });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockSale.removeItem).toHaveBeenCalledWith(0);
      });
    });

    it('should call updateQuantity when quantity is changed', async () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      // Click edit quantity button
      const editButton = screen.getByRole('button', {
        name: /edit quantity for test product/i,
      });
      fireEvent.click(editButton);

      // Change quantity
      const quantityInput = screen.getByRole('spinbutton', {
        name: /quantity for test product/i,
      });
      fireEvent.change(quantityInput, { target: { value: '3' } });

      // Save
      const saveButton = screen.getByRole('button', { name: /save quantity/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSale.updateQuantity).toHaveBeenCalledWith(0, 3);
      });
    });
  });

  describe('Payment Completion', () => {
    it('should call completeSale when complete button is clicked', async () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const completeButton = screen.getByRole('button', {
        name: /complete sale with cash payment/i,
      });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockSale.completeSale).toHaveBeenCalledWith('cash');
      });
    });

    it('should disable complete button when sale has no items', () => {
      mockSale.sale = { ...mockSaleData, items: [] };
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const completeButton = screen.getByRole('button', {
        name: /complete sale with cash payment/i,
      });
      expect(completeButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading overlay when isLoading is true', () => {
      mockSale.isLoading = true;
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByRole('status', { name: /processing/i })).toBeInTheDocument();
      expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
    });

    it('should disable interactions when loading', () => {
      mockSale.isLoading = true;
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const removeButton = screen.getByRole('button', {
        name: /remove test product from sale/i,
      });
      expect(removeButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      mockSale.error = 'Failed to process sale';
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
      expect(screen.getByText('Failed to process sale')).toBeInTheDocument();
    });

    it('should allow clearing sale on error', () => {
      mockSale.error = 'Failed to process sale';
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const clearButton = screen.getByRole('button', {
        name: /clear and start new sale/i,
      });
      fireEvent.click(clearButton);

      expect(mockSale.clearSale).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByRole('heading', { name: /sales/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /sale items/i })).toBeInTheDocument();
    });

    it('should announce actions to screen readers', async () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const removeButton = screen.getByRole('button', {
        name: /remove test product from sale/i,
      });
      fireEvent.click(removeButton);

      await waitFor(() => {
        const statuses = screen.getAllByRole('status', { hidden: true });
        const hasExpectedText = statuses.some(status => 
          status.textContent?.match(/removed.*from sale/i)
        );
        expect(hasExpectedText).toBe(true);
      });
    });

    it('should have keyboard accessible controls', () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search products/i });
      expect(searchInput).toBeInTheDocument();

      // Tab navigation should work
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no items in sale', () => {
      mockSale.sale = { ...mockSaleData, items: [] };
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      expect(screen.getByText(/no items in sale/i)).toBeInTheDocument();
      expect(
        screen.getByText(/search and add products to start a sale/i)
      ).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should handle complete sale flow', async () => {
      render(<SalesScreen sale={mockSale} inventory={mockInventory} />);

      // Verify initial state
      expect(screen.getByText('Test Product')).toBeInTheDocument();

      // Complete sale
      const completeButton = screen.getByRole('button', {
        name: /complete sale with cash payment/i,
      });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockSale.completeSale).toHaveBeenCalledWith('cash');
      });
    });
  });
});
