/**
 * ManageInventoryUseCase
 * 
 * Use case for managing product inventory.
 * Orchestrates domain logic for searching, viewing, and updating products.
 * 
 * This is part of the Application Layer in hexagonal architecture.
 * Depends ONLY on domain interfaces (ports), not on concrete implementations.
 */

import type { Product } from '../../domain/entities/Product';
import type { ProductRepository } from '../../domain/ports/ProductRepository';
import { validateProduct } from '../../domain/logic/validation';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';

/**
 * ManageInventoryUseCase
 * Handles all operations related to inventory management
 */
export class ManageInventoryUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  /**
   * Searches for products by query string
   * Searches in name, code, and category fields
   * @param query - The search query
   * @returns Promise resolving to array of matching products
   */
  async searchProducts(query: string): Promise<Product[]> {
    if (!query || query.trim().length === 0) {
      return this.productRepository.findAll();
    }

    return this.productRepository.search(query.trim());
  }

  /**
   * Gets a product by ID
   * @param productId - The product ID
   * @returns Promise resolving to the product
   * @throws NotFoundError if product not found
   */
  async getProductById(productId: string): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    
    if (!product) {
      throw new NotFoundError('Product not found', 'Product', productId);
    }

    return product;
  }

  /**
   * Gets a product by code
   * @param code - The product code
   * @returns Promise resolving to the product
   * @throws NotFoundError if product not found
   */
  async getProductByCode(code: string): Promise<Product> {
    const product = await this.productRepository.findByCode(code);
    
    if (!product) {
      throw new NotFoundError('Product not found', 'Product', code);
    }

    return product;
  }

  /**
   * Gets all products with optional pagination
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Promise resolving to array of products
   */
  async getAllProducts(limit?: number, offset?: number): Promise<Product[]> {
    return this.productRepository.findAll(limit, offset);
  }

  /**
   * Updates a product
   * @param product - The product to update
   * @returns Promise resolving to the updated product
   * @throws ValidationError if product data is invalid
   * @throws NotFoundError if product not found
   */
  async updateProduct(product: Product): Promise<Product> {
    // Validate product data
    const validation = validateProduct(product);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join(', '),
        'product',
        'validation'
      );
    }

    // Check if product exists
    const existingProduct = await this.productRepository.findById(product.id);
    if (!existingProduct) {
      throw new NotFoundError('Product not found', 'Product', product.id);
    }

    // Update product
    return this.productRepository.update(product);
  }

  /**
   * Creates a new product
   * @param product - The product to create
   * @returns Promise resolving to the created product
   * @throws ValidationError if product data is invalid
   */
  async createProduct(product: Product): Promise<Product> {
    // Validate product data
    const validation = validateProduct(product);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join(', '),
        'product',
        'validation'
      );
    }

    // Check if product code already exists
    const existingProduct = await this.productRepository.findByCode(product.code);
    if (existingProduct) {
      throw new ValidationError(
        'Product code already exists',
        'code',
        'unique'
      );
    }

    // Create product
    return this.productRepository.create(product);
  }

  /**
   * Deletes a product
   * @param productId - The product ID
   * @returns Promise resolving to true if deleted
   * @throws NotFoundError if product not found
   */
  async deleteProduct(productId: string): Promise<boolean> {
    // Check if product exists
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found', 'Product', productId);
    }

    // Delete product
    return this.productRepository.delete(productId);
  }

  /**
   * Checks if a product has sufficient stock
   * @param productId - The product ID
   * @param requiredQuantity - The required quantity
   * @returns Promise resolving to true if stock is sufficient
   * @throws NotFoundError if product not found
   */
  async hasStock(productId: string, requiredQuantity: number): Promise<boolean> {
    const product = await this.getProductById(productId);
    return product.stock.value >= requiredQuantity;
  }

  /**
   * Gets products by category
   * @param category - The category name
   * @returns Promise resolving to array of products in the category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await this.productRepository.findAll();
    return allProducts.filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Gets low stock products
   * @param threshold - The stock threshold (default: 10)
   * @returns Promise resolving to array of products with low stock
   */
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    const allProducts = await this.productRepository.findAll();
    return allProducts.filter((product) => product.stock.value <= threshold);
  }
}
