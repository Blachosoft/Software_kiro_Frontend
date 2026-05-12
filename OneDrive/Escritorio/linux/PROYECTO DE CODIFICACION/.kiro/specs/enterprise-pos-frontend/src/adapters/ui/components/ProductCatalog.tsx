/**
 * Product Catalog - Catálogo de productos con búsqueda y categorías
 * 
 * Grid de productos con filtros por categoría - Frontend puro
 */

'use client';

import { useState } from 'react';
import { MockProduct } from '../../../data/mockProducts';

interface ProductCatalogProps {
  products: MockProduct[];
  onAddProduct: (product: MockProduct) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

type Category = 'all' | 'food' | 'beverages' | 'electronics' | 'other';

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'food', label: 'Alimentos' },
  { id: 'beverages', label: 'Bebidas' },
  { id: 'electronics', label: 'Electrónica' },
  { id: 'other', label: 'Otros' },
];

export function ProductCatalog({
  products,
  onAddProduct,
  searchQuery,
  onSearchChange,
}: ProductCatalogProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    
    return matchesSearch && product.category === activeCategory;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Barra de búsqueda */}
      <div className="p-4 bg-white border-b border-neutral-border">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar producto o escanear código de barras..."
            className="w-full pl-10 pr-12 py-3 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-primary focus:border-transparent text-base"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs de categorías */}
      <div className="px-4 py-3 bg-white border-b border-neutral-border">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors touch-target ${
                activeCategory === category.id
                  ? 'bg-corporate-primary text-white'
                  : 'bg-neutral-bg text-gray-700 hover:bg-neutral-bg-dark'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto p-4 bg-neutral-bg">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium text-gray-500">No se encontraron productos</p>
            <p className="text-sm text-gray-400 mt-1">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg border border-neutral-border hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Imagen del producto */}
                <div className="aspect-square bg-neutral-bg flex items-center justify-center relative">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  
                  {/* Badge de stock bajo */}
                  {product.stock < 10 && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-danger text-white text-xs font-semibold rounded">
                      Stock bajo
                    </div>
                  )}
                </div>

                {/* Info del producto */}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2 h-10">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 code">{product.code}</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-corporate-primary price">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                    </div>
                    
                    <button
                      onClick={() => onAddProduct(product)}
                      disabled={product.stock === 0}
                      className={`touch-target w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        product.stock === 0
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-corporate-primary text-white hover:bg-corporate-primary-dark'
                      }`}
                      title={product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
