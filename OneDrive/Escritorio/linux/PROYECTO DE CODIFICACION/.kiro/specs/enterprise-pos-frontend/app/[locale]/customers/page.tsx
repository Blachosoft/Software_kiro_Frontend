/**
 * Customers Page
 * 
 * Route page for customer management.
 * Renders the CustomersScreen component with necessary hooks.
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

'use client';

import { CustomersScreen } from '../../../src/adapters/ui/screens/CustomersScreen';
import { useCustomer } from '../../../src/adapters/ui/hooks/useCustomer';
import { getDependencies } from '../../../src/config/dependencies';

export default function CustomersPage() {
  const { manageCustomerUseCase } = getDependencies();
  const customer = useCustomer({ manageCustomerUseCase });

  return <CustomersScreen customer={customer} />;
}
