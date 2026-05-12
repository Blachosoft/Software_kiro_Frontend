/**
 * CustomerRepository Port
 * 
 * Defines the contract for persisting and retrieving customers.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

import type { Customer } from '../entities/Customer';

/**
 * Repository interface for Customer entity
 * Defines operations for customer persistence and retrieval
 */
export interface CustomerRepository {
  /**
   * Saves a customer (create or update)
   * @param customer - The customer to save
   * @returns Promise resolving to the saved customer
   */
  save(customer: Customer): Promise<Customer>;

  /**
   * Finds a customer by ID
   * @param id - The customer ID
   * @returns Promise resolving to the customer or null if not found
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Searches customers by query string
   * Searches in name, email, and phone fields
   * @param query - Search query string
   * @returns Promise resolving to array of matching customers
   */
  search(query: string): Promise<Customer[]>;

  /**
   * Updates a customer
   * @param customer - The customer to update
   * @returns Promise resolving to the updated customer
   */
  update(customer: Customer): Promise<Customer>;

  /**
   * Finds all customers (with optional pagination)
   * @param limit - Maximum number of results (optional)
   * @param offset - Number of results to skip (optional)
   * @returns Promise resolving to array of customers
   */
  findAll(limit?: number, offset?: number): Promise<Customer[]>;

  /**
   * Deletes a customer by ID
   * @param id - The customer ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;
}
