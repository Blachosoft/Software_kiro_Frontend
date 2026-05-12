/**
 * MockCustomerRepository - Repositorio en memoria con datos de ejemplo
 */

import type { CustomerRepository } from '../../domain/ports/CustomerRepository';
import type { Customer } from '../../domain/entities/Customer';
import { Email } from '../../domain/value-objects/Email';
import { PhoneNumber } from '../../domain/value-objects/PhoneNumber';
import { Money } from '../../domain/value-objects/Money';

export class MockCustomerRepository implements CustomerRepository {
  private customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'John Smith',
      email: Email.create('john.smith@email.com'),
      phone: PhoneNumber.create('+1-555-0101'),
      totalPurchases: Money.create(2450.50),
      createdAt: new Date('2024-01-15'),
    },
    {
      id: 'cust-2',
      name: 'Maria Garcia',
      email: Email.create('maria.garcia@email.com'),
      phone: PhoneNumber.create('+1-555-0102'),
      totalPurchases: Money.create(1890.75),
      createdAt: new Date('2024-02-20'),
    },
    {
      id: 'cust-3',
      name: 'Robert Johnson',
      email: Email.create('robert.j@email.com'),
      phone: PhoneNumber.create('+1-555-0103'),
      totalPurchases: Money.create(3200.00),
      createdAt: new Date('2024-01-10'),
    },
    {
      id: 'cust-4',
      name: 'Emily Davis',
      email: Email.create('emily.davis@email.com'),
      phone: PhoneNumber.create('+1-555-0104'),
      totalPurchases: Money.create(1250.25),
      createdAt: new Date('2024-03-05'),
    },
    {
      id: 'cust-5',
      name: 'Michael Brown',
      email: Email.create('m.brown@email.com'),
      phone: PhoneNumber.create('+1-555-0105'),
      totalPurchases: Money.create(4100.80),
      createdAt: new Date('2023-12-01'),
    },
  ];

  private idCounter = 6;

  async save(customer: Customer): Promise<Customer> {
    await this.delay(300);
    const existingIndex = this.customers.findIndex(c => c.id === customer.id);
    
    if (existingIndex >= 0) {
      this.customers[existingIndex] = customer;
      return customer;
    } else {
      const newCustomer = { ...customer, id: `cust-${this.idCounter++}` };
      this.customers.push(newCustomer);
      return newCustomer;
    }
  }

  async findById(id: string): Promise<Customer | null> {
    await this.delay(150);
    return this.customers.find(c => c.id === id) || null;
  }

  async search(query: string): Promise<Customer[]> {
    await this.delay(200);
    const lowerQuery = query.toLowerCase();
    return this.customers.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email?.value.toLowerCase().includes(lowerQuery) ||
      c.phone?.value.includes(query)
    );
  }

  async update(customer: Customer): Promise<Customer> {
    await this.delay(300);
    const index = this.customers.findIndex(c => c.id === customer.id);
    
    if (index >= 0) {
      this.customers[index] = customer;
      return customer;
    }
    
    throw new Error('Customer not found');
  }

  async findAll(limit?: number, offset?: number): Promise<Customer[]> {
    await this.delay(200);
    let result = [...this.customers];
    
    if (offset) {
      result = result.slice(offset);
    }
    
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(300);
    const index = this.customers.findIndex(c => c.id === id);
    
    if (index >= 0) {
      this.customers.splice(index, 1);
      return true;
    }
    
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
