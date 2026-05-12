/**
 * Reports Page
 * 
 * Route page for reports and analytics.
 * Renders the ReportsScreen component.
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

'use client';

import { ReportsScreen } from '../../../src/adapters/ui/screens/ReportsScreen';
import { getDependencies } from '../../../src/config/dependencies';

export default function ReportsPage() {
  const { generateReportUseCase } = getDependencies();
  
  return <ReportsScreen generateReportUseCase={generateReportUseCase} userId="current-user" />;
}
