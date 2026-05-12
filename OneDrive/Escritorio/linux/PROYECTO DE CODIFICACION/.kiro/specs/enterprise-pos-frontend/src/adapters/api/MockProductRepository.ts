/**
 * MockProductRepository - Repositorio en memoria con datos de ejemplo
 */

import type { ProductRepository } from '../../domain/ports/ProductRepository';
import type { Product } from '../../domain/entities/Product';
import { Money } from '../../domain/value-objects/Money';
import { Quantity } from '../../domain/value-objects/Quantity';

export class MockProductRepository implements ProductRepository {
  private products: Product[] = [
    {
      id: 'prod-1',
      code: 'LAP001',
      name: 'Laptop Dell XPS 15',
      price: Money.create(1299.99),
      stock: Quantity.create(15),
      category: 'Electronics',
      description: 'High-performance laptop with 16GB RAM and 512GB SSD',
    },
    {
      id: 'prod-2',
      code: 'MOU001',
      name: 'Logitech MX Master 3',
      price: Money.create(99.99),
      stock: Quantity.create(45),
      category: 'Electronics',
      description: 'Wireless mouse with ergonomic design',
    },
    {
      id: 'prod-3',
      code: 'KEY001',
      name: 'Mechanical Keyboard RGB',
      price: Money.create(149.99),
      stock: Quantity.create(30),
      category: 'Electronics',
      description: 'RGB mechanical keyboard with Cherry MX switches',
    },
    {
      id: 'prod-4',
      code: 'MON001',
      name: 'Samsung 27" 4K Monitor',
      price: Money.create(399.99),
      stock: Quantity.create(20),
      category: 'Electronics',
      description: '4K UHD monitor with HDR support',
    },
    {
      id: 'prod-5',
      code: 'HEA001',
      name: 'Sony WH-1000XM4 Headphones',
      price: Money.create(349.99),
      stock: Quantity.create(25),
      category: 'Electronics',
      description: 'Noise-cancelling wireless headphones',
    },
    {
      id: 'prod-6',
      code: 'TAB001',
      name: 'iPad Pro 12.9"',
      price: Money.create(1099.99),
      stock: Quantity.create(12),
      category: 'Electronics',
      description: 'Latest iPad Pro with M2 chip',
    },
    {
      id: 'prod-7',
      code: 'PHO001',
      name: 'iPhone 15 Pro',
      price: Money.create(999.99),
      stock: Quantity.create(8),
      category: 'Electronics',
      description: 'Latest iPhone with titanium design',
    },
    {
      id: 'prod-8',
      code: 'CAM001',
      name: 'Canon EOS R6',
      price: Money.create(2499.99),
      stock: Quantity.create(5),
      category: 'Electronics',
      description: 'Professional mirrorless camera',
    },
    {
      id: 'prod-9',
      code: 'PRI001',
      name: 'HP LaserJet Pro',
      price: Money.create(299.99),
      stock: Quantity.create(18),
      category: 'Electronics',
      description: 'Wireless laser printer',
    },
    {
      id: 'prod-10',
      code: 'SSD001',
      name: 'Samsung 1TB SSD',
      price: Money.create(129.99),
      stock: Quantity.create(50),
      category: 'Electronics',
      description: 'High-speed NVMe SSD',
    },
  ];

  private idCounter = 11;

  async findAll(limit?: number, offset?: number): Promise<Product[]> {
    await this.delay(200);
    let result = [...this.products];
    
    if (offset) {
      result = result.slice(offset);
    }
    
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  async findById(id: string): Promise<Product | null> {
    await this.delay(150);
    return this.products.find(p => p.id === id) || null;
  }

  async findByCode(code: string): Promise<Product | null> {
    await this.delay(150);
    return this.products.find(p => p.code === code) || null;
  }

  async search(query: string): Promise<Product[]> {
    await this.delay(200);
    const lowerQuery = query.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.code.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  async update(product: Product): Promise<Product> {
    await this.delay(300);
    const index = this.products.findIndex(p => p.id === product.id);
    
    if (index >= 0) {
      this.products[index] = product;
      return product;
    }
    
    throw new Error('Product not found');
  }

  async create(product: Product): Promise<Product> {
    await this.delay(300);
    const newProduct = { ...product, id: `prod-${this.idCounter++}` };
    this.products.push(newProduct);
    return newProduct;
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(300);
    const index = this.products.findIndex(p => p.id === id);
    
    if (index >= 0) {
      this.products.splice(index, 1);
      return true;
    }
    
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
