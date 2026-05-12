/**
 * ManageCustomerUseCase
 * 
 * Use case for managing customers.
 * Orchestrates domain logic for creating, searching, and updating customers.
 * 
 * This is part of the Application Layer in hexagonal architecture.
 * Depends ONLY on domain interfaces (ports), not on concrete implementations.
 */

import type { Customer } from '../../domain/entities/Customer';
import type { Sale } from '../../domain/entities/Sale';
import type { CustomerRepository } from '../../domain/ports/CustomerRepository';
import type { SaleRepository } from '../../domain/ports/SaleRepository';
import { validateCustomer } from '../../domain/logic/validation';
import { NotFoundError, ValidationError } from '../../domain/errors/DomainError';
import { Money } from '../../domain/value-objects/Money';

/**
 * ManageCustomerUseCase
 * Handles all operations related to customer management
 */
export class ManageCustomerUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly saleRepository: SaleRepository
  ) {}

  /**
   * Creates a new customer
   * @param customer - The customer to create
   * @returns Promise resolving to the created customer
   * @throws ValidationError if customer data is invalid
   */
  async createCustomer(customer: Customer): Promise<Customer> {
    // Validate customer data
    const validation = validateCustomer(customer);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join(', '),
        'customer',
        'validation'
      );
    }

    // Check if customer with same email already exists
    if (customer.email) {
      const existingCustomers = await this.customerRepository.search(customer.email.value);
      const emailExists = existingCustomers.some(
        (c) => c.email?.value === customer.email?.value
      );
      if (emailExists) {
        throw new ValidationError('Email already exists', 'email', 'unique');
      }
    }

    // Create customer
    return this.customerRepository.save(customer);
  }

  /**
   * Searches for customers by query string
   * Searches in name, email, and phone fields
   * @param query - The search query
   * @returns Promise resolving to array of matching customers
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    if (!query || query.trim().length === 0) {
      return this.customerRepository.findAll();
    }

    return this.customerRepository.search(query.trim());
  }

  /**
   * Gets a customer by ID
   * @param customerId - The customer ID
   * @returns Promise resolving to the customer
   * @throws NotFoundError if customer not found
   */
  async getCustomerById(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    
    if (!customer) {
      throw new NotFoundError('Customer not found', 'Customer', customerId);
    }

    return customer;
  }

  /**
   * Gets all customers with optional pagination
   * @param limit - Maximum number of results
   * @param offset - Number of results to skip
   * @returns Promise resolving to array of customers
   */
  async getAllCustomers(limit?: number, offset?: number): Promise<Customer[]> {
    return this.customerRepository.findAll(limit, offset);
  }

  /**
   * Updates a customer
   * @param customer - The customer to update
   * @returns Promise resolving to the updated customer
   * @throws ValidationError if customer data is invalid
   * @throws NotFoundError if customer not found
   */
  async updateCustomer(customer: Customer): Promise<Customer> {
    // Validate customer data
    const validation = validateCustomer(customer);
    if (!validation.isValid) {
      throw new ValidationError(
        validation.errors.join(', '),
        'customer',
        'validation'
      );
    }

    // Check if customer exists
    const existingCustomer = await this.customerRepository.findById(customer.id);
    if (!existingCustomer) {
      throw new NotFoundError('Customer not found', 'Customer', customer.id);
    }

    // Update customer
    return this.customerRepository.update(customer);
  }

  /**
   * Deletes a customer
   * @param customerId - The customer ID
   * @returns Promise resolving to true if deleted
   * @throws NotFoundError if customer not found
   */
  async deleteCustomer(customerId: string): Promise<boolean> {
    // Check if customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found', 'Customer', customerId);
    }

    // Delete customer
    return this.customerRepository.delete(customerId);
  }

  /**
   * Associates a customer with a sale
   * @param saleId - The sale ID
   * @param customerId - The customer ID
   * @returns Promise resolving to the updated sale
   * @throws NotFoundError if sale or customer not found
   */
  async associateCustomerWithSale(saleId: string, customerId: string): Promise<Sale> {
    // Check if sale exists
    const sale = await this.saleRepository.findById(saleId);
    if (!sale) {
      throw new NotFoundError('Sale not found', 'Sale', saleId);
    }

    // Check if customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found', 'Customer', customerId);
    }

    // Associate customer with sale
    const updatedSale: Sale = {
      ...sale,
      customerId,
    };

    // Save and return
    return this.saleRepository.save(updatedSale);
  }

  /**
   * Gets purchase history for a customer
   * @param customerId - The customer ID
   * @returns Promise resolving to array of sales
   * @throws NotFoundError if customer not found
   */
  async getCustomerPurchaseHistory(customerId: string): Promise<Sale[]> {
    // Check if customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found', 'Customer', customerId);
    }

    // Get customer's sales
    return this.saleRepository.findByCustomerId(customerId);
  }

  /**
   * Updates customer's total purchases
   * This should be called after a sale is completed
   * @param customerId - The customer ID
   * @param amount - The amount to add to total purchases
   * @returns Promise resolving to the updated customer
   * @throws NotFoundError if customer not found
   */
  async updateTotalPurchases(customerId: string, amount: Money): Promise<Customer> {
    // Get customer
    const customer = await this.getCustomerById(customerId);

    // Update total purchases
    const updatedCustomer: Customer = {
      ...customer,
      totalPurchases: Money.add(customer.totalPurchases, amount),
    };

    // Save and return
    return this.customerRepository.update(updatedCustomer);
  }

  /**
   * Gets top customers by total purchases
   * @param limit - Maximum number of customers to return
   * @returns Promise resolving to array of top customers
   */
  async getTopCustomers(limit: number = 10): Promise<Customer[]> {
    const allCustomers = await this.customerRepository.findAll();
    
    // Sort by total purchases (descending)
    const sorted = allCustomers.sort((a, b) => {
      return b.totalPurchases.amount - a.totalPurchases.amount;
    });

    // Return top N
    return sorted.slice(0, limit);
  }
}
