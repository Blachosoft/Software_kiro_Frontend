/**
 * Report Entity
 * 
 * Represents a generated report with metrics and data.
 * Used for business intelligence and analytics.
 */

import type { Money } from '../value-objects/Money';

/**
 * Report type
 */
export type ReportType = 'sales' | 'inventory' | 'customers';

/**
 * Report format for export
 */
export type ReportFormat = 'csv' | 'pdf' | 'json';

/**
 * Date range for report filtering
 */
export interface DateRange {
  readonly start: Date;
  readonly end: Date;
}

/**
 * Sales metrics
 */
export interface SalesMetrics {
  readonly totalSales: Money;
  readonly averageSale: Money;
  readonly transactionCount: number;
  readonly topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: Money;
  }>;
}

/**
 * Report Entity
 * Represents a generated business report
 */
export interface Report {
  readonly id: string;
  readonly type: ReportType;
  readonly title: string;
  readonly dateRange: DateRange;
  readonly generatedAt: Date;
  readonly generatedBy: string; // User ID
  readonly data: unknown; // Report-specific data
  readonly metrics?: SalesMetrics;
}
