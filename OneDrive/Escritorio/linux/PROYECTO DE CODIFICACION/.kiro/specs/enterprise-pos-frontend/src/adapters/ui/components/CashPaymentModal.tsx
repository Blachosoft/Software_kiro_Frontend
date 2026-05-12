/**
 * Cash Payment Modal - Modal para pago en efectivo - Frontend puro
 * 
 * Calcula el vuelto automáticamente
 */

'use client';

import { useState, useEffect } from 'react';

interface CashPaymentModalProps {
  isOpen: boolean;
  total: number;
  onConfirm: (amountPaid: number) => void;
  onClose: () => void;
}

export function CashPaymentModal({
  isOpen,
  total,
  onConfirm,
  onClose,
}: CashPaymentModalProps) {
  const [amountPaid, setAmountPaid] = useState('');
  const [change, setChange] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setAmountPaid('');
      setChange(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const paid = parseFloat(amountPaid) || 0;
    setChange(Math.max(0, paid - total));
  }, [amountPaid, total]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const quickAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 20000) * 20000,
    Math.ceil(total / 50000) * 50000,
  ].filter((v, i, a) => a.indexOf(v) === i); // Eliminar duplicados

  const handleConfirm = () => {
    const paid = parseFloat(amountPaid) || 0;
    if (paid >= total) {
      onConfirm(paid);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-neutral-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Pago en Efectivo</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Total a pagar */}
          <div className="bg-corporate-primary/5 rounded-lg p-4 border-2 border-corporate-primary/20">
            <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
            <p className="text-3xl font-bold text-corporate-primary price">
              {formatCurrency(total)}
            </p>
          </div>

          {/* Monto recibido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Cuánto paga el cliente?
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full px-4 py-4 text-2xl font-bold border-2 border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-primary focus:border-transparent price"
            />
          </div>

          {/* Botones de monto rápido */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Montos rápidos</p>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setAmountPaid(amount.toString())}
                  className="touch-target px-4 py-3 bg-neutral-bg hover:bg-neutral-bg-dark border border-neutral-border rounded-lg font-semibold text-gray-900 transition-colors price"
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
          </div>

          {/* Vuelto */}
          {parseFloat(amountPaid) >= total && (
            <div className="bg-success/10 rounded-lg p-4 border-2 border-success/20">
              <p className="text-sm text-gray-600 mb-1">Vuelto</p>
              <p className="text-3xl font-bold text-success price">
                {formatCurrency(change)}
              </p>
            </div>
          )}

          {/* Advertencia si el monto es insuficiente */}
          {parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < total && (
            <div className="bg-danger/10 rounded-lg p-3 border border-danger/20">
              <p className="text-sm text-danger font-medium">
                El monto recibido es insuficiente
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-border bg-neutral-bg space-y-2">
          <button
            onClick={handleConfirm}
            disabled={parseFloat(amountPaid) < total}
            className="w-full touch-target py-4 bg-corporate-primary hover:bg-corporate-primary-dark text-white font-bold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            Confirmar Pago
          </button>
          
          <button
            onClick={onClose}
            className="w-full touch-target py-3 border-2 border-neutral-border text-gray-700 hover:bg-neutral-bg-dark font-semibold rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
