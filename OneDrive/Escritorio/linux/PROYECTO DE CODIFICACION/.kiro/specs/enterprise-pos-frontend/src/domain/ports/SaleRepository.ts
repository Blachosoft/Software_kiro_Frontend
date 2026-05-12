/**
 * SaleRepository Port
 * 
 * Defines the contract for persisting and retrieving sales.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

import type { Sale } from '../entities/Sale';

/**
 * Repository interface for Sale entity
 * Defines operations for sale persistence and retrieval
 */
export interface SaleRepository {
  /**
   * Saves a sale (create or update)
   * @param sale - The sale to save
   * @returns Promise resolving to the saved sale
   */
  save(sale: Sale): Promise<Sale>;

  /**
   * Finds a sale by its ID
   * @param id - The sale ID
   * @returns Promise resolving to the sale or null if not found
   */
  findById(id: string): Promise<Sale | null>;

  /**
   * Finds all sales within a date range
   * @param start - Start date
   * @param end - End date
   * @returns Promise resolving to array of sales
   */
  findByDateRange(start: Date, end: Date): Promise<Sale[]>;

  /**
   * Finds all sales for a specific customer
   * @param customerId - The customer ID
   * @returns Promise resolving to array of sales
   */
  findByCustomerId(customerId: string): Promise<Sale[]>;

  /**
   * Finds all sales (with optional pagination)
   * @param limit - Maximum number of results (optional)
   * @param offset - Number of results to skip (optional)
   * @returns Promise resolving to array of sales
   */
  findAll(limit?: number, offset?: number): Promise<Sale[]>;
}
