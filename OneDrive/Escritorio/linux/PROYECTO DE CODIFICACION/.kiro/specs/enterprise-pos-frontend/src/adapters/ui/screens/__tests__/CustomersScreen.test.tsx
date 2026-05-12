/**
 * CustomersScreen Component Tests
 * 
 * Tests for the CustomersScreen component including:
 * - Component rendering
 * - Customer search
 * - Customer creation form with validation
 * - Customer detail view
 * - Error handling
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomersScreen } from '../CustomersScreen';
import type { UseCustomerReturn } from '../../hooks/useCustomer';
import { Money } from '../../../../domain/value-objects/Money';
import { Email } from '../../../../domain/value-objects/Email';
import { PhoneNumber } from '../../../../domain/value-objects/PhoneNumber';
import type { Customer } from '../../../../domain/entities/Customer';

describe('CustomersScreen', () => {
  let mockCustomer: UseCustomerReturn;
  let mockCustomers: Customer[];

  beforeEach(() => {
    mockCustomers = [
      {
        id: 'cust-1',
        name: 'John Doe',
        email: Email.create('john@example.com'),
        phone: PhoneNumber.create('+1234567890'),
        createdAt: new Date('2024-01-01'),
        totalPurchases: Money.create(500),
      },
      {
        id: 'cust-2',
        name: 'Jane Smith',
        email: Email.create('jane@example.com'),
        createdAt: new Date('2024-01-15'),
        totalPurchases: Money.create(250),
      },
    ];

    mockCustomer = {
      customers: mockCustomers,
      currentCustomer: null,
      isLoading: false,
      error: null,
      createCustomer: vi.fn().mockResolvedValue(undefined),
      searchCustomers: vi.fn().mockResolvedValue(undefined),
      getCustomer: vi.fn().mockResolvedValue(undefined),
      clearError: vi.fn(),
    };
  });

  describe('Rendering', () => {
    it('should render the customers screen with all sections', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByRole('heading', { name: /^customers$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new customer/i })).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      expect(
        screen.getByRole('searchbox', { name: /search customers/i })
      ).toBeInTheDocument();
    });

    it('should render customer list', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  describe('Customer Search', () => {
    it('should call searchCustomers when search input changes', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const searchInput = screen.getByRole('searchbox', { name: /search customers/i });
      fireEvent.change(searchInput, { target: { value: 'john' } });

      await waitFor(() => {
        expect(mockCustomer.searchCustomers).toHaveBeenCalledWith('john');
      });
    });

    it('should not search with empty query', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const searchInput = screen.getByRole('searchbox', { name: /search customers/i });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(mockCustomer.searchCustomers).not.toHaveBeenCalled();
      });
    });
  });

  describe('Customer Selection', () => {
    it('should call getCustomer when customer is selected', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const customerButton = screen.getByRole('button', { name: /select john doe/i });
      fireEvent.click(customerButton);

      await waitFor(() => {
        expect(mockCustomer.getCustomer).toHaveBeenCalledWith('cust-1');
      });
    });

    it('should display customer details when selected', () => {
      mockCustomer.currentCustomer = mockCustomers[0];
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByRole('heading', { name: /john doe/i })).toBeInTheDocument();
      expect(screen.getByText('cust-1')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('$500.00 USD')).toBeInTheDocument();
    });
  });

  describe('Customer Creation Form', () => {
    it('should show create form when new customer button is clicked', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      expect(screen.getByRole('heading', { name: /new customer/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
    });

    it('should validate required name field', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      // Submit without name
      const createButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
      });

      expect(mockCustomer.createCustomer).not.toHaveBeenCalled();
    });

    it('should validate at least one contact method is required', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      // Fill name only
      const nameInput = screen.getByLabelText(/customer name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });

      // Submit without contact
      const createButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByText(/at least one contact method.*is required/i)
        ).toBeInTheDocument();
      });

      expect(mockCustomer.createCustomer).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      const nameInput = screen.getByLabelText(/customer name/i);
      fireEvent.change(nameInput, { target: { value: 'Test Customer' } });

      const emailInput = screen.getByLabelText(/^email$/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const createButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      expect(mockCustomer.createCustomer).not.toHaveBeenCalled();
    });

    it('should create customer with valid data', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      const nameInput = screen.getByLabelText(/customer name/i);
      fireEvent.change(nameInput, { target: { value: 'New Customer' } });

      const emailInput = screen.getByLabelText(/^email$/i);
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      const createButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCustomer.createCustomer).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Customer',
            email: expect.objectContaining({ value: 'new@example.com' }),
          })
        );
      });
    });

    it('should cancel create and return to list view', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      expect(screen.getByRole('heading', { name: /new customer/i })).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(
        screen.queryByRole('heading', { name: /new customer/i })
      ).not.toBeInTheDocument();
    });

    it('should clear validation errors when field is corrected', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      // Submit to trigger error
      const createButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
      });

      // Fix the error
      const nameInput = screen.getByLabelText(/customer name/i);
      fireEvent.change(nameInput, { target: { value: 'Fixed Name' } });

      await waitFor(() => {
        expect(
          screen.queryByText(/customer name is required/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading customers', () => {
      mockCustomer.isLoading = true;
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByText(/loading customers\.\.\./i)).toBeInTheDocument();
    });

    it('should disable form when creating customer', () => {
      mockCustomer.isLoading = true;
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      const createButton = screen.getByRole('button', { name: /creating\.\.\./i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error exists', () => {
      mockCustomer.error = 'Failed to load customers';
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load customers')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no customers found', () => {
      mockCustomer.customers = [];
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByText(/no customers found/i)).toBeInTheDocument();
    });

    it('should show placeholder when no customer selected', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByText(/select a customer to view details/i)).toBeInTheDocument();
    });
  });

  describe('Purchase History', () => {
    it('should display purchase history section', () => {
      mockCustomer.currentCustomer = mockCustomers[0];
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByRole('heading', { name: /purchase history/i })).toBeInTheDocument();
    });

    it('should show empty state for purchase history', () => {
      mockCustomer.currentCustomer = mockCustomers[0];
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByText(/no purchase history available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      expect(screen.getByRole('list', { name: /customer list/i })).toBeInTheDocument();
      expect(
        screen.getByRole('searchbox', { name: /search customers/i })
      ).toBeInTheDocument();
    });

    it('should have accessible form labels', () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
    });

    it('should mark invalid fields with aria-invalid', async () => {
      render(<CustomersScreen customer={mockCustomer} />);

      const newButton = screen.getByRole('button', { name: /new customer/i });
      fireEvent.click(newButton);

      const createButton = screen.getByRole('button', { name: /create customer/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/customer name/i);
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });
});
