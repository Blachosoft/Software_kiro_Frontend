/**
 * Dependency Injection Configuration
 * 
 * This file instantiates all adapter implementations and use cases,
 * wiring them together according to the dependency inversion principle.
 * All dependencies flow inward toward the domain layer.
 * 
 * **Validates: Requirements 2.4, 2.5**
 */

// Usar repositorios Mock para desarrollo sin backend
import { MockSaleRepository } from '../adapters/api/MockSaleRepository';
import { MockProductRepository } from '../adapters/api/MockProductRepository';
import { MockCustomerRepository } from '../adapters/api/MockCustomerRepository';
import { MockAuthService } from '../adapters/api/MockAuthService';
import { IndexedDBStorage } from '../adapters/storage/IndexedDBStorage';
import { LocalStorageAdapter } from '../adapters/storage/LocalStorageAdapter';
import { OfflineSyncQueue } from '../adapters/storage/OfflineSyncQueue';
import { MockReportService } from '../adapters/infrastructure/MockReportService';

import { ProcessSaleUseCase } from '../application/use-cases/ProcessSaleUseCase';
import { ManageInventoryUseCase } from '../application/use-cases/ManageInventoryUseCase';
import { ManageCustomerUseCase } from '../application/use-cases/ManageCustomerUseCase';
import { GenerateReportUseCase } from '../application/use-cases/GenerateReportUseCase';
import { AuthenticateUserUseCase } from '../application/use-cases/AuthenticateUserUseCase';

import { env } from './env';

/**
 * Dependency Container
 * Holds all instantiated dependencies for the application
 */
export interface Dependencies {
  // Repositories
  saleRepository: MockSaleRepository;
  productRepository: MockProductRepository;
  customerRepository: MockCustomerRepository;
  
  // Services
  authService: MockAuthService;
  reportService: MockReportService;
  
  // Storage
  storage: IndexedDBStorage;
  localStorage: LocalStorageAdapter;
  offlineSyncQueue: OfflineSyncQueue;
  
  // Use Cases
  processSaleUseCase: ProcessSaleUseCase;
  manageInventoryUseCase: ManageInventoryUseCase;
  manageCustomerUseCase: ManageCustomerUseCase;
  generateReportUseCase: GenerateReportUseCase;
  authenticateUserUseCase: AuthenticateUserUseCase;
}

/**
 * Create and configure all dependencies
 * This function is called once at application startup
 */
export function createDependencies(): Dependencies {
  // Instantiate Mock adapters (sin necesidad de backend)
  const saleRepository = new MockSaleRepository();
  const productRepository = new MockProductRepository();
  const customerRepository = new MockCustomerRepository();
  const authService = new MockAuthService();
  const reportService = new MockReportService();
  
  // Instantiate storage adapters
  const storage = new IndexedDBStorage();
  const localStorage = new LocalStorageAdapter();
  const offlineSyncQueue = new OfflineSyncQueue(storage, saleRepository);
  
  // Instantiate use cases with injected dependencies
  const processSaleUseCase = new ProcessSaleUseCase(
    saleRepository,
    productRepository
  );
  
  const manageInventoryUseCase = new ManageInventoryUseCase(
    productRepository
  );
  
  const manageCustomerUseCase = new ManageCustomerUseCase(
    customerRepository,
    saleRepository
  );
  
  const generateReportUseCase = new GenerateReportUseCase(
    saleRepository,
    reportService
  );
  
  const authenticateUserUseCase = new AuthenticateUserUseCase(
    authService
  );
  return {
    saleRepository,
    productRepository,
    customerRepository,
    authService,
    reportService,
    storage,
    localStorage,
    offlineSyncQueue,
    processSaleUseCase,
    manageInventoryUseCase,
    manageCustomerUseCase,
    generateReportUseCase,
    authenticateUserUseCase,
  };
}

/**
 * Global dependencies instance
 * Initialized once and reused throughout the application
 */
let dependencies: Dependencies | null = null;

/**
 * Get the global dependencies instance
 * Creates the instance on first call
 */
export function getDependencies(): Dependencies {
  if (!dependencies) {
    dependencies = createDependencies();
  }
  return dependencies;
}

/**
 * Reset dependencies (useful for testing)
 */
export function resetDependencies(): void {
  dependencies = null;
}
