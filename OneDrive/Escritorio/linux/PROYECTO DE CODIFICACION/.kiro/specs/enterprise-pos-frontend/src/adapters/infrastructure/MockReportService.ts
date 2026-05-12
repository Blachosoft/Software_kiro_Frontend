/**
 * MockReportService
 *
 * Temporary mock implementation of ReportService for development.
 * In production, this would be replaced with a real HTTP-backed implementation.
 *
 * **Validates: Requirements 8.5**
 */

import type { ReportService, ReportOptions } from '../../domain/ports/ReportService';
import type { Report, ReportFormat } from '../../domain/entities/Report';
import { Money } from '../../domain/value-objects/Money';

export class MockReportService implements ReportService {
  private reports: Map<string, Report> = new Map();

  async generateReport(options: ReportOptions, userId: string): Promise<Report> {
    const report: Report = {
      id: `report-${Date.now()}`,
      type: options.type,
      title: `${options.type.charAt(0).toUpperCase() + options.type.slice(1)} Report`,
      dateRange: options.dateRange,
      generatedAt: new Date(),
      generatedBy: userId,
      data: [],
      metrics: {
        totalSales: Money.create(0),
        averageSale: Money.create(0),
        transactionCount: 0,
        topProducts: [],
      },
    };

    this.reports.set(report.id, report);
    return report;
  }

  async exportReport(reportId: string, format: ReportFormat): Promise<Blob | string> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const content = format === 'csv' ? this.formatAsCSV(report) : this.formatAsPDF(report);

    return new Blob([content], {
      type: format === 'csv' ? 'text/csv' : 'application/pdf',
    });
  }

  async getReport(reportId: string): Promise<Report | null> {
    return this.reports.get(reportId) ?? null;
  }

  async listReports(userId: string, limit?: number): Promise<Report[]> {
    const userReports = Array.from(this.reports.values()).filter(
      (r) => r.generatedBy === userId
    );
    return limit ? userReports.slice(0, limit) : userReports;
  }

  async deleteReport(reportId: string): Promise<boolean> {
    return this.reports.delete(reportId);
  }

  private formatAsCSV(report: Report): string {
    let csv = `Report: ${report.title}\n`;
    csv += `Generated: ${report.generatedAt.toISOString()}\n`;
    csv += `Period: ${report.dateRange.start.toISOString()} to ${report.dateRange.end.toISOString()}\n\n`;

    if (report.metrics) {
      csv += `Total Sales,${report.metrics.totalSales.amount}\n`;
      csv += `Average Sale,${report.metrics.averageSale.amount}\n`;
      csv += `Transaction Count,${report.metrics.transactionCount}\n\n`;

      if (report.metrics.topProducts.length > 0) {
        csv += `Top Products\n`;
        csv += `Product ID,Product Name,Quantity Sold,Revenue\n`;
        report.metrics.topProducts.forEach((p) => {
          csv += `${p.productId},${p.productName},${p.quantitySold},${p.revenue.amount}\n`;
        });
      }
    }

    return csv;
  }

  private formatAsPDF(report: Report): string {
    return `PDF Report: ${report.title}\nGenerated: ${report.generatedAt.toISOString()}\n\nThis is a mock PDF implementation.`;
  }
}
