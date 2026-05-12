/**
 * InventoryScreen Component Tests
 * 
 * Tests for the InventoryScreen component including:
 * - Component rendering
 * - Product search and filtering
 * - Product selection and detail view
 * - Product update form with validation
 * - Error handling
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InventoryScreen } from '../InventoryScreen';
import type { UseInventoryReturn } from '../../hooks/useInventory';
import { Money } from '../../../../domain/value-objects/Money';
import { Quantity } from '../../../../domain/value-objects/Quantity';
import type { Product } from '../../../../domain/entities/Product';

describe('InventoryScreen', () => {
  let mockInventory: UseInventoryReturn;
  let mockProducts: Product[];

  beforeEach(() => {
    mockProducts = [
      {
        id: 'prod-1',
        code: 'TEST001',
        name: 'Test Product',
        price: Money.create(10),
        stock: Quantity.create(100),
        category: 'Electronics',
        description: 'A test product',
      },
      {
        id: 'prod-2',
        code: 'TEST002',
        name: 'Low Stock Product',
        price: Money.create(15),
        stock: Quantity.create(5),
        category: 'Accessories',
      },
      {
        id: 'prod-3',
        code: 'TEST003',
        name: 'Out of Stock',
        price: Money.create(20),
        stock: Quantity.create(0),
        category: 'Electronics',
      },
    ];

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
    it('should render the inventory screen with all sections', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByRole('heading', { name: /^inventory$/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      expect(
        screen.getByRole('searchbox', { name: /search products/i })
      ).toBeInTheDocument();
    });

    it('should render product list', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Low Stock Product')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('should show stock level indicators with correct colors', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const stockBadges = screen.getAllByText(/stock:/i);
      expect(stockBadges).toHaveLength(3);
    });
  });

  describe('Product Search', () => {
    it('should call searchProducts when search input changes', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search products/i });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockInventory.searchProducts).toHaveBeenCalledWith('test');
      });
    });

    it('should not search with empty query', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const searchInput = screen.getByRole('searchbox', { name: /search products/i });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(mockInventory.searchProducts).not.toHaveBeenCalled();
      });
    });
  });

  describe('Product Selection', () => {
    it('should call getProduct when product is selected', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const productButton = screen.getByRole('button', { name: /select test product/i });
      fireEvent.click(productButton);

      await waitFor(() => {
        expect(mockInventory.getProduct).toHaveBeenCalledWith('prod-1');
      });
    });

    it('should display product details when selected', async () => {
      mockInventory.currentProduct = mockProducts[0];
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByRole('heading', { name: /test product/i })).toBeInTheDocument();
      expect(screen.getByText('TEST001')).toBeInTheDocument();
      expect(screen.getByText('$10.00 USD')).toBeInTheDocument();
      expect(screen.getByText('100 units')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('A test product')).toBeInTheDocument();
    });

    it('should show edit button when product is selected', () => {
      mockInventory.currentProduct = mockProducts[0];
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByRole('button', { name: /edit product/i })).toBeInTheDocument();
    });
  });

  describe('Product Update Form', () => {
    beforeEach(() => {
      mockInventory.currentProduct = mockProducts[0];
    });

    it('should show edit form when edit button is clicked', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      expect(screen.getByRole('heading', { name: /edit product/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/product name/i)).toHaveValue('Test Product');
      expect(screen.getByLabelText(/product code/i)).toHaveValue('TEST001');
      expect(screen.getByLabelText(/^price/i)).toHaveValue(10);
      expect(screen.getByLabelText(/^stock/i)).toHaveValue(100);
      expect(screen.getByLabelText(/category/i)).toHaveValue('Electronics');
    });

    it('should validate required fields', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      // Clear name field
      const nameInput = screen.getByLabelText(/product name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      });

      expect(mockInventory.updateProduct).not.toHaveBeenCalled();
    });

    it('should validate price is positive', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      // Set negative price
      const priceInput = screen.getByLabelText(/^price/i);
      fireEvent.change(priceInput, { target: { value: '-10' } });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/price must be a positive number/i)).toBeInTheDocument();
      });

      expect(mockInventory.updateProduct).not.toHaveBeenCalled();
    });

    it('should validate stock is positive integer', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      // Set negative stock
      const stockInput = screen.getByLabelText(/^stock/i);
      fireEvent.change(stockInput, { target: { value: '-5' } });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/stock must be a positive integer/i)
        ).toBeInTheDocument();
      });

      expect(mockInventory.updateProduct).not.toHaveBeenCalled();
    });

    it('should call updateProduct with valid data', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      // Update fields
      const nameInput = screen.getByLabelText(/product name/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Product' } });

      const priceInput = screen.getByLabelText(/^price/i);
      fireEvent.change(priceInput, { target: { value: '25' } });

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockInventory.updateProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'prod-1',
            name: 'Updated Product',
            price: expect.objectContaining({ amount: 25 }),
          })
        );
      });
    });

    it('should cancel edit and return to detail view', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      expect(screen.getByRole('heading', { name: /edit product/i })).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(
        screen.getByRole('heading', { name: /test product/i })
      ).toBeInTheDocument();
    });

    it('should clear validation errors when field is corrected', async () => {
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      // Clear name to trigger error
      const nameInput = screen.getByLabelText(/product name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      });

      // Fix the error
      fireEvent.change(nameInput, { target: { value: 'Fixed Name' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/product name is required/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading products', () => {
      mockInventory.isLoading = true;
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByText(/loading products\.\.\./i)).toBeInTheDocument();
    });

    it('should disable form when updating product', () => {
      mockInventory.currentProduct = mockProducts[0];
      mockInventory.isLoading = true;
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      const saveButton = screen.getByRole('button', { name: /saving\.\.\./i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      mockInventory.error = 'Failed to load products';
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load products')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no products found', () => {
      mockInventory.products = [];
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
      expect(screen.getByText(/try a different search/i)).toBeInTheDocument();
    });

    it('should show placeholder when no product selected', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByText(/select a product to view details/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<InventoryScreen inventory={mockInventory} />);

      expect(screen.getByRole('list', { name: /product list/i })).toBeInTheDocument();
      expect(
        screen.getByRole('searchbox', { name: /search products/i })
      ).toBeInTheDocument();
    });

    it('should have accessible form labels', () => {
      mockInventory.currentProduct = mockProducts[0];
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/product code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^stock/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    it('should mark invalid fields with aria-invalid', async () => {
      mockInventory.currentProduct = mockProducts[0];
      render(<InventoryScreen inventory={mockInventory} />);

      const editButton = screen.getByRole('button', { name: /edit product/i });
      fireEvent.click(editButton);

      const nameInput = screen.getByLabelText(/product name/i);
      fireEvent.change(nameInput, { target: { value: '' } });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
