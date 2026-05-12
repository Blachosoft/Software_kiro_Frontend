/**
 * SaleContext Unit Tests
 * 
 * Tests for sale reducer logic and domain invariants
 */

import { describe, it, expect } from 'vitest';
import { saleReducer, SaleState, SaleAction } from '../SaleContext';
import type { Sale, SaleItem } from '../../../../domain/entities/Sale';
import { Quantity } from '../../../../domain/value-objects/Quantity';
import { Money } from '../../../../domain/value-objects/Money';

describe('SaleContext - saleReducer', () => {
  const mockSaleItem: SaleItem = {
    productId: 'prod-1',
    productName: 'Test Product',
    quantity: Quantity.create(2),
    unitPrice: Money.create(10, 'USD'),
    subtotal: Money.create(20, 'USD'),
  };

  const mockDraftSale: Sale = {
    id: 'sale-1',
    items: [mockSaleItem],
    status: 'draft',
    createdAt: new Date('2024-01-01'),
  };

  const initialState: SaleState = {
    currentSale: null,
    isLoading: false,
    error: null,
    syncQueue: [],
  };

  describe('SET_CURRENT_SALE', () => {
    it('should set the current sale', () => {
      const action: SaleAction = {
        type: 'SET_CURRENT_SALE',
        payload: mockDraftSale,
      };

      const newState = saleReducer(initialState, action);

      expect(newState.currentSale).toEqual(mockDraftSale);
      expect(newState.error).toBeNull();
    });

    it('should clear the current sale when payload is null', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'SET_CURRENT_SALE',
        payload: null,
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale).toBeNull();
    });
  });

  describe('SET_LOADING', () => {
    it('should set loading to true', () => {
      const action: SaleAction = {
        type: 'SET_LOADING',
        payload: true,
      };

      const newState = saleReducer(initialState, action);

      expect(newState.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const stateWithLoading: SaleState = {
        ...initialState,
        isLoading: true,
      };

      const action: SaleAction = {
        type: 'SET_LOADING',
        payload: false,
      };

      const newState = saleReducer(stateWithLoading, action);

      expect(newState.isLoading).toBe(false);
    });
  });

  describe('SET_ERROR', () => {
    it('should set error message and stop loading', () => {
      const stateWithLoading: SaleState = {
        ...initialState,
        isLoading: true,
      };

      const action: SaleAction = {
        type: 'SET_ERROR',
        payload: 'Test error message',
      };

      const newState = saleReducer(stateWithLoading, action);

      expect(newState.error).toBe('Test error message');
      expect(newState.isLoading).toBe(false);
    });

    it('should clear error when payload is null', () => {
      const stateWithError: SaleState = {
        ...initialState,
        error: 'Previous error',
      };

      const action: SaleAction = {
        type: 'SET_ERROR',
        payload: null,
      };

      const newState = saleReducer(stateWithError, action);

      expect(newState.error).toBeNull();
    });
  });

  describe('ADD_ITEM', () => {
    it('should add item to draft sale', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: { ...mockDraftSale, items: [] },
      };

      const action: SaleAction = {
        type: 'ADD_ITEM',
        payload: { item: mockSaleItem },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale?.items).toHaveLength(1);
      expect(newState.currentSale?.items[0]).toEqual(mockSaleItem);
      expect(newState.error).toBeNull();
    });

    it('should return error when no active sale', () => {
      const action: SaleAction = {
        type: 'ADD_ITEM',
        payload: { item: mockSaleItem },
      };

      const newState = saleReducer(initialState, action);

      expect(newState.error).toBe('No active sale to add item to');
      expect(newState.currentSale).toBeNull();
    });

    it('should return error when sale is completed', () => {
      const completedSale: Sale = {
        ...mockDraftSale,
        status: 'completed',
        paymentMethod: 'cash',
        completedAt: new Date(),
      };

      const stateWithCompletedSale: SaleState = {
        ...initialState,
        currentSale: completedSale,
      };

      const action: SaleAction = {
        type: 'ADD_ITEM',
        payload: { item: mockSaleItem },
      };

      const newState = saleReducer(stateWithCompletedSale, action);

      expect(newState.error).toBe('Cannot add items to a completed or cancelled sale');
      expect(newState.currentSale?.items).toHaveLength(1); // Original items unchanged
    });

    it('should return error when sale is cancelled', () => {
      const cancelledSale: Sale = {
        ...mockDraftSale,
        status: 'cancelled',
      };

      const stateWithCancelledSale: SaleState = {
        ...initialState,
        currentSale: cancelledSale,
      };

      const action: SaleAction = {
        type: 'ADD_ITEM',
        payload: { item: mockSaleItem },
      };

      const newState = saleReducer(stateWithCancelledSale, action);

      expect(newState.error).toBe('Cannot add items to a completed or cancelled sale');
    });
  });

  describe('REMOVE_ITEM', () => {
    it('should remove item from draft sale', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'REMOVE_ITEM',
        payload: { itemIndex: 0 },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale?.items).toHaveLength(0);
      expect(newState.error).toBeNull();
    });

    it('should return error when no active sale', () => {
      const action: SaleAction = {
        type: 'REMOVE_ITEM',
        payload: { itemIndex: 0 },
      };

      const newState = saleReducer(initialState, action);

      expect(newState.error).toBe('No active sale to remove item from');
    });

    it('should return error when sale is not draft', () => {
      const completedSale: Sale = {
        ...mockDraftSale,
        status: 'completed',
        paymentMethod: 'cash',
        completedAt: new Date(),
      };

      const stateWithCompletedSale: SaleState = {
        ...initialState,
        currentSale: completedSale,
      };

      const action: SaleAction = {
        type: 'REMOVE_ITEM',
        payload: { itemIndex: 0 },
      };

      const newState = saleReducer(stateWithCompletedSale, action);

      expect(newState.error).toBe('Cannot remove items from a completed or cancelled sale');
    });

    it('should return error when item index is invalid (negative)', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'REMOVE_ITEM',
        payload: { itemIndex: -1 },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.error).toBe('Invalid item index');
    });

    it('should return error when item index is out of bounds', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'REMOVE_ITEM',
        payload: { itemIndex: 10 },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.error).toBe('Invalid item index');
    });
  });

  describe('UPDATE_ITEM_QUANTITY', () => {
    it('should update item quantity and recalculate subtotal', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const newQuantity = Quantity.create(5);
      const action: SaleAction = {
        type: 'UPDATE_ITEM_QUANTITY',
        payload: { itemIndex: 0, quantity: newQuantity },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale?.items[0].quantity).toEqual(newQuantity);
      expect(newState.currentSale?.items[0].subtotal.amount).toBe(50); // 5 * 10
      expect(newState.error).toBeNull();
    });

    it('should return error when no active sale', () => {
      const action: SaleAction = {
        type: 'UPDATE_ITEM_QUANTITY',
        payload: { itemIndex: 0, quantity: Quantity.create(5) },
      };

      const newState = saleReducer(initialState, action);

      expect(newState.error).toBe('No active sale to update');
    });

    it('should return error when sale is not draft', () => {
      const completedSale: Sale = {
        ...mockDraftSale,
        status: 'completed',
        paymentMethod: 'cash',
        completedAt: new Date(),
      };

      const stateWithCompletedSale: SaleState = {
        ...initialState,
        currentSale: completedSale,
      };

      const action: SaleAction = {
        type: 'UPDATE_ITEM_QUANTITY',
        payload: { itemIndex: 0, quantity: Quantity.create(5) },
      };

      const newState = saleReducer(stateWithCompletedSale, action);

      expect(newState.error).toBe('Cannot update items in a completed or cancelled sale');
    });

    it('should return error when item index is invalid', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'UPDATE_ITEM_QUANTITY',
        payload: { itemIndex: 99, quantity: Quantity.create(5) },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.error).toBe('Invalid item index');
    });
  });

  describe('COMPLETE_SALE', () => {
    it('should complete a draft sale', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'COMPLETE_SALE',
        payload: { paymentMethod: 'cash' },
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale?.status).toBe('completed');
      expect(newState.currentSale?.paymentMethod).toBe('cash');
      expect(newState.currentSale?.completedAt).toBeInstanceOf(Date);
      expect(newState.error).toBeNull();
    });

    it('should return error when no active sale', () => {
      const action: SaleAction = {
        type: 'COMPLETE_SALE',
        payload: { paymentMethod: 'cash' },
      };

      const newState = saleReducer(initialState, action);

      expect(newState.error).toBe('No active sale to complete');
    });

    it('should return error when sale is already completed', () => {
      const completedSale: Sale = {
        ...mockDraftSale,
        status: 'completed',
        paymentMethod: 'cash',
        completedAt: new Date(),
      };

      const stateWithCompletedSale: SaleState = {
        ...initialState,
        currentSale: completedSale,
      };

      const action: SaleAction = {
        type: 'COMPLETE_SALE',
        payload: { paymentMethod: 'card' },
      };

      const newState = saleReducer(stateWithCompletedSale, action);

      expect(newState.error).toBe('Sale is already completed or cancelled');
    });

    it('should return error when sale has no items', () => {
      const emptySale: Sale = {
        ...mockDraftSale,
        items: [],
      };

      const stateWithEmptySale: SaleState = {
        ...initialState,
        currentSale: emptySale,
      };

      const action: SaleAction = {
        type: 'COMPLETE_SALE',
        payload: { paymentMethod: 'cash' },
      };

      const newState = saleReducer(stateWithEmptySale, action);

      expect(newState.error).toBe('Cannot complete sale with no items');
    });
  });

  describe('CANCEL_SALE', () => {
    it('should cancel a draft sale', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
      };

      const action: SaleAction = {
        type: 'CANCEL_SALE',
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale?.status).toBe('cancelled');
      expect(newState.error).toBeNull();
    });

    it('should return error when no active sale', () => {
      const action: SaleAction = {
        type: 'CANCEL_SALE',
      };

      const newState = saleReducer(initialState, action);

      expect(newState.error).toBe('No active sale to cancel');
    });

    it('should return error when sale is completed', () => {
      const completedSale: Sale = {
        ...mockDraftSale,
        status: 'completed',
        paymentMethod: 'cash',
        completedAt: new Date(),
      };

      const stateWithCompletedSale: SaleState = {
        ...initialState,
        currentSale: completedSale,
      };

      const action: SaleAction = {
        type: 'CANCEL_SALE',
      };

      const newState = saleReducer(stateWithCompletedSale, action);

      expect(newState.error).toBe('Cannot cancel a completed sale');
    });
  });

  describe('CLEAR_SALE', () => {
    it('should clear the current sale', () => {
      const stateWithSale: SaleState = {
        ...initialState,
        currentSale: mockDraftSale,
        error: 'Some error',
      };

      const action: SaleAction = {
        type: 'CLEAR_SALE',
      };

      const newState = saleReducer(stateWithSale, action);

      expect(newState.currentSale).toBeNull();
      expect(newState.error).toBeNull();
    });
  });

  describe('QUEUE_OPERATION', () => {
    it('should add operation to sync queue', () => {
      const operation = {
        id: 'op-1',
        type: 'addItem' as const,
        saleId: 'sale-1',
        payload: { item: mockSaleItem },
        timestamp: new Date(),
      };

      const action: SaleAction = {
        type: 'QUEUE_OPERATION',
        payload: operation,
      };

      const newState = saleReducer(initialState, action);

      expect(newState.syncQueue).toHaveLength(1);
      expect(newState.syncQueue[0]).toEqual(operation);
    });

    it('should append to existing queue', () => {
      const existingOperation = {
        id: 'op-1',
        type: 'create' as const,
        saleId: 'sale-1',
        payload: {},
        timestamp: new Date(),
      };

      const stateWithQueue: SaleState = {
        ...initialState,
        syncQueue: [existingOperation],
      };

      const newOperation = {
        id: 'op-2',
        type: 'addItem' as const,
        saleId: 'sale-1',
        payload: { item: mockSaleItem },
        timestamp: new Date(),
      };

      const action: SaleAction = {
        type: 'QUEUE_OPERATION',
        payload: newOperation,
      };

      const newState = saleReducer(stateWithQueue, action);

      expect(newState.syncQueue).toHaveLength(2);
      expect(newState.syncQueue[1]).toEqual(newOperation);
    });
  });

  describe('REMOVE_FROM_QUEUE', () => {
    it('should remove operation from queue by id', () => {
      const operation1 = {
        id: 'op-1',
        type: 'create' as const,
        saleId: 'sale-1',
        payload: {},
        timestamp: new Date(),
      };

      const operation2 = {
        id: 'op-2',
        type: 'addItem' as const,
        saleId: 'sale-1',
        payload: { item: mockSaleItem },
        timestamp: new Date(),
      };

      const stateWithQueue: SaleState = {
        ...initialState,
        syncQueue: [operation1, operation2],
      };

      const action: SaleAction = {
        type: 'REMOVE_FROM_QUEUE',
        payload: { operationId: 'op-1' },
      };

      const newState = saleReducer(stateWithQueue, action);

      expect(newState.syncQueue).toHaveLength(1);
      expect(newState.syncQueue[0].id).toBe('op-2');
    });
  });

  describe('CLEAR_QUEUE', () => {
    it('should clear all operations from queue', () => {
      const stateWithQueue: SaleState = {
        ...initialState,
        syncQueue: [
          {
            id: 'op-1',
            type: 'create',
            saleId: 'sale-1',
            payload: {},
            timestamp: new Date(),
          },
          {
            id: 'op-2',
            type: 'addItem',
            saleId: 'sale-1',
            payload: { item: mockSaleItem },
            timestamp: new Date(),
          },
        ],
      };

      const action: SaleAction = {
        type: 'CLEAR_QUEUE',
      };

      const newState = saleReducer(stateWithQueue, action);

      expect(newState.syncQueue).toHaveLength(0);
    });
  });
});
