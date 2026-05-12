# UI Context Layer - State Management

This directory contains React Context-based state management for the POS frontend application.

## Overview

The context layer provides centralized state management using React Context API with useReducer hooks. This approach offers:

- **Type-safe state transitions** through discriminated union types
- **Domain invariant enforcement** in reducers
- **Predictable state updates** with pure reducer functions
- **Easy testing** with isolated reducer logic
- **Session persistence** for authentication
- **Offline support** with sync queue management

## Contexts

### SaleContext

Manages the current sale state, including items, loading states, errors, and offline sync queue.

**Features:**
- Add/remove/update items in current sale
- Complete or cancel sales
- Maintain domain invariants (e.g., can only modify draft sales)
- Queue operations for offline sync
- Error handling and loading states

**Usage:**
```typescript
import { SaleProvider, useSale } from './context';

function App() {
  return (
    <SaleProvider>
      <YourComponents />
    </SaleProvider>
  );
}

function SaleComponent() {
  const { state, dispatch } = useSale();
  
  // Add item to sale
  dispatch({
    type: 'ADD_ITEM',
    payload: { item: saleItem }
  });
}
```

**State Shape:**
```typescript
interface SaleState {
  currentSale: Sale | null;
  isLoading: boolean;
  error: string | null;
  syncQueue: QueuedSaleOperation[];
}
```

**Domain Invariants:**
- Can only add/remove/update items in draft sales
- Cannot modify completed or cancelled sales
- Cannot complete sale with no items
- Cannot cancel completed sales
- Item indices must be valid

### AuthContext

Manages authentication state, user session, and permissions with automatic session persistence.

**Features:**
- Login/logout functionality
- Session persistence to localStorage
- Automatic session timeout (30 minutes)
- Session refresh on user activity
- Permission checking
- Role-based access control

**Usage:**
```typescript
import { AuthProvider, useAuth } from './context';

function App() {
  return (
    <AuthProvider enableSessionPersistence={true}>
      <YourComponents />
    </AuthProvider>
  );
}

function AuthComponent() {
  const { state, login, logout, hasPermission } = useAuth();
  
  // Check permission
  if (hasPermission('sales:create')) {
    // Allow action
  }
  
  // Login
  login(user, permissions);
}
```

**State Shape:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}
```

**Session Management:**
- Sessions stored in localStorage
- 30-minute timeout with automatic expiry
- Refresh on user activity (mouse, keyboard, touch)
- Automatic restoration on page reload
- Secure session clearing on logout

### OfflineContext

Manages network status and pending sync operations for offline support.

**Features:**
- Network status detection
- Pending sync queue management
- Automatic sync when coming online
- Retry logic with error tracking
- Manual sync triggering

**Usage:**
```typescript
import { OfflineProvider, useOffline } from './context';

function App() {
  return (
    <OfflineProvider 
      autoSync={true}
      onSync={async (pendingSyncs) => {
        // Sync logic here
        return syncedIds;
      }}
    >
      <YourComponents />
    </OfflineProvider>
  );
}

function OfflineComponent() {
  const { state, addPendingSync, triggerSync } = useOffline();
  
  // Add operation to sync queue
  if (!state.isOnline) {
    addPendingSync('sale:create', { saleData });
  }
  
  // Manual sync
  await triggerSync();
}
```

**State Shape:**
```typescript
interface OfflineState {
  isOnline: boolean;
  pendingSyncs: PendingSync[];
  isSyncing: boolean;
  lastSyncAttempt: Date | null;
  syncError: string | null;
}
```

**Sync Queue:**
- Operations queued when offline
- Automatic sync when connection restored
- Retry count tracking
- Error tracking per operation
- Manual sync triggering

## Architecture

### Reducer Pattern

All contexts use the reducer pattern for state management:

```typescript
type Action = 
  | { type: 'ACTION_ONE'; payload: Data }
  | { type: 'ACTION_TWO'; payload: Data };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ACTION_ONE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
```

**Benefits:**
- Type-safe actions with discriminated unions
- Predictable state transitions
- Easy to test (pure functions)
- Clear action history for debugging
- Enforces domain invariants

### Context Provider Pattern

Each context follows the same structure:

1. **State Interface** - Defines the shape of state
2. **Action Union Type** - All possible state transitions
3. **Reducer Function** - Pure function handling state transitions
4. **Context Creation** - React context with state and dispatch
5. **Provider Component** - Wraps children with context
6. **Custom Hook** - Easy access to context with error checking

### Testing Strategy

Each context has comprehensive unit tests covering:

- All reducer actions
- Domain invariant enforcement
- Error handling
- Edge cases
- State transitions
- Helper functions (session storage, sync queue)

**Test Coverage:**
- SaleContext: 31 tests
- AuthContext: 20 tests
- OfflineContext: 18 tests
- **Total: 69 tests, all passing**

## Integration

### Combining Contexts

Contexts can be nested to provide multiple state management layers:

```typescript
function App() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <SaleProvider>
          <YourApp />
        </SaleProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}
```

### Cross-Context Communication

Contexts can communicate through:

1. **Shared state** - Pass data through props
2. **Event handlers** - Callbacks from parent components
3. **Custom hooks** - Combine multiple contexts

Example:
```typescript
function useSaleWithOffline() {
  const { state: saleState, dispatch: saleDispatch } = useSale();
  const { state: offlineState, addPendingSync } = useOffline();
  
  const addItemWithOfflineSupport = (item: SaleItem) => {
    saleDispatch({ type: 'ADD_ITEM', payload: { item } });
    
    if (!offlineState.isOnline) {
      addPendingSync('sale:addItem', { item });
    }
  };
  
  return { addItemWithOfflineSupport };
}
```

## Best Practices

1. **Always use custom hooks** - Don't access context directly
2. **Keep reducers pure** - No side effects in reducers
3. **Validate in reducers** - Enforce domain invariants
4. **Use discriminated unions** - Type-safe actions
5. **Test reducers independently** - Unit test reducer logic
6. **Handle errors gracefully** - Set error state, don't throw
7. **Provide initial state** - Allow testing with custom state
8. **Document invariants** - Comment domain rules in code

## Performance Considerations

- Reducers are pure functions (fast)
- Context updates only re-render consumers
- Use React.memo for expensive components
- Split contexts by concern (don't create one giant context)
- Consider using selectors for derived state

## Future Enhancements

Potential improvements:

1. **Middleware** - Add logging, analytics, or persistence middleware
2. **DevTools** - Integrate with Redux DevTools for debugging
3. **Optimistic Updates** - Update UI before server confirmation
4. **Undo/Redo** - Track action history for undo functionality
5. **State Persistence** - Save/restore state to localStorage
6. **WebSocket Integration** - Real-time updates from server

## Related Files

- `SaleContext.tsx` - Sale state management
- `AuthContext.tsx` - Authentication and session management
- `OfflineContext.tsx` - Network status and sync queue
- `__tests__/` - Unit tests for all contexts
- `index.ts` - Central export point

## Requirements Mapping

This implementation addresses the following functional requirements:

- **FR-1: User Authentication** - AuthContext with session management
- **FR-2: Offline Mode** - OfflineContext with sync queue
- **FR-4: Data Validation** - Domain invariants in reducers

And supports these user stories:

- **US-2: Cart Management** - SaleContext for cart operations
- **US-3: Payment Processing** - SaleContext for payment tracking
- **US-5: Transaction History** - State management for transactions
