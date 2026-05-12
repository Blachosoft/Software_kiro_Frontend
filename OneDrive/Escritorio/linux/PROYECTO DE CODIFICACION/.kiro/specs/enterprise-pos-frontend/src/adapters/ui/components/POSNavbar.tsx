/**
 * POS Navbar - Barra superior corporativa - Frontend puro
 * 
 * Muestra logo, indicadores rápidos y usuario activo
 */

'use client';

interface POSNavbarProps {
  cashierName: string;
  dailySales?: number;
  lowStockCount?: number;
  activeShifts?: number;
  onLogout?: () => void;
}

export function POSNavbar({ 
  cashierName,
  dailySales = 0, 
  lowStockCount = 0, 
  activeShifts = 1,
  onLogout
}: POSNavbarProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <nav className="bg-white border-b border-neutral-border shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Nombre del negocio */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-corporate-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Enterprise POS</h1>
              <p className="text-xs text-gray-500">Sistema de Punto de Venta</p>
            </div>
          </div>

          {/* Indicadores rápidos */}
          <div className="flex items-center space-x-6">
            {/* Ventas del día */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ventas del día</p>
                <p className="text-sm font-semibold text-gray-900 price">{formatCurrency(dailySales)}</p>
              </div>
            </div>

            {/* Turnos activos */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-corporate-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-corporate-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Turnos activos</p>
                <p className="text-sm font-semibold text-gray-900">{activeShifts}</p>
              </div>
            </div>

            {/* Stock bajo */}
            {lowStockCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stock bajo</p>
                  <p className="text-sm font-semibold text-danger">{lowStockCount} productos</p>
                </div>
              </div>
            )}
          </div>

          {/* Usuario y acciones */}
          <div className="flex items-center space-x-3">
            {/* Usuario logueado */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-neutral-bg rounded-lg">
              <div className="w-8 h-8 bg-corporate-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {cashierName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{cashierName || 'Usuario'}</p>
                <p className="text-xs text-gray-500">Cajero</p>
              </div>
            </div>

            {/* Botón de cierre de sesión */}
            <button
              onClick={() => onLogout?.()}
              className="touch-target px-4 py-2 bg-white border border-neutral-border rounded-lg hover:bg-neutral-bg transition-colors"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Configuración */}
            <button
              className="touch-target px-4 py-2 bg-white border border-neutral-border rounded-lg hover:bg-neutral-bg transition-colors"
              title="Configuración"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
