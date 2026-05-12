/**
 * InventoryScreen Component
 * 
 * Screen for managing product inventory.
 * Provides product list, search, filtering, and update functionality.
 * Integrates with useInventory hook for inventory operations.
 * 
 * **Validates: Requirements 4.1, 6.1, 6.2, 6.3, 6.4, 11.1, 11.3, 15.3**
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { Product } from '../../../domain/entities/Product';
import type { UseInventoryReturn } from '../hooks/useInventory';
import { Money } from '../../../domain/value-objects/Money';
import { Quantity } from '../../../domain/value-objects/Quantity';

/**
 * InventoryScreen Props
 */
export interface InventoryScreenProps {
  inventory: UseInventoryReturn;
}

/**
 * InventoryScreen Component
 * 
 * Provides inventory management interface with:
 * - Product list with search and filtering
 * - Product detail view
 * - Product update form with validation
 * - Loading and error states
 * - Accessibility features
 */
export function InventoryScreen({ inventory }: InventoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    code: string;
    price: string;
    stock: string;
    category: string;
    description: string;
  }>({
    name: '',
    code: '',
    price: '',
    stock: '',
    category: '',
    description: '',
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
        inventory.searchProducts(query);
      }
    },
    [inventory]
  );

  /**
   * Handle product selection
   */
  const handleProductSelect = useCallback(
    async (product: Product) => {
      setSelectedProduct(product);
      setIsEditing(false);
      setValidationErrors({});
      await inventory.getProduct(product.id);
    },
    [inventory]
  );

  /**
   * Handle edit mode
   */
  const handleStartEdit = useCallback(() => {
    if (selectedProduct) {
      setEditForm({
        name: selectedProduct.name,
        code: selectedProduct.code,
        price: selectedProduct.price.amount.toString(),
        stock: selectedProduct.stock.value.toString(),
        category: selectedProduct.category,
        description: selectedProduct.description || '',
      });
      setIsEditing(true);
      setValidationErrors({});
    }
  }, [selectedProduct]);

  /**
   * Handle cancel edit
   */
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setValidationErrors({});
  }, []);

  /**
   * Validate form
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!editForm.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!editForm.code.trim()) {
      errors.code = 'Product code is required';
    }

    const price = parseFloat(editForm.price);
    if (isNaN(price) || price < 0) {
      errors.price = 'Price must be a positive number';
    }

    const stock = parseInt(editForm.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.stock = 'Stock must be a positive integer';
    }

    if (!editForm.category.trim()) {
      errors.category = 'Category is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editForm]);

  /**
   * Handle save product
   */
  const handleSaveProduct = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm() || !selectedProduct) {
        return;
      }

      try {
        const updatedProduct: Product = {
          ...selectedProduct,
          name: editForm.name.trim(),
          code: editForm.code.trim(),
          price: Money.create(parseFloat(editForm.price)),
          stock: Quantity.create(parseInt(editForm.stock, 10)),
          category: editForm.category.trim(),
          description: editForm.description.trim() || undefined,
        };

        await inventory.updateProduct(updatedProduct);
        setSelectedProduct(updatedProduct);
        setIsEditing(false);
        setValidationErrors({});
      } catch (error) {
        console.error('Failed to update product:', error);
      }
    },
    [validateForm, selectedProduct, editForm, inventory]
  );

  /**
   * Handle form field change
   */
  const handleFieldChange = useCallback(
    (field: keyof typeof editForm, value: string) => {
      setEditForm((prev) => ({ ...prev, [field]: value }));
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

  return (
    <ErrorBoundary>
      <div className="inventory-screen min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">
            Manage product catalog and stock levels
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product List */}
          <div className="lg:col-span-1">
            <section aria-labelledby="product-list-heading">
              <h2 id="product-list-heading" className="text-xl font-semibold text-gray-900 mb-4">
                Products
              </h2>

              {/* Search */}
              <div className="mb-4">
                <label htmlFor="inventory-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="inventory-search"
                  type="search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, code, or category..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Search products"
                />
              </div>

              {/* Product List */}
              <div
                className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[600px] overflow-y-auto"
                role="list"
                aria-label="Product list"
              >
                {inventory.isLoading && (
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
                    <p className="mt-2">Loading products...</p>
                  </div>
                )}

                {!inventory.isLoading && inventory.products.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No products found</p>
                    <p className="text-sm mt-1">Try a different search</p>
                  </div>
                )}

                {!inventory.isLoading &&
                  inventory.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`w-full p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                        selectedProduct?.id === product.id ? 'bg-blue-50' : ''
                      }`}
                      role="listitem"
                      aria-label={`Select ${product.name}`}
                    >
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Code: {product.code}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-semibold text-gray-900">
                          ${product.price.amount.toFixed(2)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            product.stock.value === 0
                              ? 'bg-red-100 text-red-800'
                              : product.stock.value < 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          Stock: {product.stock.value}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>

              {/* Error Display */}
              {inventory.error && (
                <div
                  role="alert"
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
                >
                  {inventory.error}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Product Detail/Edit */}
          <div className="lg:col-span-2">
            {!selectedProduct && (
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p>Select a product to view details</p>
              </div>
            )}

            {selectedProduct && !isEditing && (
              <section
                aria-labelledby="product-detail-heading"
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <h2
                    id="product-detail-heading"
                    className="text-2xl font-bold text-gray-900"
                  >
                    {selectedProduct.name}
                  </h2>
                  <button
                    onClick={handleStartEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Edit product"
                  >
                    Edit
                  </button>
                </div>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Code</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {selectedProduct.code}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Price</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      ${selectedProduct.price.amount.toFixed(2)}{' '}
                      {selectedProduct.price.currency}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock</dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {selectedProduct.stock.value} units
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Category
                    </dt>
                    <dd className="mt-1 text-lg text-gray-900">
                      {selectedProduct.category}
                    </dd>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Description
                      </dt>
                      <dd className="mt-1 text-gray-900">
                        {selectedProduct.description}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {selectedProduct && isEditing && (
              <section
                aria-labelledby="product-edit-heading"
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h2
                  id="product-edit-heading"
                  className="text-2xl font-bold text-gray-900 mb-6"
                >
                  Edit Product
                </h2>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="product-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product Name *
                    </label>
                    <input
                      id="product-name"
                      type="text"
                      value={editForm.name}
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

                  {/* Code */}
                  <div>
                    <label
                      htmlFor="product-code"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product Code *
                    </label>
                    <input
                      id="product-code"
                      type="text"
                      value={editForm.code}
                      onChange={(e) => handleFieldChange('code', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.code
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.code}
                      aria-describedby={
                        validationErrors.code ? 'code-error' : undefined
                      }
                    />
                    {validationErrors.code && (
                      <p
                        id="code-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.code}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label
                      htmlFor="product-price"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Price *
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.price}
                      onChange={(e) => handleFieldChange('price', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.price
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.price}
                      aria-describedby={
                        validationErrors.price ? 'price-error' : undefined
                      }
                    />
                    {validationErrors.price && (
                      <p
                        id="price-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.price}
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <label
                      htmlFor="product-stock"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Stock *
                    </label>
                    <input
                      id="product-stock"
                      type="number"
                      min="0"
                      value={editForm.stock}
                      onChange={(e) => handleFieldChange('stock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.stock
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.stock}
                      aria-describedby={
                        validationErrors.stock ? 'stock-error' : undefined
                      }
                    />
                    {validationErrors.stock && (
                      <p
                        id="stock-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.stock}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="product-category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category *
                    </label>
                    <input
                      id="product-category"
                      type="text"
                      value={editForm.category}
                      onChange={(e) =>
                        handleFieldChange('category', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        validationErrors.category
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      aria-invalid={!!validationErrors.category}
                      aria-describedby={
                        validationErrors.category ? 'category-error' : undefined
                      }
                    />
                    {validationErrors.category && (
                      <p
                        id="category-error"
                        className="mt-1 text-sm text-red-600"
                        role="alert"
                      >
                        {validationErrors.category}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="product-description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description
                    </label>
                    <textarea
                      id="product-description"
                      value={editForm.description}
                      onChange={(e) =>
                        handleFieldChange('description', e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={inventory.isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {inventory.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={inventory.isLoading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
