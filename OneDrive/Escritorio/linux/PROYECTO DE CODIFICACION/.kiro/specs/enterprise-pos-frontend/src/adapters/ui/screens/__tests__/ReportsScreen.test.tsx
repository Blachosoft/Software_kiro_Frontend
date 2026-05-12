/**
 * ReportsScreen Component Tests
 * 
 * Tests for the ReportsScreen component including:
 * - Component rendering
 * - Report parameter form
 * - Report generation
 * - Report display with metrics
 * - Export functionality
 * - Error handling
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportsScreen } from '../ReportsScreen';
import { GenerateReportUseCase } from '../../../../application/use-cases/GenerateReportUseCase';
import type { Report } from '../../../../domain/entities/Report';
import { Money } from '../../../../domain/value-objects/Money';

describe('ReportsScreen', () => {
  let mockGenerateReportUseCase: GenerateReportUseCase;
  let mockReport: Report;
  const userId = 'user-1';

  beforeEach(() => {
    mockReport = {
      id: 'report-1',
      type: 'sales',
      title: 'Sales Report (1/1/2024 - 1/31/2024)',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
      },
      generatedAt: new Date('2024-02-01'),
      generatedBy: userId,
      data: [],
      metrics: {
        totalSales: Money.create(5000),
        averageSale: Money.create(250),
        transactionCount: 20,
        topProducts: [
          {
            productId: 'prod-1',
            productName: 'Product A',
            quantitySold: 50,
            revenue: Money.create(2500),
          },
          {
            productId: 'prod-2',
            productName: 'Product B',
            quantitySold: 30,
            revenue: Money.create(1500),
          },
        ],
      },
    };

    mockGenerateReportUseCase = {
      generateSalesReport: vi.fn().mockResolvedValue(mockReport),
      exportReport: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
      getReport: vi.fn().mockResolvedValue(mockReport),
      listReports: vi.fn().mockResolvedValue([]),
      deleteReport: vi.fn().mockResolvedValue(true),
      calculateMetrics: vi.fn(),
      getSalesSummary: vi.fn(),
      getDailySales: vi.fn(),
    } as unknown as GenerateReportUseCase;
  });

  describe('Rendering', () => {
    it('should render the reports screen with all sections', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      expect(screen.getByRole('heading', { name: /^reports$/i })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /report parameters/i })
      ).toBeInTheDocument();
    });

    it('should render date range inputs', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('should render generate button', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      expect(
        screen.getByRole('button', { name: /generate report/i })
      ).toBeInTheDocument();
    });
  });

  describe('Report Generation', () => {
    it('should call generateSalesReport when form is submitted', async () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateReportUseCase.generateSalesReport).toHaveBeenCalledWith(
          expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
          }),
          userId
        );
      });
    });

    it('should display generated report', async () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /sales report/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByText('$5000.00')).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should show loading state while generating', async () => {
      mockGenerateReportUseCase.generateSalesReport = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockReport), 100))
        );

      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      expect(screen.getByText(/generating report\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.queryByText(/generating report\.\.\./i)
        ).not.toBeInTheDocument();
      });
    });

    it('should handle generation errors', async () => {
      mockGenerateReportUseCase.generateSalesReport = vi
        .fn()
        .mockRejectedValue(new Error('Failed to generate report'));

      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to generate report/i)).toBeInTheDocument();
      });
    });
  });

  describe('Report Display', () => {
    beforeEach(async () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /sales report/i })
        ).toBeInTheDocument();
      });
    });

    it('should display summary metrics', () => {
      expect(screen.getByText(/total sales/i)).toBeInTheDocument();
      expect(screen.getByText('$5000.00')).toBeInTheDocument();

      expect(screen.getByText(/average sale/i)).toBeInTheDocument();
      expect(screen.getByText('$250.00')).toBeInTheDocument();

      expect(screen.getByText(/transactions/i)).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should display top products table', () => {
      expect(screen.getByRole('heading', { name: /top products/i })).toBeInTheDocument();

      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('$2500.00')).toBeInTheDocument();

      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('$1500.00')).toBeInTheDocument();
    });

    it('should show export options', () => {
      expect(screen.getByRole('button', { name: /export as csv/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export as pdf/i })).toBeInTheDocument();
    });
  });

  describe('Report Export', () => {
    beforeEach(async () => {
      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();

      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /sales report/i })
        ).toBeInTheDocument();
      });
    });

    it('should export report as CSV', async () => {
      const exportButton = screen.getByRole('button', { name: /export as csv/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockGenerateReportUseCase.exportReport).toHaveBeenCalledWith(
          'report-1',
          'csv'
        );
      });
    });

    it('should export report as PDF', async () => {
      const exportButton = screen.getByRole('button', { name: /export as pdf/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockGenerateReportUseCase.exportReport).toHaveBeenCalledWith(
          'report-1',
          'pdf'
        );
      });
    });

    it('should handle export errors', async () => {
      mockGenerateReportUseCase.exportReport = vi
        .fn()
        .mockRejectedValue(new Error('Failed to export'));

      const exportButton = screen.getByRole('button', { name: /export as csv/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to export/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Selection', () => {
    it('should update start date', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const startDateInput = screen.getByLabelText(/start date/i);
      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

      expect(startDateInput).toHaveValue('2024-01-01');
    });

    it('should update end date', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const endDateInput = screen.getByLabelText(/end date/i);
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

      expect(endDateInput).toHaveValue('2024-01-31');
    });

    it('should enforce end date is after start date', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
      const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;

      fireEvent.change(startDateInput, { target: { value: '2024-01-15' } });

      expect(endDateInput).toHaveAttribute('min', '2024-01-15');
    });
  });

  describe('Empty States', () => {
    it('should show placeholder when no report generated', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      expect(screen.getByText(/no report generated yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/select a date range and click "generate report"/i)
      ).toBeInTheDocument();
    });

    it('should show empty state for no sales data', async () => {
      const emptyReport: Report = {
        ...mockReport,
        metrics: {
          totalSales: Money.create(0),
          averageSale: Money.create(0),
          transactionCount: 0,
          topProducts: [],
        },
      };

      mockGenerateReportUseCase.generateSalesReport = vi
        .fn()
        .mockResolvedValue(emptyReport);

      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(
          screen.getByText(/no sales data available for the selected period/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('should have accessible table structure', async () => {
      render(
        <ReportsScreen
          generateReportUseCase={mockGenerateReportUseCase}
          userId={userId}
        />
      );

      const generateButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(3);
    });
  });
});
