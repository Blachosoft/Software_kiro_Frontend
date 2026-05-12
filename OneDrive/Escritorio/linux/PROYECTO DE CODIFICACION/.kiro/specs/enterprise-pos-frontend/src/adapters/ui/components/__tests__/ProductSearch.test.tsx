/**
 * ProductSearch Component Tests
 * 
 * Tests search functionality, debouncing, keyboard navigation, and accessibility.
 * 
 * **Validates: Requirements 4.1, 6.2, 14.1, 14.2, 14.3, 15.3**
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductSearch } from '../ProductSearch';
import type { UseInventoryReturn } from '../../hooks/useInventory';
import { Money } from '../../../../domain/value-objects/Money';
import { Quantity } from '../../../../domain/value-objects/Quantity';
import type { Product } from '../../../../domain/entities/Product';

describe('ProductSearch', () => {
  let mockInventory: UseInventoryReturn;
  let mockOnProductSelect: (productId: string, quantity: number) => void;

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      code: 'P001',
      name: 'Product 1',
      price: Money.create(10.99),
      stock: Quantity.create(50),
      category: 'Electronics',
    },
    {
      id: 'prod-2',
      code: 'P002',
      name: 'Product 2',
      price: Money.create(25.50),
      stock: Quantity.create(30),
      category: 'Books',
    },
  ];

  beforeEach(() => {
    mockOnProductSelect = vi.fn() as unknown as (productId: string, quantity: number) => void;

    mockInventory = {
      products: [],
      currentProduct: null,
      isLoading: false,
      error: null,
      searchProducts: vi.fn(),
      getProduct: vi.fn(),
      updateProduct: vi.fn(),
      clearError: vi.fn(),
    };
  });

  describe('Rendering', () => {
    it('should render search input', () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      expect(screen.getByLabelText('Search products')).toBeInTheDocument();
    });

    it('should render quantity input', () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    });

    it('should use custom placeholder when provided', () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
          placeholder="Find products..."
        />
      );

      expect(screen.getByPlaceholderText('Find products...')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should call searchProducts after debounce delay', async () => {
      vi.useFakeTimers();

      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
          debounceMs={300}
        />
      );

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(mockInventory.searchProducts).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockInventory.searchProducts).toHaveBeenCalledWith('test');
      });

      vi.useRealTimers();
    });

    it('should not search for empty queries', async () => {
      vi.useFakeTimers();

      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: '   ' } });

      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockInventory.searchProducts).not.toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    it('should display search results', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      // Update products after render
      mockInventory.products = mockProducts;

      // Trigger search to open results
      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      // Wait for debounce and results to appear
      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    it('should display "No products found" when no results', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText('No products found')).toBeInTheDocument();
      });
    });
  });

  describe('Product Selection', () => {
    it('should call onProductSelect when product is clicked', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      const product1Button = screen.getByText('Product 1').closest('button');
      fireEvent.click(product1Button!);

      expect(mockOnProductSelect).toHaveBeenCalledWith('prod-1', 1);
    });

    it('should use custom quantity when selecting product', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      const quantityInput = screen.getByLabelText('Quantity');
      fireEvent.change(quantityInput, { target: { value: '5' } });

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      const product1Button = screen.getByText('Product 1').closest('button');
      fireEvent.click(product1Button!);

      expect(mockOnProductSelect).toHaveBeenCalledWith('prod-1', 5);
    });

    it('should clear search after selection', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      const product1Button = screen.getByText('Product 1').closest('button');
      fireEvent.click(product1Button!);

      expect(input.value).toBe('');
    });

    it('should reset quantity to 1 after selection', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      const quantityInput = screen.getByLabelText('Quantity') as HTMLInputElement;
      fireEvent.change(quantityInput, { target: { value: '5' } });

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      const product1Button = screen.getByText('Product 1').closest('button');
      fireEvent.click(product1Button!);

      expect(quantityInput.value).toBe('1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate down with ArrowDown key', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const firstProduct = screen.getByText('Product 1').closest('button');
      expect(firstProduct).toHaveClass('bg-blue-50');
    });

    it('should navigate up with ArrowUp key', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      // Navigate down twice
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Navigate up once
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const firstProduct = screen.getByText('Product 1').closest('button');
      expect(firstProduct).toHaveClass('bg-blue-50');
    });

    it('should select product with Enter key', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockOnProductSelect).toHaveBeenCalledWith('prod-1', 1);
    });

    it('should close results with Escape key', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      mockInventory.isLoading = true;

      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error occurs', () => {
      mockInventory.error = 'Failed to search products';

      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      expect(screen.getByText('Failed to search products')).toBeInTheDocument();
    });

    it('should clear error when typing', () => {
      mockInventory.error = 'Failed to search products';

      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'new search' } });

      expect(mockInventory.clearError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on search input', () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      const input = screen.getByLabelText('Search products');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-controls', 'product-results');
    });

    it('should set aria-expanded based on results visibility', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      
      // Initially collapsed
      expect(input).toHaveAttribute('aria-expanded', 'false');

      // Open results
      fireEvent.change(input, { target: { value: 'product' } });
      
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should have role="listbox" on results container', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });

    it('should have role="option" on product items', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
      });
    });

    it('should set aria-selected on highlighted option', async () => {
      render(
        <ProductSearch
          inventory={mockInventory}
          onProductSelect={mockOnProductSelect}
        />
      );

      mockInventory.products = mockProducts;

      const input = screen.getByLabelText('Search products');
      fireEvent.change(input, { target: { value: 'product' } });

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });
  });
});
