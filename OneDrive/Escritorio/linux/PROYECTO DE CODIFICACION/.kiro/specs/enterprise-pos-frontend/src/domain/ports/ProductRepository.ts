/**
 * ProductRepository Port
 * 
 * Defines the contract for persisting and retrieving products.
 * This is a port interface in hexagonal architecture - implementations
 * are provided by adapters in the infrastructure layer.
 * 
 * NO framework dependencies allowed in this file.
 */

import type { Product } from '../entities/Product';

/**
 * Repository interface for Product entity
 * Defines operations for product persistence and retrieval
 */
export interface ProductRepository {
  /**
   * Finds all products
   * @param limit - Maximum number of results (optional)
   * @param offset - Number of results to skip (optional)
   * @returns Promise resolving to array of products
   */
  findAll(limit?: number, offset?: number): Promise<Product[]>;

  /**
   * Finds a product by its ID
   * @param id - The product ID
   * @returns Promise resolving to the product or null if not found
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Finds a product by its code
   * @param code - The product code
   * @returns Promise resolving to the product or null if not found
   */
  findByCode(code: string): Promise<Product | null>;

  /**
   * Searches products by query string
   * Searches in name, code, and category fields
   * @param query - Search query string
   * @returns Promise resolving to array of matching products
   */
  search(query: string): Promise<Product[]>;

  /**
   * Updates a product
   * @param product - The product to update
   * @returns Promise resolving to the updated product
   */
  update(product: Product): Promise<Product>;

  /**
   * Creates a new product
   * @param product - The product to create
   * @returns Promise resolving to the created product
   */
  create(product: Product): Promise<Product>;

  /**
   * Deletes a product by ID
   * @param id - The product ID
   * @returns Promise resolving to true if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;
}
