import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateReportUseCase } from '../GenerateReportUseCase';
import type { SaleRepository } from '../../../domain/ports/SaleRepository';
import type { ReportService } from '../../../domain/ports/ReportService';
import type { Sale, SaleItem } from '../../../domain/entities/Sale';
import type { DateRange, Report } from '../../../domain/entities/Report';
import { Money } from '../../../domain/value-objects/Money';
import { Quantity } from '../../../domain/value-objects/Quantity';
import { NotFoundError, ValidationError } from '../../../domain/errors/DomainError';

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

function createMockReportService(): ReportService {
  return {
    generateReport: vi.fn(),
    exportReport: vi.fn(),
    getReport: vi.fn(),
    listReports: vi.fn(),
    deleteReport: vi.fn(),
  };
}

// Test data helpers
function createTestSaleItem(
  productId: string = 'prod-1',
  quantity: number = 2,
  price: number = 10
): SaleItem {
  return {
    productId,
    productName: `Product ${productId}`,
    quantity: Quantity.create(quantity),
    unitPrice: Money.create(price),
    subtotal: Money.create(price * quantity),
  };
}

function createTestSale(
  id: string = 'sale-1',
  items: SaleItem[] = [createTestSaleItem()],
  status: 'draft' | 'completed' | 'cancelled' = 'completed'
): Sale {
  return {
    id,
    items,
    status,
    createdAt: new Date('2024-01-01'),
    completedAt: status === 'completed' ? new Date('2024-01-01') : undefined,
  };
}

function createTestDateRange(): DateRange {
  return {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31'),
  };
}

function createTestReport(id: string = 'report-1'): Report {
  return {
    id,
    type: 'sales',
    title: 'Test Report',
    dateRange: createTestDateRange(),
    generatedAt: new Date(),
    generatedBy: 'user-1',
    data: [],
  };
}

describe('GenerateReportUseCase', () => {
  let useCase: GenerateReportUseCase;
  let mockSaleRepo: SaleRepository;
  let mockReportService: ReportService;

  beforeEach(() => {
    mockSaleRepo = createMockSaleRepository();
    mockReportService = createMockReportService();
    useCase = new GenerateReportUseCase(mockSaleRepo, mockReportService);
  });

  describe('generateSalesReport', () => {
    it('should generate sales report with metrics', async () => {
      const dateRange = createTestDateRange();
      const sales = [
        createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)]),
        createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 20)]),
      ];
      vi.mocked(mockSaleRepo.findByDateRange).mockResolvedValue(sales);

      const result = await useCase.generateSalesReport(dateRange, 'user-1');

      expect(result.type).toBe('sales');
      expect(result.generatedBy).toBe('user-1');
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalSales.amount).toBe(40);
      expect(result.metrics?.transactionCount).toBe(2);
    });

    it('should throw ValidationError when start date is after end date', async () => {
      const invalidDateRange: DateRange = {
        start: new Date('2024-01-31'),
        end: new Date('2024-01-01'),
      };

      await expect(
        useCase.generateSalesReport(invalidDateRange, 'user-1')
      ).rejects.toThrow(ValidationError);
    });

    it('should handle empty sales list', async () => {
      const dateRange = createTestDateRange();
      vi.mocked(mockSaleRepo.findByDateRange).mockResolvedValue([]);

      const result = await useCase.generateSalesReport(dateRange, 'user-1');

      expect(result.metrics?.totalSales.amount).toBe(0);
      expect(result.metrics?.transactionCount).toBe(0);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate correct total sales', () => {
      const sales = [
        createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)]), // 20
        createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 30)]), // 30
      ];

      const metrics = useCase.calculateMetrics(sales);

      expect(metrics.totalSales.amount).toBe(50);
    });

    it('should calculate correct average sale', () => {
      const sales = [
        createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)]), // 20
        createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 30)]), // 30
      ];

      const metrics = useCase.calculateMetrics(sales);

      expect(metrics.averageSale.amount).toBe(25);
    });

    it('should count only completed sales', () => {
      const sales = [
        createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)], 'completed'),
        createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 30)], 'draft'),
        createTestSale('sale-3', [createTestSaleItem('prod-3', 1, 20)], 'completed'),
      ];

      const metrics = useCase.calculateMetrics(sales);

      expect(metrics.transactionCount).toBe(2);
      expect(metrics.totalSales.amount).toBe(40); // Only completed sales
    });

    it('should calculate top products correctly', () => {
      const sales = [
        createTestSale('sale-1', [
          createTestSaleItem('prod-1', 2, 10), // 20
          createTestSaleItem('prod-2', 1, 50), // 50
        ]),
        createTestSale('sale-2', [
          createTestSaleItem('prod-1', 1, 10), // 10
          createTestSaleItem('prod-3', 2, 15), // 30
        ]),
      ];

      const metrics = useCase.calculateMetrics(sales);

      expect(metrics.topProducts).toHaveLength(3);
      
      // Check that prod-2 has highest revenue
      expect(metrics.topProducts[0].productId).toBe('prod-2');
      expect(metrics.topProducts[0].revenue.amount).toBe(50);
      
      // Check that all products are present
      const productIds = metrics.topProducts.map(p => p.productId);
      expect(productIds).toContain('prod-1');
      expect(productIds).toContain('prod-2');
      expect(productIds).toContain('prod-3');
      
      // Check prod-1 quantity
      const prod1 = metrics.topProducts.find(p => p.productId === 'prod-1');
      expect(prod1?.quantitySold).toBe(3); // 2 + 1
      expect(prod1?.revenue.amount).toBe(30); // 20 + 10
    });

    it('should return empty metrics for empty sales', () => {
      const metrics = useCase.calculateMetrics([]);

      expect(metrics.totalSales.amount).toBe(0);
      expect(metrics.averageSale.amount).toBe(0);
      expect(metrics.transactionCount).toBe(0);
      expect(metrics.topProducts).toHaveLength(0);
    });

    it('should limit top products to 10', () => {
      const items = Array.from({ length: 15 }, (_, i) =>
        createTestSaleItem(`prod-${i}`, 1, 10)
      );
      const sales = [createTestSale('sale-1', items)];

      const metrics = useCase.calculateMetrics(sales);

      expect(metrics.topProducts).toHaveLength(10);
    });
  });

  describe('exportReport', () => {
    it('should export report in specified format', async () => {
      const report = createTestReport();
      vi.mocked(mockReportService.getReport).mockResolvedValue(report);
      vi.mocked(mockReportService.exportReport).mockResolvedValue('exported-data');

      const result = await useCase.exportReport('report-1', 'csv');

      expect(result).toBe('exported-data');
      expect(mockReportService.exportReport).toHaveBeenCalledWith('report-1', 'csv');
    });

    it('should throw NotFoundError when report not found', async () => {
      vi.mocked(mockReportService.getReport).mockResolvedValue(null);

      await expect(useCase.exportReport('report-999', 'csv')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getReport', () => {
    it('should return report when found', async () => {
      const report = createTestReport();
      vi.mocked(mockReportService.getReport).mockResolvedValue(report);

      const result = await useCase.getReport('report-1');

      expect(result).toEqual(report);
    });

    it('should throw NotFoundError when report not found', async () => {
      vi.mocked(mockReportService.getReport).mockResolvedValue(null);

      await expect(useCase.getReport('report-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listReports', () => {
    it('should list reports for user', async () => {
      const reports = [createTestReport('report-1'), createTestReport('report-2')];
      vi.mocked(mockReportService.listReports).mockResolvedValue(reports);

      const result = await useCase.listReports('user-1');

      expect(result).toEqual(reports);
      expect(mockReportService.listReports).toHaveBeenCalledWith('user-1', undefined);
    });

    it('should pass limit parameter', async () => {
      vi.mocked(mockReportService.listReports).mockResolvedValue([]);

      await useCase.listReports('user-1', 10);

      expect(mockReportService.listReports).toHaveBeenCalledWith('user-1', 10);
    });
  });

  describe('deleteReport', () => {
    it('should delete report when exists', async () => {
      const report = createTestReport();
      vi.mocked(mockReportService.getReport).mockResolvedValue(report);
      vi.mocked(mockReportService.deleteReport).mockResolvedValue(true);

      const result = await useCase.deleteReport('report-1');

      expect(result).toBe(true);
      expect(mockReportService.deleteReport).toHaveBeenCalledWith('report-1');
    });

    it('should throw NotFoundError when report not found', async () => {
      vi.mocked(mockReportService.getReport).mockResolvedValue(null);

      await expect(useCase.deleteReport('report-999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getSalesSummary', () => {
    it('should return sales metrics for date range', async () => {
      const dateRange = createTestDateRange();
      const sales = [
        createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)]),
        createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 20)]),
      ];
      vi.mocked(mockSaleRepo.findByDateRange).mockResolvedValue(sales);

      const result = await useCase.getSalesSummary(dateRange);

      expect(result.totalSales.amount).toBe(40);
      expect(result.transactionCount).toBe(2);
    });
  });

  describe('getDailySales', () => {
    it('should group sales by day', async () => {
      const dateRange = createTestDateRange();
      const sales = [
        {
          ...createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)]),
          completedAt: new Date('2024-01-01'),
        },
        {
          ...createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 20)]),
          completedAt: new Date('2024-01-01'),
        },
        {
          ...createTestSale('sale-3', [createTestSaleItem('prod-3', 1, 30)]),
          completedAt: new Date('2024-01-02'),
        },
      ];
      vi.mocked(mockSaleRepo.findByDateRange).mockResolvedValue(sales);

      const result = await useCase.getDailySales(dateRange);

      expect(result.size).toBe(2);
      expect(result.get('2024-01-01')?.amount).toBe(40); // 20 + 20
      expect(result.get('2024-01-02')?.amount).toBe(30);
    });

    it('should only include completed sales', async () => {
      const dateRange = createTestDateRange();
      const sales = [
        {
          ...createTestSale('sale-1', [createTestSaleItem('prod-1', 2, 10)], 'completed'),
          completedAt: new Date('2024-01-01'),
        },
        {
          ...createTestSale('sale-2', [createTestSaleItem('prod-2', 1, 20)], 'draft'),
          completedAt: undefined,
        },
      ];
      vi.mocked(mockSaleRepo.findByDateRange).mockResolvedValue(sales);

      const result = await useCase.getDailySales(dateRange);

      expect(result.size).toBe(1);
      expect(result.get('2024-01-01')?.amount).toBe(20);
    });
  });
});
