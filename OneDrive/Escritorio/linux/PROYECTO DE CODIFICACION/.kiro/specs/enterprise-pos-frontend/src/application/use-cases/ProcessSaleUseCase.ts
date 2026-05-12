/**
 * ProcessSaleUseCase
 * 
 * Use case for processing sales transactions.
 * Orchestrates domain logic for adding items, calculating totals, and completing sales.
 * 
 * This is part of the Application Layer in hexagonal architecture.
 * Depends ONLY on domain interfaces (ports), not on concrete implementations.
 */

import type { Sale, SaleItem, PaymentMethod } from '../../domain/entities/Sale';
import type { SaleRepository } from '../../domain/ports/SaleRepository';
import type { ProductRepository } from '../../domain/ports/ProductRepository';
import { Money } from '../../domain/value-objects/Money';
import { Quantity } from '../../domain/value-objects/Quantity';
import { calculateSaleTotal, calculateItemSubtotal } from '../../domain/logic/saleCalculations';
import { validateSaleCompletion, validateStockAvailability } from '../../domain/logic/validation';
import { ValidationError, NotFoundError, BusinessRuleError } from '../../domain/errors/DomainError';

/**
 * ProcessSaleUseCase
 * Handles all operations related to processing sales
 */
export class ProcessSaleUseCase {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly productRepository: ProductRepository
  ) {}

  /**
   * Adds an item to a sale
   * @param saleId - The sale ID
   * @param productId - The product ID to add
   * @param quantity - The quantity to add
   * @returns Promise resolving to the updated sale
   * @throws NotFoundError if sale or product not found
   * @throws BusinessRuleError if sale is not in draft status
   * @throws ValidationError if insufficient stock
   */
  async addItem(saleId: string, productId: string, quantity: Quantity): Promise<Sale> {
    // Find the sale
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      throw new NotFoundError('Sale not found', 'Sale', saleId);
    }

    // Check sale status
    if (sale.status !== 'draft') {
      throw new BusinessRuleError(
        'Cannot modify completed or cancelled sale',
        'sale-must-be-draft'
      );
    }

    // Find the product
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found', 'Product', productId);
    }

    // Validate stock availability
    const stockValidation = validateStockAvailability(product, quantity.value);
    if (!stockValidation.isValid) {
      throw new ValidationError(stockValidation.errors.join(', '), 'quantity', 'stock');
    }

    // Calculate subtotal
    const subtotal = calculateItemSubtotal(product.price, quantity);

    // Create new sale item
    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice: product.price,
      subtotal,
    };

    // Update sale with new item
    const updatedSale: Sale = {
      ...sale,
      items: [...sale.items, newItem],
    };

    // Save and return
    return this.saleRepository.save(updatedSale);
  }

  /**
   * Removes an item from a sale
   * @param saleId - The sale ID
   * @param itemIndex - The index of the item to remove
   * @returns Promise resolving to the updated sale
   * @throws NotFoundError if sale not found
   * @throws BusinessRuleError if sale is not in draft status
   * @throws ValidationError if item index is invalid
   */
  async removeItem(saleId: string, itemIndex: number): Promise<Sale> {
    // Find the sale
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      throw new NotFoundError('Sale not found', 'Sale', saleId);
    }

    // Check sale status
    if (sale.status !== 'draft') {
      throw new BusinessRuleError(
        'Cannot modify completed or cancelled sale',
        'sale-must-be-draft'
      );
    }

    // Validate item index
    if (itemIndex < 0 || itemIndex >= sale.items.length) {
      throw new ValidationError('Invalid item index', 'itemIndex', 'range');
    }

    // Remove item
    const updatedItems = sale.items.filter((_, index) => index !== itemIndex);

    // Update sale
    const updatedSale: Sale = {
      ...sale,
      items: updatedItems,
    };

    // Save and return
    return this.saleRepository.save(updatedSale);
  }

  /**
   * Updates the quantity of an item in a sale
   * @param saleId - The sale ID
   * @param itemIndex - The index of the item to update
   * @param newQuantity - The new quantity
   * @returns Promise resolving to the updated sale
   * @throws NotFoundError if sale or product not found
   * @throws BusinessRuleError if sale is not in draft status
   * @throws ValidationError if insufficient stock or invalid index
   */
  async updateItemQuantity(
    saleId: string,
    itemIndex: number,
    newQuantity: Quantity
  ): Promise<Sale> {
    // Find the sale
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      throw new NotFoundError('Sale not found', 'Sale', saleId);
    }

    // Check sale status
    if (sale.status !== 'draft') {
      throw new BusinessRuleError(
        'Cannot modify completed or cancelled sale',
        'sale-must-be-draft'
      );
    }

    // Validate item index
    if (itemIndex < 0 || itemIndex >= sale.items.length) {
      throw new ValidationError('Invalid item index', 'itemIndex', 'range');
    }

    // Get the item
    const item = sale.items[itemIndex];

    // Find the product to check stock
    const product = await this.productRepository.findById(item.productId);
    if (!product) {
      throw new NotFoundError('Product not found', 'Product', item.productId);
    }

    // Validate stock availability
    const stockValidation = validateStockAvailability(product, newQuantity.value);
    if (!stockValidation.isValid) {
      throw new ValidationError(stockValidation.errors.join(', '), 'quantity', 'stock');
    }

    // Calculate new subtotal
    const newSubtotal = calculateItemSubtotal(item.unitPrice, newQuantity);

    // Update item
    const updatedItem: SaleItem = {
      ...item,
      quantity: newQuantity,
      subtotal: newSubtotal,
    };

    // Update sale
    const updatedItems = [...sale.items];
    updatedItems[itemIndex] = updatedItem;

    const updatedSale: Sale = {
      ...sale,
      items: updatedItems,
    };

    // Save and return
    return this.saleRepository.save(updatedSale);
  }

  /**
   * Completes a sale
   * @param saleId - The sale ID
   * @param paymentMethod - The payment method
   * @returns Promise resolving to the completed sale
   * @throws NotFoundError if sale not found
   * @throws ValidationError if sale cannot be completed
   */
  async completeSale(saleId: string, paymentMethod: PaymentMethod): Promise<Sale> {
    // Find the sale
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      throw new NotFoundError('Sale not found', 'Sale', saleId);
    }

    // Validate sale can be completed
    const validation = validateSaleCompletion(sale, paymentMethod);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '), 'sale', 'completion');
    }

    // Complete the sale
    const completedSale: Sale = {
      ...sale,
      status: 'completed',
      paymentMethod,
      completedAt: new Date(),
    };

    // Save and return
    return this.saleRepository.save(completedSale);
  }

  /**
   * Calculates the total for a sale
   * @param sale - The sale to calculate total for
   * @returns The total as Money
   */
  calculateTotal(sale: Sale): Money {
    return calculateSaleTotal(sale);
  }

  /**
   * Creates a new draft sale
   * @param customerId - Optional customer ID
   * @returns Promise resolving to the new sale
   */
  async createSale(customerId?: string): Promise<Sale> {
    const newSale: Sale = {
      id: this.generateSaleId(),
      items: [],
      customerId,
      status: 'draft',
      createdAt: new Date(),
    };

    return this.saleRepository.save(newSale);
  }

  /**
   * Cancels a sale
   * @param saleId - The sale ID
   * @returns Promise resolving to the cancelled sale
   * @throws NotFoundError if sale not found
   * @throws BusinessRuleError if sale is already completed
   */
  async cancelSale(saleId: string): Promise<Sale> {
    // Find the sale
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      throw new NotFoundError('Sale not found', 'Sale', saleId);
    }

    // Check if sale can be cancelled
    if (sale.status === 'completed') {
      throw new BusinessRuleError(
        'Cannot cancel completed sale',
        'sale-cannot-cancel-completed'
      );
    }

    // Cancel the sale
    const cancelledSale: Sale = {
      ...sale,
      status: 'cancelled',
    };

    // Save and return
    return this.saleRepository.save(cancelledSale);
  }

  /**
   * Generates a unique sale ID
   * In a real implementation, this would use a proper ID generation strategy
   */
  private generateSaleId(): string {
    return `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
