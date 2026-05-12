/**
 * MockSaleRepository - Repositorio en memoria para desarrollo sin backend
 */

import type { SaleRepository } from '../../domain/ports/SaleRepository';
import type { Sale } from '../../domain/entities/Sale';

export class MockSaleRepository implements SaleRepository {
  private sales: Sale[] = [];
  private idCounter = 1;

  async save(sale: Sale): Promise<Sale> {
    // Simular delay de red
    await this.delay(300);
    
    const existingIndex = this.sales.findIndex(s => s.id === sale.id);
    
    if (existingIndex >= 0) {
      this.sales[existingIndex] = sale;
      return sale;
    } else {
      const newSale = { ...sale, id: sale.id || `sale-${this.idCounter++}` };
      this.sales.push(newSale);
      return newSale;
    }
  }

  async findById(id: string): Promise<Sale | null> {
    await this.delay(200);
    return this.sales.find(s => s.id === id) || null;
  }

  async findByDateRange(start: Date, end: Date): Promise<Sale[]> {
    await this.delay(300);
    return this.sales.filter(s => 
      s.createdAt >= start && s.createdAt <= end
    );
  }

  async findByCustomerId(customerId: string): Promise<Sale[]> {
    await this.delay(300);
    return this.sales.filter(s => s.customerId === customerId);
  }

  async findAll(limit?: number, offset?: number): Promise<Sale[]> {
    await this.delay(300);
    let result = [...this.sales];
    
    if (offset) {
      result = result.slice(offset);
    }
    
    if (limit) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
