/**
 * Active Ticket - Carrito/Ticket activo - Frontend puro
 * 
 * Muestra los items seleccionados, totales y métodos de pago
 */

'use client';

import { useState } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ActiveTicketProps {
  ticketNumber: string;
  cashier: string;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (paymentMethod: string) => void;
  onCancel: () => void;
}

type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';

const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'cash', label: 'Efectivo', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'debit', label: 'Débito', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'credit', label: 'Crédito', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id: 'transfer', label: 'Transferencia', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
];

export function ActiveTicket({
  ticketNumber,
  cashier,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onCancel,
}: ActiveTicketProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponCode, setCouponCode] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  };

  // Cálculos
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxRate = 0.19; // IVA 19%
  const taxAmount = subtotalAfterDiscount * taxRate;
  const total = subtotalAfterDiscount + taxAmount;

  const isEmpty = items.length === 0;

  const handleApplyCoupon = () => {
    // Simulación de validación de cupón
    if (couponCode.toUpperCase() === 'DESC10') {
      setDiscountPercent(10);
      setCouponCode('');
    } else if (couponCode.toUpperCase() === 'DESC20') {
      setDiscountPercent(20);
      setCouponCode('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-neutral-border">
      {/* Header del ticket */}
      <div className="p-4 border-b border-neutral-border bg-neutral-bg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500">Ticket</p>
            <p className="text-lg font-bold text-corporate-primary ticket-number">#{ticketNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Cajero</p>
            <p className="text-sm font-medium text-gray-900">{cashier}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">{formatDate()}</p>
      </div>

      {/* Lista de items */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <svg className="w-20 h-20 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-lg font-medium text-gray-500 mb-2">Carrito vacío</p>
            <p className="text-sm text-gray-400">Busca o escanea un producto para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-border">
            {items.map((item) => (
              <div key={item.productId} className="p-4 hover:bg-neutral-bg transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 flex-1 pr-2">
                    {item.productName}
                  </h4>
                  <button
                    onClick={() => onRemoveItem(item.productId)}
                    className="text-danger hover:text-danger-dark transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {/* Controles de cantidad */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="touch-target w-8 h-8 rounded border border-neutral-border hover:bg-neutral-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="w-12 text-center font-semibold text-gray-900 price">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="touch-target w-8 h-8 rounded border border-neutral-border hover:bg-neutral-bg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Precios */}
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.unitPrice)} c/u
                    </p>
                    <p className="text-base font-bold text-gray-900 price">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de descuentos y cupones */}
      {!isEmpty && (
        <div className="p-4 border-t border-neutral-border bg-neutral-bg">
          <p className="text-xs font-medium text-gray-700 mb-2">Descuentos y cupones</p>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Código de cupón"
              className="flex-1 px-3 py-2 border border-neutral-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-corporate-primary"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-4 py-2 bg-corporate-primary text-white rounded text-sm font-medium hover:bg-corporate-primary-dark transition-colors"
            >
              Aplicar
            </button>
          </div>
          {discountPercent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-success font-medium">Descuento {discountPercent}% aplicado</span>
              <button
                onClick={() => setDiscountPercent(0)}
                className="text-danger text-xs hover:underline"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resumen de totales */}
      {!isEmpty && (
        <div className="p-4 border-t border-neutral-border bg-white">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium price">{formatCurrency(subtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Descuento ({discountPercent}%):</span>
                <span className="font-medium text-success price">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA (19%):</span>
              <span className="font-medium price">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="h-px bg-neutral-border"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">TOTAL:</span>
              <span className="text-2xl font-bold text-corporate-primary price">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Método de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`touch-target p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                    selectedPayment === method.id
                      ? 'border-corporate-primary bg-corporate-primary/5'
                      : 'border-neutral-border hover:border-gray-400'
                  }`}
                >
                  <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={method.icon} />
                  </svg>
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <button
              onClick={() => onCheckout(selectedPayment)}
              className="w-full touch-target py-4 bg-corporate-primary text-white rounded-lg font-bold text-lg hover:bg-corporate-primary-dark transition-colors shadow-lg"
            >
              Cobrar {formatCurrency(total)}
            </button>
            <button
              onClick={onCancel}
              className="w-full touch-target py-3 border-2 border-danger text-danger rounded-lg font-semibold hover:bg-danger hover:text-white transition-colors"
            >
              Cancelar venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
