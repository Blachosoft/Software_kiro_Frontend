'use client';

/**
 * SaleContext - React Context for Sale State Management
 * 
 * Provides sale state management using React Context and useReducer.
 * Manages current sale, loading states, errors, and offline sync queue.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Sale, SaleItem, PaymentMethod } from '../../../domain/entities/Sale';
import type { Quantity } from '../../../domain/value-objects/Quantity';

/**
 * SaleState Interface
 * Represents the complete state of the sale management system
 */
export interface SaleState {
  currentSale: Sale | null;
  isLoading: boolean;
  error: string | null;
  syncQueue: QueuedSaleOperation[];
}

/**
 * Queued Sale Operation
 * Represents an operation that needs to be synced when online
 */
export interface QueuedSaleOperation {
  id: string;
  type: 'create' | 'addItem' | 'removeItem' | 'updateQuantity' | 'complete' | 'cancel';
  saleId: string;
  payload: any;
  timestamp: Date;
}

/**
 * SaleAction Union Type
 * All possible state transitions for sale management
 */
export type SaleAction =
  | { type: 'SET_CURRENT_SALE'; payload: Sale | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ITEM'; payload: { item: SaleItem } }
  | { type: 'REMOVE_ITEM'; payload: { itemIndex: number } }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { itemIndex: number; quantity: Quantity } }
  | { type: 'COMPLETE_SALE'; payload: { paymentMethod: PaymentMethod } }
  | { type: 'CANCEL_SALE' }
  | { type: 'CLEAR_SALE' }
  | { type: 'QUEUE_OPERATION'; payload: QueuedSaleOperation }
  | { type: 'REMOVE_FROM_QUEUE'; payload: { operationId: string } }
  | { type: 'CLEAR_QUEUE' };

/**
 * Initial State
 */
const initialState: SaleState = {
  currentSale: null,
  isLoading: false,
  error: null,
  syncQueue: [],
};

/**
 * Sale Reducer
 * Handles all state transitions while maintaining domain invariants
 */
export function saleReducer(state: SaleState, action: SaleAction): SaleState {
  switch (action.type) {
    case 'SET_CURRENT_SALE':
      return {
        ...state,
        currentSale: action.payload,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'ADD_ITEM': {
      if (!state.currentSale) {
        return {
          ...state,
          error: 'No active sale to add item to',
        };
      }

      // Domain invariant: Can only add items to draft sales
      if (state.currentSale.status !== 'draft') {
        return {
          ...state,
          error: 'Cannot add items to a completed or cancelled sale',
        };
      }

      return {
        ...state,
        currentSale: {
          ...state.currentSale,
          items: [...state.currentSale.items, action.payload.item],
        },
        error: null,
      };
    }

    case 'REMOVE_ITEM': {
      if (!state.currentSale) {
        return {
          ...state,
          error: 'No active sale to remove item from',
        };
      }

      // Domain invariant: Can only modify draft sales
      if (state.currentSale.status !== 'draft') {
        return {
          ...state,
          error: 'Cannot remove items from a completed or cancelled sale',
        };
      }

      // Domain invariant: Item index must be valid
      if (
        action.payload.itemIndex < 0 ||
        action.payload.itemIndex >= state.currentSale.items.length
      ) {
        return {
          ...state,
          error: 'Invalid item index',
        };
      }

      return {
        ...state,
        currentSale: {
          ...state.currentSale,
          items: state.currentSale.items.filter(
            (_, index) => index !== action.payload.itemIndex
          ),
        },
        error: null,
      };
    }

    case 'UPDATE_ITEM_QUANTITY': {
      if (!state.currentSale) {
        return {
          ...state,
          error: 'No active sale to update',
        };
      }

      // Domain invariant: Can only modify draft sales
      if (state.currentSale.status !== 'draft') {
        return {
          ...state,
          error: 'Cannot update items in a completed or cancelled sale',
        };
      }

      // Domain invariant: Item index must be valid
      if (
        action.payload.itemIndex < 0 ||
        action.payload.itemIndex >= state.currentSale.items.length
      ) {
        return {
          ...state,
          error: 'Invalid item index',
        };
      }

      const updatedItems = [...state.currentSale.items];
      const item = updatedItems[action.payload.itemIndex];

      // Recalculate subtotal with new quantity
      const newSubtotal = {
        amount: item.unitPrice.amount * action.payload.quantity.value,
        currency: item.unitPrice.currency,
      };

      updatedItems[action.payload.itemIndex] = {
        ...item,
        quantity: action.payload.quantity,
        subtotal: newSubtotal,
      };

      return {
        ...state,
        currentSale: {
          ...state.currentSale,
          items: updatedItems,
        },
        error: null,
      };
    }

    case 'COMPLETE_SALE': {
      if (!state.currentSale) {
        return {
          ...state,
          error: 'No active sale to complete',
        };
      }

      // Domain invariant: Can only complete draft sales
      if (state.currentSale.status !== 'draft') {
        return {
          ...state,
          error: 'Sale is already completed or cancelled',
        };
      }

      // Domain invariant: Sale must have at least one item
      if (state.currentSale.items.length === 0) {
        return {
          ...state,
          error: 'Cannot complete sale with no items',
        };
      }

      return {
        ...state,
        currentSale: {
          ...state.currentSale,
          status: 'completed',
          paymentMethod: action.payload.paymentMethod,
          completedAt: new Date(),
        },
        error: null,
      };
    }

    case 'CANCEL_SALE': {
      if (!state.currentSale) {
        return {
          ...state,
          error: 'No active sale to cancel',
        };
      }

      // Domain invariant: Cannot cancel completed sales
      if (state.currentSale.status === 'completed') {
        return {
          ...state,
          error: 'Cannot cancel a completed sale',
        };
      }

      return {
        ...state,
        currentSale: {
          ...state.currentSale,
          status: 'cancelled',
        },
        error: null,
      };
    }

    case 'CLEAR_SALE':
      return {
        ...state,
        currentSale: null,
        error: null,
      };

    case 'QUEUE_OPERATION':
      return {
        ...state,
        syncQueue: [...state.syncQueue, action.payload],
      };

    case 'REMOVE_FROM_QUEUE':
      return {
        ...state,
        syncQueue: state.syncQueue.filter((op) => op.id !== action.payload.operationId),
      };

    case 'CLEAR_QUEUE':
      return {
        ...state,
        syncQueue: [],
      };

    default:
      return state;
  }
}

/**
 * SaleContext
 */
export interface SaleContextValue {
  state: SaleState;
  dispatch: React.Dispatch<SaleAction>;
}

export const SaleContext = createContext<SaleContextValue | undefined>(undefined);

/**
 * SaleProvider Component
 * Provides sale state to the component tree
 */
export interface SaleProviderProps {
  children: ReactNode;
  initialState?: Partial<SaleState>;
}

export function SaleProvider({ children, initialState: customInitialState }: SaleProviderProps) {
  const [state, dispatch] = useReducer(
    saleReducer,
    customInitialState ? { ...initialState, ...customInitialState } : initialState
  );

  return <SaleContext.Provider value={{ state, dispatch }}>{children}</SaleContext.Provider>;
}

/**
 * useSale Hook
 * Custom hook to access sale context
 */
export function useSale(): SaleContextValue {
  const context = useContext(SaleContext);
  if (!context) {
    throw new Error('useSale must be used within a SaleProvider');
  }
  return context;
}
