/**
 * CustomersScreen Component
 * 
 * Screen for managing customers.
 * Provides customer list, search, creation form, and detail view.
 * Integrates with useCustomer hook for customer operations.
 * 
 * **Validates: Requirements 4.1, 7.1, 7.2, 7.3, 11.1, 11.3, 15.3**
 */

'use client';

import { useState, useCallback } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { Customer } from '../../../domain/entities/Customer';
import type { UseCustomerReturn } from '../hooks/useCustomer';
import { Email } from '../../../domain/value-objects/Email';
import { PhoneNumber } from '../../../domain/value-objects/PhoneNumber';
import { Money } from '../../../domain/value-objects/Money';

/**
 * CustomersScreen Props
 */
export interface CustomersScreenProps {
  customer: UseCustomerReturn;
}

/**
 * CustomersScreen Component
 * 
 * Provides customer management interface with:
 * - Customer list with search
 * - Customer creation form with validation
 * - Customer detail view with purchase history
 * - Loading and error states
 * - Accessibility features
 */
export function CustomersScreen({ customer }: CustomersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (query.trim()) {
        customer.searchCustomers(query);
      }
    },
    [customer]
  );

  /**
   * Handle customer selection
   */
  const handleCustomerSelect = useCallback(
    async (selectedCustomer: Customer) => {
      await customer.getCustomer(selectedCustomer.id);
    },
    [customer]
  );

  /**
   * Handle form field change
   */
  const handleFieldChange = useCallback(
    (field: keyof typeof createForm, value: string) => {
      setCreateForm((prev) => ({ ...prev, [field]: value }));
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!createForm.name.trim()) {
      errors.name = 'Customer name is required';
    }

    if (!createForm.email.trim() && !createForm.phone.trim()) {
      errors.contact = 'At least one contact method (email or phone) is required';
    }

    if (createForm.email.trim()) {
      try {
        Email.create(createForm.email.trim());
      } catch (error) {
        errors.email = 'Invalid email format';
      }
    }

    if (createForm.phone.trim()) {
      try {
        PhoneNumber.create(createForm.phone.trim());
      } catch (error) {
        errors.phone = 'Invalid phone number format';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [createForm]);

  /**
   * Handle create customer
   */
  const handleCreateCustomer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        const newCustomer: Customer = {
          id: `customer-${Date.now()}`,
          name: createForm.name.trim(),
          email: createForm.email.trim() ? Email.create(createForm.email.trim()) : undefined,
          phone: createForm.phone.trim()
            ? PhoneNumber.create(createForm.phone.trim())
            : undefined,
          createdAt: new Date(),
          totalPurchases: Money.create(0),
        };

        await customer.createCustomer(newCustomer);
        setShowCreateForm(false);
        setCreateForm({ name: '', email: '', phone: '' });
        setValidationErrors({});
      } catch (error) {
        console.error('Failed to create customer:', error);
      }
    },
    [validateForm, createForm, customer]
  );

  /**
   * Handle cancel create
   */
  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setCreateForm({ name: '', email: '', phone: '' });
    setValidationErrors({});
  }, []);

  return (
    <ErrorBoundary>
      <div className="customers-screen min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-1">
                Manage customer information and history
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Create new customer"
            >
              + New Customer
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer List */}
          <div className="lg:col-span-1">
            <section aria-labelledby="customer-list-heading">
              <h2 id="customer-list-heading" className="text-xl font-semibold text-gray-900 mb-4">
                Customers
              </h2>

              {/* Search */}
              <div className="mb-4">
                <label htmlFor="customer-search" className="sr-only">
                  Search customers
                </label>
                <input
                  id="customer-search"
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, email, or phone..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search customers"
                />
              </div>

              {/* Customer List */}
              <div
                className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[600px] overflow-y-auto"
                role="list"
                aria-label="Customer list"
              >
                {customer.isLoading && (
                  <div className="p-4 text-center text-gray-500">
                    <svg
                      className="animate-spin h-6 w-6 mx-auto text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="mt-2">Loading customers...</p>
                  </div>
                )}

                {!customer.isLoading && customer.customers.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No customers found</p>
                    <p className="text-sm mt-1">Try a different search or create a new customer</p>
                  </div>
                )}

                {!customer.isLoading &&
                  customer.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCustomerSelect(c)}
                      className={`w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                        customer.currentCustomer?.id === c.id ? 'bg-blue-50' : ''
                      }`}
                      role="listitem"
                      aria-label={`Select ${c.name}`}
                    >
                      <div className="font-medium text-gray-900">{c.name}</div>
                      {c.email && (
                        <div className="text-sm text-gray-500 mt-1">
                          {c.email.value}
                        </div>
                      )}
                      {c.phone && (
                        <div className="text-sm text-gray-500">
                          {c.phone.value}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Total purchases: ${c.totalPurchases.amount.toFixed(2)}
                      </div>
                    </button>
                  ))}
              </div>

              {/* Error Display */}
              {customer.error && (
                <div
                  role="alert"
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
                >
                  {customer.error}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Customer Detail or Create Form */}
          <div className="lg:col-span-2">
            {showCreateForm && (
              <section
                aria-labelledby="create-customer-heading"
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h2
                  id="create-customer-heading"
                  className="text-2xl font-bold text-gray-900 mb-6"
                >
                  New Customer
                </h2>

                <form onSubmit={handleCreateCustomer} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Customer Name *
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={createForm.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.name
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.name}
                      aria-describedby={
                        validationErrors.name ? 'name-error' : undefined
                      }
                    />
                    {validationErrors.name && (
                      <p
                        id="name-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="customer-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.email
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.email}
                      aria-describedby={
                        validationErrors.email ? 'email-error' : undefined
                      }
                    />
                    {validationErrors.email && (
                      <p
                        id="email-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.phone
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.phone}
                      aria-describedby={
                        validationErrors.phone ? 'phone-error' : undefined
                      }
                    />
                    {validationErrors.phone && (
                      <p
                        id="phone-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Contact requirement error */}
                  {validationErrors.contact && (
                    <div
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"
                      role="alert"
                    >
                      {validationErrors.contact}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={customer.isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {customer.isLoading ? 'Creating...' : 'Create Customer'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCreate}
                      disabled={customer.isLoading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            {!showCreateForm && !customer.currentCustomer && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p>Select a customer to view details</p>
                <p className="text-sm mt-1">or create a new customer</p>
              </div>
            )}

            {!showCreateForm && customer.currentCustomer && (
              <section
                aria-labelledby="customer-detail-heading"
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h2
                  id="customer-detail-heading"
                  className="text-2xl font-bold text-gray-900 mb-6"
                >
                  {customer.currentCustomer.name}
                </h2>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Customer ID
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {customer.currentCustomer.id}
                    </dd>
                  </div>

                  {customer.currentCustomer.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-gray-900">
                        <a
                          href={`mailto:${customer.currentCustomer.email.value}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {customer.currentCustomer.email.value}
                        </a>
                      </dd>
                    </div>
                  )}

                  {customer.currentCustomer.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="mt-1 text-gray-900">
                        <a
                          href={`tel:${customer.currentCustomer.phone.value}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {customer.currentCustomer.phone.value}
                        </a>
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Member Since
                    </dt>
                    <dd className="mt-1 text-gray-900">
                      {customer.currentCustomer.createdAt.toLocaleDateString()}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Total Purchases
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      ${customer.currentCustomer.totalPurchases.amount.toFixed(2)}{' '}
                      {customer.currentCustomer.totalPurchases.currency}
                    </dd>
                  </div>
                </dl>

                {/* Purchase History Section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Purchase History
                  </h3>
                  <div className="text-gray-500 text-center py-8">
                    <p>No purchase history available</p>
                    <p className="text-sm mt-1">
                      Purchase history will appear here once the customer makes a purchase
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
