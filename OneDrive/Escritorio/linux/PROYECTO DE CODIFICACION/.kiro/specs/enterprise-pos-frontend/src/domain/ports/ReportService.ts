/**
 * ReportService Port
 * 
 * Defines the contract for report generation and export.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

import type { Report, ReportType, ReportFormat, DateRange } from '../entities/Report';

/**
 * Report generation options
 */
export interface ReportOptions {
  readonly type: ReportType;
  readonly dateRange: DateRange;
  readonly filters?: Record<string, unknown>;
  readonly groupBy?: string;
}

/**
 * Service interface for report generation
 * Defines operations for creating and exporting reports
 */
export interface ReportService {
  /**
   * Generates a report based on options
   * @param options - Report generation options
   * @param userId - ID of user generating the report
   * @returns Promise resolving to the generated report
   */
  generateReport(options: ReportOptions, userId: string): Promise<Report>;

  /**
   * Exports a report to a specific format
   * @param reportId - The report ID
   * @param format - The export format
   * @returns Promise resolving to the exported data as Blob or string
   */
  exportReport(reportId: string, format: ReportFormat): Promise<Blob | string>;

  /**
   * Gets a previously generated report
   * @param reportId - The report ID
   * @returns Promise resolving to the report or null if not found
   */
  getReport(reportId: string): Promise<Report | null>;

  /**
   * Lists all reports for a user
   * @param userId - The user ID
   * @param limit - Maximum number of results (optional)
   * @returns Promise resolving to array of reports
   */
  listReports(userId: string, limit?: number): Promise<Report[]>;

  /**
   * Deletes a report
   * @param reportId - The report ID
   * @returns Promise resolving to true if deleted
   */
  deleteReport(reportId: string): Promise<boolean>;
}
