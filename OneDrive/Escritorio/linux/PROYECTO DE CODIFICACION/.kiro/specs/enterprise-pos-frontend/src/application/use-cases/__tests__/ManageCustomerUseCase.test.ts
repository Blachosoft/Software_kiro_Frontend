import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ManageCustomerUseCase } from '../ManageCustomerUseCase';
import type { CustomerRepository } from '../../../domain/ports/CustomerRepository';
import type { SaleRepository } from '../../../domain/ports/SaleRepository';
import type { Customer } from '../../../domain/entities/Customer';
import type { Sale } from '../../../domain/entities/Sale';
import { Money } from '../../../domain/value-objects/Money';
import { Email } from '../../../domain/value-objects/Email';
import { PhoneNumber } from '../../../domain/value-objects/PhoneNumber';
import { NotFoundError, ValidationError } from '../../../domain/errors/DomainError';

// Mock repositories
function createMockCustomerRepository(): CustomerRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    search: vi.fn(),
    update: vi.fn(),
    findAll: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockSaleRepository(): SaleRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByDateRange: vi.fn(),
    findByCustomerId: vi.fn(),
    findAll: vi.fn(),
  };
}

// Test data helpers
function createTestCustomer(id: string = 'cust-1', email?: string): Customer {
  return {
    id,
    name: 'John Doe',
    email: email ? Email.create(email) : undefined,
    phone: PhoneNumber.create('1234567890'),
    createdAt: new Date(),
    totalPurchases: Money.create(0),
  };
}

function createTestSale(id: string = 'sale-1'): Sale {
  return {
    id,
    items: [],
    status: 'draft',
    createdAt: new Date(),
  };
}

describe('ManageCustomerUseCase', () => {
  let useCase: ManageCustomerUseCase;
  let mockCustomerRepo: CustomerRepository;
  let mockSaleRepo: SaleRepository;

  beforeEach(() => {
    mockCustomerRepo = createMockCustomerRepository();
    mockSaleRepo = createMockSaleRepository();
    useCase = new ManageCustomerUseCase(mockCustomerRepo, mockSaleRepo);
  });

  describe('createCustomer', () => {
    it('should create customer when valid', async () => {
      const customer = createTestCustomer();
      vi.mocked(mockCustomerRepo.search).mockResolvedValue([]);
      vi.mocked(mockCustomerRepo.save).mockResolvedValue(customer);

      const result = await useCase.createCustomer(customer);

      expect(result).toEqual(customer);
      expect(mockCustomerRepo.save).toHaveBeenCalledWith(customer);
    });

    it('should throw ValidationError when customer is invalid', async () => {
      const invalidCustomer: Customer = {
        ...createTestCustomer(),
        name: '', // Invalid: empty name
      };

      await expect(useCase.createCustomer(invalidCustomer)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when email already exists', async () => {
      const customer = createTestCustomer('cust-1', 'john@example.com');
      const existingCustomer = createTestCustomer('cust-2', 'john@example.com');
      vi.mocked(mockCustomerRepo.search).mockResolvedValue([existingCustomer]);

      await expect(useCase.createCustomer(customer)).rejects.toThrow(ValidationError);
    });

    it('should allow creating customer without email', async () => {
      const customer: Customer = {
        ...createTestCustomer(),
        email: undefined,
      };
      vi.mocked(mockCustomerRepo.save).mockResolvedValue(customer);

      const result = await useCase.createCustomer(customer);

      expect(result).toEqual(customer);
    });
  });

  describe('searchCustomers', () => {
    it('should return all customers when query is empty', async () => {
      const customers = [createTestCustomer('cust-1'), createTestCustomer('cust-2')];
      vi.mocked(mockCustomerRepo.findAll).mockResolvedValue(customers);

      const result = await useCase.searchCustomers('');

      expect(result).toEqual(customers);
      expect(mockCustomerRepo.findAll).toHaveBeenCalled();
    });

    it('should search customers by query', async () => {
      const customers = [createTestCustomer('cust-1')];
      vi.mocked(mockCustomerRepo.search).mockResolvedValue(customers);

      const result = await useCase.searchCustomers('john');

      expect(result).toEqual(customers);
      expect(mockCustomerRepo.search).toHaveBeenCalledWith('john');
    });

    it('should trim whitespace from query', async () => {
      vi.mocked(mockCustomerRepo.search).mockResolvedValue([]);

      await useCase.searchCustomers('  john  ');

      expect(mockCustomerRepo.search).toHaveBeenCalledWith('john');
    });
  });

  describe('getCustomerById', () => {
    it('should return customer when found', async () => {
      const customer = createTestCustomer();
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);

      const result = await useCase.getCustomerById('cust-1');

      expect(result).toEqual(customer);
    });

    it('should throw NotFoundError when customer not found', async () => {
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(null);

      await expect(useCase.getCustomerById('cust-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getAllCustomers', () => {
    it('should return all customers', async () => {
      const customers = [createTestCustomer('cust-1'), createTestCustomer('cust-2')];
      vi.mocked(mockCustomerRepo.findAll).mockResolvedValue(customers);

      const result = await useCase.getAllCustomers();

      expect(result).toEqual(customers);
    });

    it('should pass pagination parameters', async () => {
      vi.mocked(mockCustomerRepo.findAll).mockResolvedValue([]);

      await useCase.getAllCustomers(10, 20);

      expect(mockCustomerRepo.findAll).toHaveBeenCalledWith(10, 20);
    });
  });

  describe('updateCustomer', () => {
    it('should update customer when valid', async () => {
      const customer = createTestCustomer();
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);
      vi.mocked(mockCustomerRepo.update).mockResolvedValue(customer);

      const result = await useCase.updateCustomer(customer);

      expect(result).toEqual(customer);
      expect(mockCustomerRepo.update).toHaveBeenCalledWith(customer);
    });

    it('should throw ValidationError when customer is invalid', async () => {
      const invalidCustomer: Customer = {
        ...createTestCustomer(),
        name: '', // Invalid
      };

      await expect(useCase.updateCustomer(invalidCustomer)).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      const customer = createTestCustomer();
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(null);

      await expect(useCase.updateCustomer(customer)).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer when exists', async () => {
      const customer = createTestCustomer();
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);
      vi.mocked(mockCustomerRepo.delete).mockResolvedValue(true);

      const result = await useCase.deleteCustomer('cust-1');

      expect(result).toBe(true);
      expect(mockCustomerRepo.delete).toHaveBeenCalledWith('cust-1');
    });

    it('should throw NotFoundError when customer does not exist', async () => {
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(null);

      await expect(useCase.deleteCustomer('cust-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('associateCustomerWithSale', () => {
    it('should associate customer with sale', async () => {
      const sale = createTestSale();
      const customer = createTestCustomer();
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);
      vi.mocked(mockSaleRepo.save).mockImplementation((s) => Promise.resolve(s));

      const result = await useCase.associateCustomerWithSale('sale-1', 'cust-1');

      expect(result.customerId).toBe('cust-1');
      expect(mockSaleRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError when sale not found', async () => {
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.associateCustomerWithSale('sale-999', 'cust-1')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when customer not found', async () => {
      const sale = createTestSale();
      vi.mocked(mockSaleRepo.findById).mockResolvedValue(sale);
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(null);

      await expect(
        useCase.associateCustomerWithSale('sale-1', 'cust-999')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCustomerPurchaseHistory', () => {
    it('should return customer purchase history', async () => {
      const customer = createTestCustomer();
      const sales = [createTestSale('sale-1'), createTestSale('sale-2')];
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);
      vi.mocked(mockSaleRepo.findByCustomerId).mockResolvedValue(sales);

      const result = await useCase.getCustomerPurchaseHistory('cust-1');

      expect(result).toEqual(sales);
      expect(mockSaleRepo.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });

    it('should throw NotFoundError when customer not found', async () => {
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(null);

      await expect(useCase.getCustomerPurchaseHistory('cust-999')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateTotalPurchases', () => {
    it('should update customer total purchases', async () => {
      const customer = createTestCustomer();
      const amount = Money.create(100);
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);
      vi.mocked(mockCustomerRepo.update).mockImplementation((c) => Promise.resolve(c));

      const result = await useCase.updateTotalPurchases('cust-1', amount);

      expect(result.totalPurchases.amount).toBe(100);
      expect(mockCustomerRepo.update).toHaveBeenCalled();
    });

    it('should add to existing total purchases', async () => {
      const customer: Customer = {
        ...createTestCustomer(),
        totalPurchases: Money.create(50),
      };
      const amount = Money.create(100);
      vi.mocked(mockCustomerRepo.findById).mockResolvedValue(customer);
      vi.mocked(mockCustomerRepo.update).mockImplementation((c) => Promise.resolve(c));

      const result = await useCase.updateTotalPurchases('cust-1', amount);

      expect(result.totalPurchases.amount).toBe(150);
    });
  });

  describe('getTopCustomers', () => {
    it('should return top customers by total purchases', async () => {
      const customers = [
        { ...createTestCustomer('cust-1'), totalPurchases: Money.create(100) },
        { ...createTestCustomer('cust-2'), totalPurchases: Money.create(500) },
        { ...createTestCustomer('cust-3'), totalPurchases: Money.create(300) },
      ];
      vi.mocked(mockCustomerRepo.findAll).mockResolvedValue(customers);

      const result = await useCase.getTopCustomers(2);

      expect(result).toHaveLength(2);
      expect(result[0].totalPurchases.amount).toBe(500);
      expect(result[1].totalPurchases.amount).toBe(300);
    });

    it('should use default limit of 10', async () => {
      const customers = Array.from({ length: 15 }, (_, i) => ({
        ...createTestCustomer(`cust-${i}`),
        totalPurchases: Money.create(i * 10),
      }));
      vi.mocked(mockCustomerRepo.findAll).mockResolvedValue(customers);

      const result = await useCase.getTopCustomers();

      expect(result).toHaveLength(10);
    });
  });
});
