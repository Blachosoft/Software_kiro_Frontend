/**
 * GenerateReportUseCase
 * 
 * Use case for generating business reports.
 * Orchestrates domain logic for creating sales and inventory reports.
 * 
 * This is part of the Application Layer in hexagonal architecture.
 * Depends ONLY on domain interfaces (ports), not on concrete implementations.
 */

import type { Report, DateRange, SalesMetrics, ReportFormat } from '../../domain/entities/Report';
import type { Sale } from '../../domain/entities/Sale';
import type { SaleRepository } from '../../domain/ports/SaleRepository';
import type { ReportService } from '../../domain/ports/ReportService';
import { Money } from '../../domain/value-objects/Money';
import { calculateSaleTotal } from '../../domain/logic/saleCalculations';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';

/**
 * GenerateReportUseCase
 * Handles all operations related to report generation
 */
export class GenerateReportUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly reportService: ReportService
  ) {}

  /**
   * Generates a sales report for a date range
   * @param dateRange - The date range for the report
   * @param userId - The ID of the user generating the report
   * @returns Promise resolving to the generated report
   * @throws ValidationError if date range is invalid
   */
  async generateSalesReport(dateRange: DateRange, userId: string): Promise<Report> {
    // Validate date range
    if (dateRange.start > dateRange.end) {
      throw new ValidationError('Start date must be before end date', 'dateRange', 'range');
    }

    // Get sales for date range
    const sales = await this.saleRepository.findByDateRange(dateRange.start, dateRange.end);

    // Calculate metrics
    const metrics = this.calculateMetrics(sales);

    // Create report
    const report: Report = {
      id: this.generateReportId(),
      type: 'sales',
      title: `Sales Report (${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()})`,
      dateRange,
      generatedAt: new Date(),
      generatedBy: userId,
      data: sales,
      metrics,
    };

    return report;
  }

  /**
   * Calculates sales metrics from a list of sales
   * @param sales - Array of sales
   * @returns Sales metrics
   */
  calculateMetrics(sales: Sale[]): SalesMetrics {
    // Filter only completed sales
    const completedSales = sales.filter((sale) => sale.status === 'completed');

    if (completedSales.length === 0) {
      return {
        totalSales: Money.create(0),
        averageSale: Money.create(0),
        transactionCount: 0,
        topProducts: [],
      };
    }

    // Calculate total sales
    const totalSales = completedSales.reduce((total, sale) => {
      const saleTotal = calculateSaleTotal(sale);
      return Money.add(total, saleTotal);
    }, Money.create(0, completedSales[0].items[0]?.subtotal.currency || 'USD'));

    // Calculate average sale
    const averageSale = Money.create(
      totalSales.amount / completedSales.length,
      totalSales.currency
    );

    // Calculate top products
    const productSales = new Map<
      string,
      { productId: string; productName: string; quantitySold: number; revenue: number }
    >();

    completedSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.productId);
        if (existing) {
          existing.quantitySold += item.quantity.value;
          existing.revenue += item.subtotal.amount;
        } else {
          productSales.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            quantitySold: item.quantity.value,
            revenue: item.subtotal.amount,
          });
        }
      });
    });

    // Sort by revenue and get top 10
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((product) => ({
        ...product,
        revenue: Money.create(product.revenue, totalSales.currency),
      }));

    return {
      totalSales,
      averageSale,
      transactionCount: completedSales.length,
      topProducts,
    };
  }

  /**
   * Exports a report to a specific format
   * @param reportId - The report ID
   * @param format - The export format
   * @returns Promise resolving to the exported data
   * @throws NotFoundError if report not found
   */
  async exportReport(reportId: string, format: ReportFormat): Promise<Blob | string> {
    // Get the report
    const report = await this.reportService.getReport(reportId);
    if (!report) {
      throw new NotFoundError('Report not found', 'Report', reportId);
    }

    // Export using report service
    return this.reportService.exportReport(reportId, format);
  }

  /**
   * Gets a previously generated report
   * @param reportId - The report ID
   * @returns Promise resolving to the report
   * @throws NotFoundError if report not found
   */
  async getReport(reportId: string): Promise<Report> {
    const report = await this.reportService.getReport(reportId);
    if (!report) {
      throw new NotFoundError('Report not found', 'Report', reportId);
    }
    return report;
  }

  /**
   * Lists all reports for a user
   * @param userId - The user ID
   * @param limit - Maximum number of reports to return
   * @returns Promise resolving to array of reports
   */
  async listReports(userId: string, limit?: number): Promise<Report[]> {
    return this.reportService.listReports(userId, limit);
  }

  /**
   * Deletes a report
   * @param reportId - The report ID
   * @returns Promise resolving to true if deleted
   * @throws NotFoundError if report not found
   */
  async deleteReport(reportId: string): Promise<boolean> {
    const report = await this.reportService.getReport(reportId);
    if (!report) {
      throw new NotFoundError('Report not found', 'Report', reportId);
    }

    return this.reportService.deleteReport(reportId);
  }

  /**
   * Gets sales summary for a date range
   * @param dateRange - The date range
   * @returns Promise resolving to sales metrics
   */
  async getSalesSummary(dateRange: DateRange): Promise<SalesMetrics> {
    const sales = await this.saleRepository.findByDateRange(dateRange.start, dateRange.end);
    return this.calculateMetrics(sales);
  }

  /**
   * Gets daily sales for a date range
   * @param dateRange - The date range
   * @returns Promise resolving to map of date to total sales
   */
  async getDailySales(dateRange: DateRange): Promise<Map<string, Money>> {
    const sales = await this.saleRepository.findByDateRange(dateRange.start, dateRange.end);
    const completedSales = sales.filter((sale) => sale.status === 'completed');

    const dailySales = new Map<string, Money>();

    completedSales.forEach((sale) => {
      const dateKey = sale.completedAt?.toISOString().split('T')[0] || '';
      if (!dateKey) return;

      const saleTotal = calculateSaleTotal(sale);
      const existing = dailySales.get(dateKey);

      if (existing) {
        dailySales.set(dateKey, Money.add(existing, saleTotal));
      } else {
        dailySales.set(dateKey, saleTotal);
      }
    });

    return dailySales;
  }

  /**
   * Generates a unique report ID
   */
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
