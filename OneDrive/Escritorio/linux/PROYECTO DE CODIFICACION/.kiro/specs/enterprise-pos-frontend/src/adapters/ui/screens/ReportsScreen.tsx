/**
 * ReportsScreen Component
 * 
 * Screen for generating and viewing business reports.
 * Provides report parameter form, metrics display, and export functionality.
 * Integrates with GenerateReportUseCase for report generation.
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 15.3**
 */

'use client';

import { useState, useCallback } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import type { Report, DateRange, ReportFormat } from '../../../domain/entities/Report';
import { GenerateReportUseCase } from '../../../application/use-cases/GenerateReportUseCase';

/**
 * ReportsScreen Props
 */
export interface ReportsScreenProps {
  generateReportUseCase: GenerateReportUseCase;
  userId: string;
}

/**
 * ReportsScreen Component
 * 
 * Provides report generation interface with:
 * - Report parameter form (date range, filters)
 * - Report metrics and visualizations
 * - Export functionality (CSV/PDF)
 * - Loading and error states
 * - Accessibility features
 */
export function ReportsScreen({ generateReportUseCase, userId }: ReportsScreenProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Handle date range change
   */
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = new Date(e.target.value);
    setDateRange((prev) => ({ ...prev, start: newStart }));
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = new Date(e.target.value);
    setDateRange((prev) => ({ ...prev, end: newEnd }));
  }, []);

  /**
   * Handle generate report
   */
  const handleGenerateReport = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
        const report = await generateReportUseCase.generateSalesReport(dateRange, userId);
        setCurrentReport(report);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [dateRange, userId, generateReportUseCase]
  );

  /**
   * Handle export report
   */
  const handleExportReport = useCallback(
    async (format: ReportFormat) => {
      if (!currentReport) return;

      setIsExporting(true);
      try {
        const exportedData = await generateReportUseCase.exportReport(
          currentReport.id,
          format
        );

        // Create download link
        const blob =
          exportedData instanceof Blob
            ? exportedData
            : new Blob([exportedData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentReport.title.replace(/\s+/g, '_')}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
        setError(errorMessage);
      } finally {
        setIsExporting(false);
      }
    },
    [currentReport, generateReportUseCase]
  );

  /**
   * Format date for input
   */
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <ErrorBoundary>
      <div className="reports-screen min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and analyze business performance reports
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Report Parameters */}
          <div className="lg:col-span-1">
            <section
              aria-labelledby="report-params-heading"
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h2
                id="report-params-heading"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                Report Parameters
              </h2>

              <form onSubmit={handleGenerateReport} className="space-y-4">
                {/* Start Date */}
                <div>
                  <label
                    htmlFor="start-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={formatDateForInput(dateRange.start)}
                    onChange={handleStartDateChange}
                    max={formatDateForInput(dateRange.end)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor="end-date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    value={formatDateForInput(dateRange.end)}
                    onChange={handleEndDateChange}
                    min={formatDateForInput(dateRange.start)}
                    max={formatDateForInput(new Date())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </form>

              {/* Export Options */}
              {currentReport && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Export Report
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleExportReport('csv')}
                      disabled={isExporting}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExportReport('pdf')}
                      disabled={isExporting}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Export as PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div
                  role="alert"
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
                >
                  {error}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Report Display */}
          <div className="lg:col-span-2">
            {!currentReport && !isLoading && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>No report generated yet</p>
                <p className="text-sm mt-1">
                  Select a date range and click "Generate Report"
                </p>
              </div>
            )}

            {isLoading && (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600 mx-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="text-gray-700 mt-4">Generating report...</p>
              </div>
            )}

            {currentReport && !isLoading && (
              <section
                aria-labelledby="report-display-heading"
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h2
                  id="report-display-heading"
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {currentReport.title}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Generated on {currentReport.generatedAt.toLocaleString()}
                </p>

                {/* Metrics */}
                {currentReport.metrics && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-blue-600 mb-1">
                          Total Sales
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          ${currentReport.metrics.totalSales.amount.toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-green-600 mb-1">
                          Average Sale
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                          ${currentReport.metrics.averageSale.amount.toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-purple-600 mb-1">
                          Transactions
                        </div>
                        <div className="text-2xl font-bold text-purple-900">
                          {currentReport.metrics.transactionCount}
                        </div>
                      </div>
                    </div>

                    {/* Top Products */}
                    {currentReport.metrics.topProducts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          Top Products
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Product
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Quantity Sold
                                </th>
                                <th
                                  scope="col"
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Revenue
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {currentReport.metrics.topProducts.map((product, index) => (
                                <tr key={product.productId}>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                                        {index + 1}
                                      </div>
                                      <div className="ml-3 text-sm font-medium text-gray-900">
                                        {product.productName}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {product.quantitySold}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    ${product.revenue.amount.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* No Data Message */}
                    {currentReport.metrics.transactionCount === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No sales data available for the selected period</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
