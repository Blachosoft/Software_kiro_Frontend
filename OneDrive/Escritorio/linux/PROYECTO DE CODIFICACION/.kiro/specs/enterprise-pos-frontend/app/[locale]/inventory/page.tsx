/**
 * Inventory Page
 * 
 * Route page for inventory management.
 * Renders the InventoryScreen component with necessary hooks.
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

'use client';

import { InventoryScreen } from '../../../src/adapters/ui/screens/InventoryScreen';
import { useInventory } from '../../../src/adapters/ui/hooks/useInventory';
import { getDependencies } from '../../../src/config/dependencies';

export default function InventoryPage() {
  const { manageInventoryUseCase } = getDependencies();
  const inventory = useInventory({ manageInventoryUseCase });

  return <InventoryScreen inventory={inventory} />;
}
