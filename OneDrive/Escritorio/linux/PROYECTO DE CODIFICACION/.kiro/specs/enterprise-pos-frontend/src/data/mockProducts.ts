/**
 * Mock Products Data - Datos de productos para el frontend
 * No requiere conexión con API backend
 */

export interface MockProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
  category: 'food' | 'beverages' | 'electronics' | 'other';
  image?: string;
}

export const mockProducts: MockProduct[] = [
  // Alimentos
  {
    id: 'prod-001',
    code: 'ALI-001',
    name: 'Pan Integral 500g',
    price: 4500,
    currency: 'COP',
    stock: 45,
    category: 'food',
  },
  {
    id: 'prod-002',
    code: 'ALI-002',
    name: 'Arroz Premium 1kg',
    price: 3200,
    currency: 'COP',
    stock: 8,
    category: 'food',
  },
  {
    id: 'prod-003',
    code: 'ALI-003',
    name: 'Aceite de Oliva 500ml',
    price: 15800,
    currency: 'COP',
    stock: 23,
    category: 'food',
  },
  {
    id: 'prod-004',
    code: 'ALI-004',
    name: 'Pasta Italiana 500g',
    price: 5600,
    currency: 'COP',
    stock: 67,
    category: 'food',
  },
  {
    id: 'prod-005',
    code: 'ALI-005',
    name: 'Salsa de Tomate 400g',
    price: 2800,
    currency: 'COP',
    stock: 5,
    category: 'food',
  },
  {
    id: 'prod-006',
    code: 'ALI-006',
    name: 'Cereal Fitness 300g',
    price: 12500,
    currency: 'COP',
    stock: 34,
    category: 'food',
  },
  {
    id: 'prod-007',
    code: 'ALI-007',
    name: 'Galletas de Chocolate 200g',
    price: 4200,
    currency: 'COP',
    stock: 89,
    category: 'food',
  },
  {
    id: 'prod-008',
    code: 'ALI-008',
    name: 'Atún en Lata 170g',
    price: 6800,
    currency: 'COP',
    stock: 42,
    category: 'food',
  },

  // Bebidas
  {
    id: 'prod-009',
    code: 'BEB-001',
    name: 'Coca Cola 2L',
    price: 7200,
    currency: 'COP',
    stock: 76,
    category: 'beverages',
  },
  {
    id: 'prod-010',
    code: 'BEB-002',
    name: 'Agua Mineral 600ml',
    price: 2100,
    currency: 'COP',
    stock: 120,
    category: 'beverages',
  },
  {
    id: 'prod-011',
    code: 'BEB-003',
    name: 'Jugo de Naranja 1L',
    price: 8500,
    currency: 'COP',
    stock: 9,
    category: 'beverages',
  },
  {
    id: 'prod-012',
    code: 'BEB-004',
    name: 'Cerveza Premium 330ml',
    price: 3800,
    currency: 'COP',
    stock: 54,
    category: 'beverages',
  },
  {
    id: 'prod-013',
    code: 'BEB-005',
    name: 'Energizante Red Bull 250ml',
    price: 6500,
    currency: 'COP',
    stock: 38,
    category: 'beverages',
  },
  {
    id: 'prod-014',
    code: 'BEB-006',
    name: 'Té Frío Limón 500ml',
    price: 4200,
    currency: 'COP',
    stock: 7,
    category: 'beverages',
  },
  {
    id: 'prod-015',
    code: 'BEB-007',
    name: 'Leche Deslactosada 1L',
    price: 5400,
    currency: 'COP',
    stock: 28,
    category: 'beverages',
  },
  {
    id: 'prod-016',
    code: 'BEB-008',
    name: 'Café Colombiano Premium 250g',
    price: 18900,
    currency: 'COP',
    stock: 15,
    category: 'beverages',
  },

  // Electrónica
  {
    id: 'prod-017',
    code: 'ELEC-001',
    name: 'Audífonos Bluetooth',
    price: 89000,
    currency: 'COP',
    stock: 12,
    category: 'electronics',
  },
  {
    id: 'prod-018',
    code: 'ELEC-002',
    name: 'Cable USB-C 2m',
    price: 15500,
    currency: 'COP',
    stock: 45,
    category: 'electronics',
  },
  {
    id: 'prod-019',
    code: 'ELEC-003',
    name: 'Cargador Rápido 20W',
    price: 35000,
    currency: 'COP',
    stock: 6,
    category: 'electronics',
  },
  {
    id: 'prod-020',
    code: 'ELEC-004',
    name: 'Mouse Inalámbrico',
    price: 42000,
    currency: 'COP',
    stock: 18,
    category: 'electronics',
  },
  {
    id: 'prod-021',
    code: 'ELEC-005',
    name: 'Teclado Mecánico RGB',
    price: 185000,
    currency: 'COP',
    stock: 8,
    category: 'electronics',
  },
  {
    id: 'prod-022',
    code: 'ELEC-006',
    name: 'Webcam HD 1080p',
    price: 125000,
    currency: 'COP',
    stock: 3,
    category: 'electronics',
  },
  {
    id: 'prod-023',
    code: 'ELEC-007',
    name: 'Memoria USB 64GB',
    price: 28000,
    currency: 'COP',
    stock: 67,
    category: 'electronics',
  },
  {
    id: 'prod-024',
    code: 'ELEC-008',
    name: 'Power Bank 10000mAh',
    price: 52000,
    currency: 'COP',
    stock: 24,
    category: 'electronics',
  },

  // Otros
  {
    id: 'prod-025',
    code: 'OTR-001',
    name: 'Bolsas Reutilizables x5',
    price: 8500,
    currency: 'COP',
    stock: 95,
    category: 'other',
  },
  {
    id: 'prod-026',
    code: 'OTR-002',
    name: 'Cuaderno Universitario',
    price: 6200,
    currency: 'COP',
    stock: 42,
    category: 'other',
  },
  {
    id: 'prod-027',
    code: 'OTR-003',
    name: 'Bolígrafos Pack x12',
    price: 9800,
    currency: 'COP',
    stock: 5,
    category: 'other',
  },
  {
    id: 'prod-028',
    code: 'OTR-004',
    name: 'Toallas de Papel x2',
    price: 7600,
    currency: 'COP',
    stock: 78,
    category: 'other',
  },
  {
    id: 'prod-029',
    code: 'OTR-005',
    name: 'Jabón Antibacterial 500ml',
    price: 12300,
    currency: 'COP',
    stock: 36,
    category: 'other',
  },
  {
    id: 'prod-030',
    code: 'OTR-006',
    name: 'Pilas AA Pack x8',
    price: 16500,
    currency: 'COP',
    stock: 27,
    category: 'other',
  },
  {
    id: 'prod-031',
    code: 'OTR-007',
    name: 'Vela Aromática',
    price: 14900,
    currency: 'COP',
    stock: 9,
    category: 'other',
  },
  {
    id: 'prod-032',
    code: 'OTR-008',
    name: 'Paraguas Compacto',
    price: 32000,
    currency: 'COP',
    stock: 15,
    category: 'other',
  },
];

// Mock user data
export const mockCashier = {
  id: 'user-001',
  name: 'María González',
  role: 'Cajero',
};

// Mock statistics
export const mockStats = {
  activeTurns: 2,
  dailySales: 2456000,
  lowStockProducts: 8,
};
