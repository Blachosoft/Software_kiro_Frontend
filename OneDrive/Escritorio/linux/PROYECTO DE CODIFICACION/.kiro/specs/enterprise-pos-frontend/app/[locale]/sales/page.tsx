/**
 * Sales Page - Página principal de ventas con diseño POS corporativo
 * 
 * Layout de dos columnas: Catálogo (60%) + Ticket activo (40%)
 * Frontend puro - Sin dependencias de API
 */

'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { POSNavbar } from '../../../src/adapters/ui/components/POSNavbar';
import { QuickAccessSidebar } from '../../../src/adapters/ui/components/QuickAccessSidebar';
import { ProductCatalog } from '../../../src/adapters/ui/components/ProductCatalog';
import { ActiveTicket, CartItem } from '../../../src/adapters/ui/components/ActiveTicket';
import { CashPaymentModal } from '../../../src/adapters/ui/components/CashPaymentModal';
import { Toast } from '../../../src/adapters/ui/components/Toast';
import { mockProducts, mockCashier, mockStats } from '../../../src/data/mockProducts';
import { MockProduct } from '../../../src/data/mockProducts';

export default function SalesPage() {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const currentLocale = params?.locale ?? 'en';
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string }>({ 
    type: 'success', 
    title: '', 
    message: '' 
  });
  const [ticketNumber, setTicketNumber] = useState(generateTicketNumber());

  function generateTicketNumber() {
    return `${Date.now().toString().slice(-6)}`;
  }

  // Calcular stock bajo para el navbar
  const lowStockCount = useMemo(() => {
    return mockProducts.filter(p => p.stock < 10).length;
  }, []);

  const handleAddProduct = (product: MockProduct) => {
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Incrementar cantidad
      setItems(items.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (item.quantity + 1) * item.unitPrice,
            }
          : item
      ));
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        subtotal: product.price,
      };
      setItems([...items, newItem]);
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setItems(items.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: quantity,
            subtotal: quantity * item.unitPrice,
          }
        : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(item => item.productId !== productId));
  };

  const handleCheckout = async (paymentMethod: string) => {
    if (paymentMethod === 'cash') {
      setShowCashModal(true);
    } else {
      await processPayment(paymentMethod);
    }
  };

  const handleCashPayment = async (amountPaid: number) => {
    setShowCashModal(false);
    await processPayment('cash', amountPaid);
  };

  const processPayment = async (paymentMethod: string, amountPaid?: number) => {
    // Simulación de procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 500));

    setToastData({
      type: 'success',
      title: '¡Venta completada!',
      message: `Ticket #${ticketNumber} procesado exitosamente`,
    });
    setShowToast(true);

    // Limpiar carrito y generar nuevo ticket
    setTimeout(() => {
      setItems([]);
      setTicketNumber(generateTicketNumber());
      setShowToast(false);
    }, 3000);
  };

  const handleCancel = () => {
    if (items.length > 0) {
      if (confirm('¿Estás seguro de cancelar esta venta?')) {
        setItems([]);
        setTicketNumber(generateTicketNumber());
        setToastData({
          type: 'info',
          title: 'Venta cancelada',
          message: 'El carrito ha sido vaciado',
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('¿Deseas cerrar sesión?')) {
      // Redirigir a la pantalla principal del locale actual
      router.replace(`/${currentLocale}`);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-bg">
      {/* Navbar superior */}
      <POSNavbar
        cashierName={mockCashier.name}
        dailySales={mockStats.dailySales}
        lowStockCount={lowStockCount}
        activeShifts={mockStats.activeTurns}
        onLogout={handleLogout}
      />

      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de accesos rápidos */}
        <QuickAccessSidebar />

        {/* Layout de dos columnas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Columna izquierda - Catálogo (60%) */}
          <div className="w-[60%] flex flex-col">
            <ProductCatalog
              products={mockProducts}
              onAddProduct={handleAddProduct}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Columna derecha - Ticket activo (40%) */}
          <div className="w-[40%] flex flex-col">
            <ActiveTicket
              ticketNumber={ticketNumber}
              cashier={mockCashier.name}
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>

      {/* Modal de pago en efectivo */}
      <CashPaymentModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        onConfirm={handleCashPayment}
        total={items.reduce((sum, item) => sum + item.subtotal, 0) * 1.19} // Incluye IVA
      />

      {/* Toast de notificaciones */}
      {showToast && (
        <Toast
          type={toastData.type}
          title={toastData.title}
          message={toastData.message}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}
