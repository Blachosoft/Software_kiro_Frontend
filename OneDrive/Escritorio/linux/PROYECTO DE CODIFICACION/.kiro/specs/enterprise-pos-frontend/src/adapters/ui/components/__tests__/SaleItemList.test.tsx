/**
 * SaleItemList Component Tests
 * 
 * Tests item display, removal, quantity updates, and accessibility.
 * 
 * **Validates: Requirements 4.1, 5.2, 5.3, 14.1, 14.5, 15.3**
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaleItemList } from '../SaleItemList';
import type { SaleItem } from '../../../../domain/entities/Sale';
import { Money } from '../../../../domain/value-objects/Money';
import { Quantity } from '../../../../domain/value-objects/Quantity';

describe('SaleItemList', () => {
  let mockOnRemoveItem: (itemIndex: number) => void;
  let mockOnUpdateQuantity: (itemIndex: number, newQuantity: number) => void;

  const mockItems: SaleItem[] = [
    {
      productId: 'prod-1',
      productName: 'Product 1',
      quantity: Quantity.create(2),
      unitPrice: Money.create(10.99),
      subtotal: Money.create(21.98),
    },
    {
      productId: 'prod-2',
      productName: 'Product 2',
      quantity: Quantity.create(1),
      unitPrice: Money.create(25.50),
      subtotal: Money.create(25.50),
    },
  ];

  beforeEach(() => {
    mockOnRemoveItem = vi.fn() as unknown as (itemIndex: number) => void;
    mockOnUpdateQuantity = vi.fn() as unknown as (itemIndex: number, newQuantity: number) => void;
  });

  describe('Rendering', () => {
    it('should display empty state when no items', () => {
      render(
        <SaleItemList
          items={[]}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByText('No items in sale')).toBeInTheDocument();
      expect(
        screen.getByText('Search and add products to start a sale')
      ).toBeInTheDocument();
    });

    it('should display all sale items', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });

    it('should display product prices', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByText('$10.99 each')).toBeInTheDocument();
      expect(screen.getByText('$25.50 each')).toBeInTheDocument();
    });

    it('should display quantities', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByText('Qty: 2')).toBeInTheDocument();
      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
    });

    it('should display subtotals', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByText('$21.98')).toBeInTheDocument();
      expect(screen.getByText('$25.50')).toBeInTheDocument();
    });
  });

  describe('Remove Item', () => {
    it('should call onRemoveItem when remove button clicked', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      const removeButtons = screen.getAllByLabelText(/Remove .* from sale/);
      fireEvent.click(removeButtons[0]);

      expect(mockOnRemoveItem).toHaveBeenCalledWith(0);
    });

    it('should announce removal to screen readers', async () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      const removeButton = screen.getByLabelText('Remove Product 1 from sale');
      fireEvent.click(removeButton);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('Removed Product 1 from sale');
      });
    });

    it('should disable remove button when loading', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          isLoading={true}
        />
      );

      const removeButtons = screen.getAllByLabelText(/Remove .* from sale/);
      expect(removeButtons[0]).toBeDisabled();
    });
  });

  describe('Update Quantity', () => {
    it('should show quantity input when edit button clicked', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      expect(
        screen.getByLabelText('Edit quantity for Product 1')
      ).toBeInTheDocument();
    });

    it('should call onUpdateQuantity when save button clicked', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      // Start editing
      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      // Change quantity
      const quantityInput = screen.getByLabelText('Edit quantity for Product 1');
      fireEvent.change(quantityInput, { target: { value: '5' } });

      // Save
      const saveButton = screen.getByLabelText('Save quantity');
      fireEvent.click(saveButton);

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(0, 5);
    });

    it('should cancel editing when cancel button clicked', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      // Start editing
      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      // Cancel
      const cancelButton = screen.getByLabelText('Cancel editing');
      fireEvent.click(cancelButton);

      // Should show edit button again
      expect(
        screen.getByLabelText('Edit quantity for Product 1, current quantity: 2')
      ).toBeInTheDocument();
    });

    it('should save quantity on Enter key', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      // Start editing
      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      // Change quantity and press Enter
      const quantityInput = screen.getByLabelText('Edit quantity for Product 1');
      fireEvent.change(quantityInput, { target: { value: '3' } });
      fireEvent.keyDown(quantityInput, { key: 'Enter' });

      expect(mockOnUpdateQuantity).toHaveBeenCalledWith(0, 3);
    });

    it('should cancel editing on Escape key', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      // Start editing
      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      // Press Escape
      const quantityInput = screen.getByLabelText('Edit quantity for Product 1');
      fireEvent.keyDown(quantityInput, { key: 'Escape' });

      // Should show edit button again
      expect(
        screen.getByLabelText('Edit quantity for Product 1, current quantity: 2')
      ).toBeInTheDocument();
    });

    it('should announce quantity update to screen readers', async () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      // Start editing
      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      // Change and save
      const quantityInput = screen.getByLabelText('Edit quantity for Product 1');
      fireEvent.change(quantityInput, { target: { value: '5' } });
      const saveButton = screen.getByLabelText('Save quantity');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(
          'Updated Product 1 quantity to 5'
        );
      });
    });

    it('should not update with invalid quantity', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      // Start editing
      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      fireEvent.click(editButton);

      // Try to set invalid quantity (0)
      const quantityInput = screen.getByLabelText('Edit quantity for Product 1');
      fireEvent.change(quantityInput, { target: { value: '0' } });
      
      // Try to save
      const saveButton = screen.getByLabelText('Save quantity');
      fireEvent.click(saveButton);

      // Should not call onUpdateQuantity with 0
      expect(mockOnUpdateQuantity).not.toHaveBeenCalled();
    });

    it('should disable edit controls when loading', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          isLoading={true}
        />
      );

      const editButton = screen.getByLabelText(
        'Edit quantity for Product 1, current quantity: 2'
      );
      expect(editButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="list" on container', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should have aria-label on list', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Sale items');
    });

    it('should have role="listitem" on each item', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should have ARIA live region for announcements', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have descriptive button labels', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
        />
      );

      expect(
        screen.getByLabelText('Remove Product 1 from sale')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Edit quantity for Product 1, current quantity: 2')
      ).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should apply opacity when loading', () => {
      render(
        <SaleItemList
          items={mockItems}
          onRemoveItem={mockOnRemoveItem}
          onUpdateQuantity={mockOnUpdateQuantity}
          isLoading={true}
        />
      );

      const items = screen.getAllByRole('listitem');
      items.forEach((item) => {
        expect(item).toHaveClass('opacity-50');
      });
    });
  });
});
