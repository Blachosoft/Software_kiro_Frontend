/**
 * PaymentPanel Component Tests
 * 
 * Tests payment method selection, sale completion, and accessibility.
 * 
 * **Validates: Requirements 4.1, 5.4, 5.5, 14.1, 15.3**
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentPanel } from '../PaymentPanel';
import { Money } from '../../../../domain/value-objects/Money';
import type { PaymentMethod } from '../../../../domain/entities/Sale';

describe('PaymentPanel', () => {
  let mockOnCompleteSale: (paymentMethod: PaymentMethod) => void;

  beforeEach(() => {
    mockOnCompleteSale = vi.fn() as unknown as (paymentMethod: PaymentMethod) => void;
  });

  describe('Rendering', () => {
    it('should display total amount', () => {
      const total = Money.create(47.48);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(screen.getByText('$47.48')).toBeInTheDocument();
    });

    it('should display currency', () => {
      const total = Money.create(100, 'EUR');

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(screen.getByText('EUR')).toBeInTheDocument();
    });

    it('should display all payment methods', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(screen.getByLabelText('Pay with Cash')).toBeInTheDocument();
      expect(screen.getByLabelText('Pay with Card')).toBeInTheDocument();
      expect(screen.getByLabelText('Pay with Transfer')).toBeInTheDocument();
    });

    it('should have cash selected by default', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cashRadio = screen.getByLabelText('Pay with Cash') as HTMLInputElement;
      expect(cashRadio.checked).toBe(true);
    });

    it('should display complete sale button', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(screen.getByText('Complete Sale')).toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    it('should select cash payment method', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cashLabel = screen.getByLabelText('Pay with Cash').closest('label');
      fireEvent.click(cashLabel!);

      const cashRadio = screen.getByLabelText('Pay with Cash') as HTMLInputElement;
      expect(cashRadio.checked).toBe(true);
    });

    it('should select card payment method', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cardLabel = screen.getByLabelText('Pay with Card').closest('label');
      fireEvent.click(cardLabel!);

      const cardRadio = screen.getByLabelText('Pay with Card') as HTMLInputElement;
      expect(cardRadio.checked).toBe(true);
    });

    it('should select transfer payment method', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const transferLabel = screen.getByLabelText('Pay with Transfer').closest('label');
      fireEvent.click(transferLabel!);

      const transferRadio = screen.getByLabelText(
        'Pay with Transfer'
      ) as HTMLInputElement;
      expect(transferRadio.checked).toBe(true);
    });

    it('should highlight selected payment method', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cardLabel = screen.getByLabelText('Pay with Card').closest('label');
      fireEvent.click(cardLabel!);

      expect(cardLabel).toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  describe('Complete Sale', () => {
    it('should call onCompleteSale with selected payment method', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      fireEvent.click(completeButton);

      expect(mockOnCompleteSale).toHaveBeenCalledWith('cash');
    });

    it('should call onCompleteSale with card payment method', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cardLabel = screen.getByLabelText('Pay with Card').closest('label');
      fireEvent.click(cardLabel!);

      const completeButton = screen.getByText('Complete Sale');
      fireEvent.click(completeButton);

      expect(mockOnCompleteSale).toHaveBeenCalledWith('card');
    });

    it('should complete sale on Enter key', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      fireEvent.keyDown(completeButton, { key: 'Enter' });

      expect(mockOnCompleteSale).toHaveBeenCalledWith('cash');
    });

    it('should not complete sale when disabled', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          disabled={true}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      fireEvent.click(completeButton);

      expect(mockOnCompleteSale).not.toHaveBeenCalled();
    });

    it('should not complete sale when loading', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          isLoading={true}
        />
      );

      const completeButton = screen.getByText('Processing...');
      fireEvent.click(completeButton);

      expect(mockOnCompleteSale).not.toHaveBeenCalled();
    });

    it('should not complete sale when total is zero', () => {
      const total = Money.create(0);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      fireEvent.click(completeButton);

      expect(mockOnCompleteSale).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          isLoading={true}
        />
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should disable complete button when loading', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          isLoading={true}
        />
      );

      const completeButton = screen.getByText('Processing...');
      expect(completeButton).toBeDisabled();
    });

    it('should disable payment method selection when loading', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          isLoading={true}
        />
      );

      const cashRadio = screen.getByLabelText('Pay with Cash');
      expect(cashRadio).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error occurs', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          error="Payment processing failed"
        />
      );

      expect(screen.getByText('Payment processing failed')).toBeInTheDocument();
    });

    it('should have role="alert" on error message', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
          error="Payment processing failed"
        />
      );

      const errorMessage = screen.getByText('Payment processing failed');
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });
  });

  describe('Zero Total', () => {
    it('should disable complete button when total is zero', () => {
      const total = Money.create(0);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      expect(completeButton).toBeDisabled();
    });

    it('should display message when total is zero', () => {
      const total = Money.create(0);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(
        screen.getByText('Add items to the sale to continue')
      ).toBeInTheDocument();
    });

    it('should disable payment method selection when total is zero', () => {
      const total = Money.create(0);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cashRadio = screen.getByLabelText('Pay with Cash');
      expect(cashRadio).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have fieldset for payment methods', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('should have legend for payment methods', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
    });

    it('should have aria-label on total amount', () => {
      const total = Money.create(47.48);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const totalElement = screen.getByText('$47.48');
      expect(totalElement).toHaveAttribute(
        'aria-label',
        'Total amount: 47.48 USD'
      );
    });

    it('should have aria-label on complete button', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      expect(completeButton).toHaveAttribute(
        'aria-label',
        'Complete sale with cash payment'
      );
    });

    it('should update aria-label when payment method changes', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const cardLabel = screen.getByLabelText('Pay with Card').closest('label');
      fireEvent.click(cardLabel!);

      const completeButton = screen.getByText('Complete Sale');
      expect(completeButton).toHaveAttribute(
        'aria-label',
        'Complete sale with card payment'
      );
    });

    it('should have aria-disabled when disabled', () => {
      const total = Money.create(0);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const completeButton = screen.getByText('Complete Sale');
      expect(completeButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should hide decorative icons from screen readers', () => {
      const total = Money.create(50);

      render(
        <PaymentPanel
          total={total}
          onCompleteSale={mockOnCompleteSale}
        />
      );

      const icons = screen.getByRole('group').querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
