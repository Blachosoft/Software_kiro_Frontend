import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ManageInventoryUseCase } from '../ManageInventoryUseCase';
import type { ProductRepository } from '../../../domain/ports/ProductRepository';
import type { Product } from '../../../domain/entities/Product';
import { Money } from '../../../domain/value-objects/Money';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { NotFoundError, ValidationError } from '../../../domain/errors/DomainError';

// Mock repository
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
function createTestProduct(
  id: string = 'prod-1',
  code: string = 'CODE-001',
  stock: number = 100
): Product {
  return {
    id,
    code,
    name: 'Test Product',
    price: Money.create(10, 'USD'),
    stock: Quantity.create(stock),
    category: 'Electronics',
  };
}

describe('ManageInventoryUseCase', () => {
  let useCase: ManageInventoryUseCase;
  let mockRepo: ProductRepository;

  beforeEach(() => {
    mockRepo = createMockProductRepository();
    useCase = new ManageInventoryUseCase(mockRepo);
  });

  describe('searchProducts', () => {
    it('should return all products when query is empty', async () => {
      const products = [createTestProduct('prod-1'), createTestProduct('prod-2')];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.searchProducts('');

      expect(result).toEqual(products);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('should search products by query', async () => {
      const products = [createTestProduct('prod-1')];
      vi.mocked(mockRepo.search).mockResolvedValue(products);

      const result = await useCase.searchProducts('test');

      expect(result).toEqual(products);
      expect(mockRepo.search).toHaveBeenCalledWith('test');
    });

    it('should trim whitespace from query', async () => {
      vi.mocked(mockRepo.search).mockResolvedValue([]);

      await useCase.searchProducts('  test  ');

      expect(mockRepo.search).toHaveBeenCalledWith('test');
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const product = createTestProduct();
      vi.mocked(mockRepo.findById).mockResolvedValue(product);

      const result = await useCase.getProductById('prod-1');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundError when product not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(useCase.getProductById('prod-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getProductByCode', () => {
    it('should return product when found', async () => {
      const product = createTestProduct();
      vi.mocked(mockRepo.findByCode).mockResolvedValue(product);

      const result = await useCase.getProductByCode('CODE-001');

      expect(result).toEqual(product);
    });

    it('should throw NotFoundError when product not found', async () => {
      vi.mocked(mockRepo.findByCode).mockResolvedValue(null);

      await expect(useCase.getProductByCode('CODE-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const products = [createTestProduct('prod-1'), createTestProduct('prod-2')];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.getAllProducts();

      expect(result).toEqual(products);
      expect(mockRepo.findAll).toHaveBeenCalled();
    });

    it('should pass pagination parameters', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([]);

      await useCase.getAllProducts(10, 20);

      expect(mockRepo.findAll).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('updateProduct', () => {
    it('should update product when valid', async () => {
      const product = createTestProduct();
      vi.mocked(mockRepo.findById).mockResolvedValue(product);
      vi.mocked(mockRepo.update).mockResolvedValue(product);

      const result = await useCase.updateProduct(product);

      expect(result).toEqual(product);
      expect(mockRepo.update).toHaveBeenCalledWith(product);
    });

    it('should throw ValidationError when product is invalid', async () => {
      const invalidProduct: Product = {
        ...createTestProduct(),
        name: '', // Invalid: empty name
      };

      await expect(useCase.updateProduct(invalidProduct)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      const product = createTestProduct();
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(useCase.updateProduct(product)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createProduct', () => {
    it('should create product when valid and code is unique', async () => {
      const product = createTestProduct();
      vi.mocked(mockRepo.findByCode).mockResolvedValue(null);
      vi.mocked(mockRepo.create).mockResolvedValue(product);

      const result = await useCase.createProduct(product);

      expect(result).toEqual(product);
      expect(mockRepo.create).toHaveBeenCalledWith(product);
    });

    it('should throw ValidationError when product is invalid', async () => {
      const invalidProduct: Product = {
        ...createTestProduct(),
        code: '', // Invalid: empty code
      };

      await expect(useCase.createProduct(invalidProduct)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when code already exists', async () => {
      const product = createTestProduct();
      const existingProduct = createTestProduct('prod-2', 'CODE-001');
      vi.mocked(mockRepo.findByCode).mockResolvedValue(existingProduct);

      await expect(useCase.createProduct(product)).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product when exists', async () => {
      const product = createTestProduct();
      vi.mocked(mockRepo.findById).mockResolvedValue(product);
      vi.mocked(mockRepo.delete).mockResolvedValue(true);

      const result = await useCase.deleteProduct('prod-1');

      expect(result).toBe(true);
      expect(mockRepo.delete).toHaveBeenCalledWith('prod-1');
    });

    it('should throw NotFoundError when product does not exist', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      await expect(useCase.deleteProduct('prod-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('hasStock', () => {
    it('should return true when stock is sufficient', async () => {
      const product = createTestProduct('prod-1', 'CODE-001', 100);
      vi.mocked(mockRepo.findById).mockResolvedValue(product);

      const result = await useCase.hasStock('prod-1', 50);

      expect(result).toBe(true);
    });

    it('should return false when stock is insufficient', async () => {
      const product = createTestProduct('prod-1', 'CODE-001', 10);
      vi.mocked(mockRepo.findById).mockResolvedValue(product);

      const result = await useCase.hasStock('prod-1', 50);

      expect(result).toBe(false);
    });

    it('should return true when stock equals required quantity', async () => {
      const product = createTestProduct('prod-1', 'CODE-001', 50);
      vi.mocked(mockRepo.findById).mockResolvedValue(product);

      const result = await useCase.hasStock('prod-1', 50);

      expect(result).toBe(true);
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products in specified category', async () => {
      const products = [
        createTestProduct('prod-1', 'CODE-001'),
        { ...createTestProduct('prod-2', 'CODE-002'), category: 'Books' },
        createTestProduct('prod-3', 'CODE-003'),
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.getProductsByCategory('Electronics');

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.category === 'Electronics')).toBe(true);
    });

    it('should be case-insensitive', async () => {
      const products = [createTestProduct('prod-1', 'CODE-001')];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.getProductsByCategory('electronics');

      expect(result).toHaveLength(1);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with stock below threshold', async () => {
      const products = [
        createTestProduct('prod-1', 'CODE-001', 5),
        createTestProduct('prod-2', 'CODE-002', 15),
        createTestProduct('prod-3', 'CODE-003', 8),
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.getLowStockProducts(10);

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.stock.value <= 10)).toBe(true);
    });

    it('should use default threshold of 10', async () => {
      const products = [
        createTestProduct('prod-1', 'CODE-001', 5),
        createTestProduct('prod-2', 'CODE-002', 15),
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.getLowStockProducts();

      expect(result).toHaveLength(1);
      expect(result[0].stock.value).toBe(5);
    });

    it('should include products with stock equal to threshold', async () => {
      const products = [createTestProduct('prod-1', 'CODE-001', 10)];
      vi.mocked(mockRepo.findAll).mockResolvedValue(products);

      const result = await useCase.getLowStockProducts(10);

      expect(result).toHaveLength(1);
    });
  });
});
