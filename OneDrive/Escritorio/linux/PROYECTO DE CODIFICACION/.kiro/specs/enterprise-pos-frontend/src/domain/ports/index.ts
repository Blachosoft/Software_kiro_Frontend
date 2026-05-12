/**
 * Domain Ports
 * 
 * Port interfaces define contracts between the domain and external systems.
 * These are pure TypeScript interfaces with NO framework dependencies.
 * Implementations are provided by adapters in the infrastructure layer.
 */

export * from './SaleRepository';
export * from './ProductRepository';
export * from './CustomerRepository';
export * from './AuthenticationService';
export * from './ReportService';
export * from './StorageService';
export * from './LoggingService';
