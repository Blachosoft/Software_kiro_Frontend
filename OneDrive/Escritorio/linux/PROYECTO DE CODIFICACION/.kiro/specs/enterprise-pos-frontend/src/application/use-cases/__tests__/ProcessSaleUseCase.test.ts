import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessSaleUseCase } from '../ProcessSaleUseCase';
import type { SaleRepository } from '../../../domain/ports/SaleRepository';
import type { ProductRepository } from '../../../domain/ports/ProductRepository';
import type { Sale } from '../../../domain/entities/Sale';
import type { Product } from '../../../domain/entities/Product';
import { Money } from '../../../domain/value-objects/Money';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { NotFoundError, BusinessRuleError, ValidationError } from '../../../domain/errors/DomainError';

// Mock repositories
function createMockSaleRepository(): SaleRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
    findByCustomerId: vi.fn(),
    findAll: vi.fn(),
  };
}

function createMockProductRepository(): ProductRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  };
}

// Test data helpers
function createTestSale(id: string = 'sale-1'): Sale {
  return {
    id,
    items: [],
    status: 'draft',
    createdAt: new Date(),
  };
}

function createTestProduct(id: string = 'prod-1', stock: number = 100): Product {
  return {
    id,
    code: 'CODE-001',
    name: 'Test Product',
    price: Money.create(10, 'USD'),
    stock: Quantity.create(stock),
    category: 'Electronics',
  };
}

describe('ProcessSaleUseCase', () => {
  let useCase: ProcessSaleUseCase;
  let mockSaleRepo: SaleRepository;
  let mockProductRepo: ProductRepository;

  beforeEach(() => {
    mockSaleRepo = createMockSaleRepository();
    mockProductRepo = createMockProductRepository();
    useCase = new ProcessSaleUseCase(mockSaleRepo, mockProductRepo);
  });

  describe('addItem', () => {
    it('should add item to sale when product has sufficient stock', async () => {
      const sale = createTestSale();
      const product = createTestProduct('prod-1', 100);
      const quantity = Quantity.create(5);

      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockProductRepo.findById).mockResolvedValue(product);
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.addItem('sale-1', 'prod-1', quantity);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod-1');
      expect(result.items[0].quantity.value).toBe(5);
      expect(result.items[0].subtotal.amount).toBe(50);
      expect(mockSaleRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError when sale not found', async () => {
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.addItem('sale-999', 'prod-1', Quantity.create(1))
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when product not found', async () => {
      const sale = createTestSale();
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockProductRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.addItem('sale-1', 'prod-999', Quantity.create(1))
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessRuleError when sale is completed', async () => {
      const sale: Sale = { ...createTestSale(), status: 'completed' };
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);

      await expect(
        useCase.addItem('sale-1', 'prod-1', Quantity.create(1))
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw ValidationError when insufficient stock', async () => {
      const sale = createTestSale();
      const product = createTestProduct('prod-1', 5);
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

      await expect(
        useCase.addItem('sale-1', 'prod-1', Quantity.create(10))
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('removeItem', () => {
    it('should remove item from sale', async () => {
      const sale: Sale = {
        ...createTestSale(),
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(2),
            unitPrice: Money.create(10),
            subtotal: Money.create(20),
          },
          {
            productId: 'prod-2',
            productName: 'Product 2',
            quantity: Quantity.create(1),
            unitPrice: Money.create(15),
            subtotal: Money.create(15),
          },
        ],
      };

      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.removeItem('sale-1', 0);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('prod-2');
    });

    it('should throw ValidationError for invalid item index', async () => {
      const sale = createTestSale();
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);

      await expect(useCase.removeItem('sale-1', 0)).rejects.toThrow(ValidationError);
    });

    it('should throw BusinessRuleError when sale is completed', async () => {
      const sale: Sale = { ...createTestSale(), status: 'completed' };
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);

      await expect(useCase.removeItem('sale-1', 0)).rejects.toThrow(BusinessRuleError);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity and recalculate subtotal', async () => {
      const sale: Sale = {
        ...createTestSale(),
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(2),
            unitPrice: Money.create(10),
            subtotal: Money.create(20),
          },
        ],
      };
      const product = createTestProduct('prod-1', 100);

      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockProductRepo.findById).mockResolvedValue(product);
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.updateItemQuantity('sale-1', 0, Quantity.create(5));

      expect(result.items[0].quantity.value).toBe(5);
      expect(result.items[0].subtotal.amount).toBe(50);
    });

    it('should throw ValidationError when insufficient stock', async () => {
      const sale: Sale = {
        ...createTestSale(),
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(2),
            unitPrice: Money.create(10),
            subtotal: Money.create(20),
          },
        ],
      };
      const product = createTestProduct('prod-1', 5);

      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockProductRepo.findById).mockResolvedValue(product);

      await expect(
        useCase.updateItemQuantity('sale-1', 0, Quantity.create(10))
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('completeSale', () => {
    it('should complete sale with valid payment method', async () => {
      const sale: Sale = {
        ...createTestSale(),
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(2),
            unitPrice: Money.create(10),
            subtotal: Money.create(20),
          },
        ],
      };

      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.completeSale('sale-1', 'cash');

      expect(result.status).toBe('completed');
      expect(result.paymentMethod).toBe('cash');
      expect(result.completedAt).toBeDefined();
    });

    it('should throw ValidationError when sale has no items', async () => {
      const sale = createTestSale();
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);

      await expect(useCase.completeSale('sale-1', 'cash')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when sale is not draft', async () => {
      const sale: Sale = {
        ...createTestSale(),
        status: 'completed',
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(1),
            unitPrice: Money.create(10),
            subtotal: Money.create(10),
          },
        ],
      };
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);

      await expect(useCase.completeSale('sale-1', 'cash')).rejects.toThrow(ValidationError);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total for sale with items', () => {
      const sale: Sale = {
        ...createTestSale(),
        items: [
          {
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: Quantity.create(2),
            unitPrice: Money.create(10),
            subtotal: Money.create(20),
          },
          {
            productId: 'prod-2',
            productName: 'Product 2',
            quantity: Quantity.create(1),
            unitPrice: Money.create(15),
            subtotal: Money.create(15),
          },
        ],
      };

      const total = useCase.calculateTotal(sale);

      expect(total.amount).toBe(35);
    });

    it('should return zero for empty sale', () => {
      const sale = createTestSale();
      const total = useCase.calculateTotal(sale);

      expect(total.amount).toBe(0);
    });
  });

  describe('createSale', () => {
    it('should create new draft sale', async () => {
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.createSale();

      expect(result.status).toBe('draft');
      expect(result.items).toHaveLength(0);
      expect(result.id).toBeDefined();
      expect(mockSaleRepo.save).toHaveBeenCalled();
    });

    it('should create sale with customer ID', async () => {
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.createSale('cust-1');

      expect(result.customerId).toBe('cust-1');
    });
  });

  describe('cancelSale', () => {
    it('should cancel draft sale', async () => {
      const sale = createTestSale();
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.cancelSale('sale-1');

      expect(result.status).toBe('cancelled');
    });

    it('should throw BusinessRuleError when cancelling completed sale', async () => {
      const sale: Sale = { ...createTestSale(), status: 'completed' };
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);

      await expect(useCase.cancelSale('sale-1')).rejects.toThrow(BusinessRuleError);
    });
  });
});
