# NgRx SignalStore Guidelines for Claude Code

## Core Principles (NgRx SignalStore)
- Use SignalStore for local component state management
- Leverage built-in features (withState, withMethods, withComputed, withHooks)
- Implement proper async handling with rxMethod
- Use withDevtools for debugging
- Follow functional composition patterns
- Integrate seamlessly with Angular Signals ecosystem

## Installation & Setup

### Package Installation
```bash
npm install @ngrx/signals @ngrx/operators
# Optional for devtools
npm install @ngrx/store-devtools
```

### Basic Store Setup
```typescript
import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';
import { computed } from '@angular/core';

// Define initial state interface
interface CounterState {
  count: number;
  loading: boolean;
}

// Create the store
export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState<CounterState>({
    count: 0,
    loading: false
  }),
  withComputed((store) => ({
    isEven: computed(() => store.count() % 2 === 0),
    status: computed(() => store.loading() ? 'Loading...' : `Count: ${store.count()}`)
  })),
  withMethods((store) => ({
    increment: () => {
      store.patchState({ count: store.count() + 1 });
    },
    decrement: () => {
      store.patchState({ count: store.count() - 1 });
    },
    reset: () => {
      store.patchState({ count: 0 });
    },
    setLoading: (loading: boolean) => {
      store.patchState({ loading });
    }
  }))
);
```

## Advanced Store Patterns

### Entity Store with CRUD Operations
```typescript
import { 
  signalStore, 
  withState, 
  withMethods, 
  withComputed, 
  withHooks 
} from '@ngrx/signals';
import { 
  addEntity, 
  removeEntity, 
  updateEntity, 
  withEntities,
  selectEntity,
  getEntityUpdater
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { inject } from '@angular/core';

// Entity interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  isActive: boolean;
  lastLogin?: Date;
}

// Filter interface
export interface UserFilters {
  searchTerm: string;
  role: string | null;
  showInactive: boolean;
}

// Store state
interface UserState {
  filters: UserFilters;
  loading: boolean;
  error: string | null;
  selectedUserId: string | null;
}

export const UserStore = signalStore(
  { providedIn: 'root' },
  
  // Add entities support
  withEntities<User>(),
  
  // Add additional state
  withState<UserState>({
    filters: {
      searchTerm: '',
      role: null,
      showInactive: false
    },
    loading: false,
    error: null,
    selectedUserId: null
  }),
  
  // Add computed selectors
  withComputed((store) => ({
    // Get selected user
    selectedUser: computed(() => {
      const id = store.selectedUserId();
      return id ? selectEntity(store.entities, store.entityMap)(id) : null;
    }),
    
    // Filtered users based on search and filters
    filteredUsers: computed(() => {
      const users = store.entities();
      const filters = store.filters();
      
      return users.filter(user => {
        const matchesSearch = !filters.searchTerm || 
          user.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
          
        const matchesRole = !filters.role || user.role === filters.role;
        const matchesActive = filters.showInactive || user.isActive;
        
        return matchesSearch && matchesRole && matchesActive;
      });
    }),
    
    // Statistics
    userStats: computed(() => {
      const users = store.entities();
      return {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        admins: users.filter(u => u.role === 'admin').length,
        guests: users.filter(u => u.role === 'guest').length
      };
    }),
    
    // Loading states
    isLoading: computed(() => store.loading()),
    hasError: computed(() => !!store.error()),
    isEmpty: computed(() => store.entities().length === 0)
  })),
  
  // Add methods for state mutations
  withMethods((store) => {
    const userService = inject(UserService);
    
    return {
      // Filter methods
      setSearchTerm: (searchTerm: string) => {
        store.patchState({
          filters: { ...store.filters(), searchTerm }
        });
      },
      
      setRoleFilter: (role: string | null) => {
        store.patchState({
          filters: { ...store.filters(), role }
        });
      },
      
      toggleShowInactive: () => {
        store.patchState({
          filters: { 
            ...store.filters(), 
            showInactive: !store.filters().showInactive 
          }
        });
      },
      
      clearFilters: () => {
        store.patchState({
          filters: {
            searchTerm: '',
            role: null,
            showInactive: false
          }
        });
      },
      
      // Selection methods
      selectUser: (userId: string | null) => {
        store.patchState({ selectedUserId: userId });
      },
      
      // Entity mutations
      addUser: (user: User) => {
        store.patchState(addEntity(user));
      },
      
      updateUser: (id: string, changes: Partial<User>) => {
        store.patchState(updateEntity({ id, changes }));
      },
      
      removeUser: (id: string) => {
        store.patchState(removeEntity(id));
      },
      
      // Bulk operations
      addUsers: (users: User[]) => {
        store.patchState(addEntity(...users));
      },
      
      removeUsers: (ids: string[]) => {
        store.patchState(removeEntity(...ids));
      },
      
      // Error handling
      setError: (error: string | null) => {
        store.patchState({ error, loading: false });
      },
      
      clearError: () => {
        store.patchState({ error: null });
      },
      
      // Async methods using rxMethod
      loadUsers: rxMethod<void>(
        pipe(
          tap(() => store.patchState({ loading: true, error: null })),
          switchMap(() =>
            userService.getUsers().pipe(
              tap((users) => {
                store.patchState(
                  addEntity(...users),
                  { loading: false, error: null }
                );
              }),
              catchError((error) => {
                store.patchState({ 
                  loading: false, 
                  error: error.message || 'Failed to load users' 
                });
                return of(null);
              })
            )
          )
        )
      ),
      
      saveUser: rxMethod<User>(
        pipe(
          tap(() => store.patchState({ loading: true, error: null })),
          switchMap((user) =>
            userService.saveUser(user).pipe(
              tap((savedUser) => {
                // Update or add based on whether user exists
                const existingUser = store.entityMap()[user.id];
                if (existingUser) {
                  store.patchState(updateEntity({ id: user.id, changes: savedUser }));
                } else {
                  store.patchState(addEntity(savedUser));
                }
                store.patchState({ loading: false });
              }),
              catchError((error) => {
                store.patchState({ 
                  loading: false, 
                  error: error.message || 'Failed to save user' 
                });
                return of(null);
              })
            )
          )
        )
      ),
      
      deleteUser: rxMethod<string>(
        pipe(
          tap(() => store.patchState({ loading: true, error: null })),
          switchMap((userId) =>
            userService.deleteUser(userId).pipe(
              tap(() => {
                store.patchState(removeEntity(userId));
                store.patchState({ 
                  loading: false,
                  selectedUserId: store.selectedUserId() === userId ? null : store.selectedUserId()
                });
              }),
              catchError((error) => {
                store.patchState({ 
                  loading: false, 
                  error: error.message || 'Failed to delete user' 
                });
                return of(null);
              })
            )
          )
        )
      )
    };
  }),
  
  // Add lifecycle hooks
  withHooks({
    onInit: (store) => {
      console.log('UserStore initialized');
      // Auto-load users on initialization
      store.loadUsers();
    },
    onDestroy: () => {
      console.log('UserStore destroyed');
    }
  })
);
```

### Component Integration
```typescript
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    DialogModule,
    TagModule
  ],
  template: `
    <div class="user-management">
      <!-- Filters Section -->
      <div class="filters-section mb-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="form-field">
            <label for="search">Search Users</label>
            <p-inputtext
              id="search"
              placeholder="Search by name or email"
              [ngModel]="userStore.filters().searchTerm"
              (ngModelChange)="userStore.setSearchTerm($event)"
              class="w-full">
            </p-inputtext>
          </div>
          
          <div class="form-field">
            <label for="role">Filter by Role</label>
            <p-dropdown
              id="role"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="All Roles"
              [ngModel]="userStore.filters().role"
              (ngModelChange)="userStore.setRoleFilter($event)"
              class="w-full">
            </p-dropdown>
          </div>
          
          <div class="form-field flex items-end">
            <p-button
              label="Show Inactive"
              [text]="true"
              [raised]="userStore.filters().showInactive"
              (onClick)="userStore.toggleShowInactive()">
            </p-button>
          </div>
          
          <div class="form-field flex items-end">
            <p-button
              label="Clear Filters"
              severity="secondary"
              [text]="true"
              (onClick)="userStore.clearFilters()">
            </p-button>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="stats-section mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="stat-card">
            <h3>Total Users</h3>
            <span class="text-2xl font-bold">{{ userStore.userStats().total }}</span>
          </div>
          <div class="stat-card">
            <h3>Active</h3>
            <span class="text-2xl font-bold text-green-600">{{ userStore.userStats().active }}</span>
          </div>
          <div class="stat-card">
            <h3>Admins</h3>
            <span class="text-2xl font-bold text-blue-600">{{ userStore.userStats().admins }}</span>
          </div>
          <div class="stat-card">
            <h3>Guests</h3>
            <span class="text-2xl font-bold text-gray-600">{{ userStore.userStats().guests }}</span>
          </div>
        </div>
      </div>

      <!-- Error Display -->
      @if (userStore.hasError()) {
        <p-message 
          severity="error" 
          [text]="userStore.error()!"
          [closable]="true"
          (onClose)="userStore.clearError()"
          class="mb-4">
        </p-message>
      }

      <!-- Users Table -->
      <p-table
        [value]="userStore.filteredUsers()"
        [loading]="userStore.isLoading()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 25]"
        selectionMode="single"
        [(selection)]="selectedUser"
        (onRowSelect)="onUserSelect($event)"
        class="p-datatable-striped">
        
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-user>
          <tr>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <p-tag [value]="user.role" [severity]="getRoleSeverity(user.role)"></p-tag>
            </td>
            <td>
              <p-tag 
                [value]="user.isActive ? 'Active' : 'Inactive'"
                [severity]="user.isActive ? 'success' : 'danger'">
              </p-tag>
            </td>
            <td>{{ user.lastLogin | date:'short' }}</td>
            <td>
              <div class="flex gap-2">
                <p-button
                  icon="pi pi-pencil"
                  size="small"
                  [text]="true"
                  (onClick)="editUser(user)"
                  ariaLabel="Edit user">
                </p-button>
                <p-button
                  icon="pi pi-trash"
                  size="small"
                  [text]="true"
                  severity="danger"
                  (onClick)="confirmDeleteUser(user)"
                  ariaLabel="Delete user">
                </p-button>
              </div>
            </td>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center">
              @if (userStore.isEmpty()) {
                No users found
              } @else {
                No users match the current filters
              }
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Selected User Details -->
      @if (userStore.selectedUser(); as selected) {
        <div class="selected-user mt-6 p-4 border rounded-lg">
          <h3>Selected User Details</h3>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <div>
              <strong>Name:</strong> {{ selected.name }}
            </div>
            <div>
              <strong>Email:</strong> {{ selected.email }}
            </div>
            <div>
              <strong>Role:</strong> {{ selected.role }}
            </div>
            <div>
              <strong>Status:</strong> {{ selected.isActive ? 'Active' : 'Inactive' }}
            </div>
          </div>
          <div class="mt-4">
            <p-button
              label="Deselect"
              [text]="true"
              (onClick)="userStore.selectUser(null)">
            </p-button>
          </div>
        </div>
      }

      <!-- Action Buttons -->
      <div class="actions mt-6">
        <p-button
          label="Add New User"
          icon="pi pi-plus"
          (onClick)="addNewUser()">
        </p-button>
        <p-button
          label="Refresh"
          icon="pi pi-refresh"
          [text]="true"
          [loading]="userStore.isLoading()"
          (onClick)="userStore.loadUsers()"
          class="ml-2">
        </p-button>
      </div>
    </div>
  `
})
export class UserManagementComponent {
  protected readonly userStore = inject(UserStore);
  
  protected selectedUser: User | null = null;
  
  protected readonly roleOptions = [
    { label: 'All Roles', value: null },
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' },
    { label: 'Guest', value: 'guest' }
  ];
  
  protected onUserSelect(event: any): void {
    const user = event.data as User;
    this.userStore.selectUser(user.id);
  }
  
  protected getRoleSeverity(role: string): string {
    switch (role) {
      case 'admin': return 'danger';
      case 'user': return 'info';
      case 'guest': return 'secondary';
      default: return 'info';
    }
  }
  
  protected editUser(user: User): void {
    // Implement edit logic
    console.log('Edit user:', user);
  }
  
  protected confirmDeleteUser(user: User): void {
    // Implement delete confirmation
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userStore.deleteUser(user.id);
    }
  }
  
  protected addNewUser(): void {
    // Implement add new user logic
    console.log('Add new user');
  }
}
```

## Local Component Store Pattern
```typescript
// Component-scoped store
@Component({
  selector: 'app-todo-list',
  standalone: true,
  providers: [
    // Provide store at component level
    signalStore(
      withState<{ todos: Todo[]; filter: 'all' | 'active' | 'completed' }>({
        todos: [],
        filter: 'all'
      }),
      withComputed((store) => ({
        filteredTodos: computed(() => {
          const todos = store.todos();
          const filter = store.filter();
          
          switch (filter) {
            case 'active': return todos.filter(t => !t.completed);
            case 'completed': return todos.filter(t => t.completed);
            default: return todos;
          }
        }),
        todosCount: computed(() => ({
          total: store.todos().length,
          active: store.todos().filter(t => !t.completed).length,
          completed: store.todos().filter(t => t.completed).length
        }))
      })),
      withMethods((store) => ({
        addTodo: (text: string) => {
          const newTodo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: new Date()
          };
          store.patchState({ 
            todos: [...store.todos(), newTodo] 
          });
        },
        toggleTodo: (id: string) => {
          store.patchState({
            todos: store.todos().map(todo =>
              todo.id === id ? { ...todo, completed: !todo.completed } : todo
            )
          });
        },
        removeTodo: (id: string) => {
          store.patchState({
            todos: store.todos().filter(todo => todo.id !== id)
          });
        },
        setFilter: (filter: 'all' | 'active' | 'completed') => {
          store.patchState({ filter });
        },
        clearCompleted: () => {
          store.patchState({
            todos: store.todos().filter(todo => !todo.completed)
          });
        }
      }))
    )
  ],
  template: `
    <div class="todo-list">
      <!-- Add todo form -->
      <form (ngSubmit)="addTodo()" class="mb-4">
        <div class="flex gap-2">
          <input 
            #todoInput
            type="text" 
            placeholder="Add new todo..."
            class="flex-1 p-2 border rounded">
          <p-button 
            label="Add" 
            type="submit">
          </p-button>
        </div>
      </form>

      <!-- Filter buttons -->
      <div class="filters mb-4">
        <p-button 
          label="All ({{ store.todosCount().total }})"
          [text]="store.filter() !== 'all'"
          (onClick)="store.setFilter('all')">
        </p-button>
        <p-button 
          label="Active ({{ store.todosCount().active }})"
          [text]="store.filter() !== 'active'"
          (onClick)="store.setFilter('active')">
        </p-button>
        <p-button 
          label="Completed ({{ store.todosCount().completed }})"
          [text]="store.filter() !== 'completed'"
          (onClick)="store.setFilter('completed')">
        </p-button>
      </div>

      <!-- Todo list -->
      <ul class="todo-items">
        @for (todo of store.filteredTodos(); track todo.id) {
          <li class="flex items-center gap-2 p-2 border-b">
            <input 
              type="checkbox"
              [checked]="todo.completed"
              (change)="store.toggleTodo(todo.id)">
            <span [class.line-through]="todo.completed">
              {{ todo.text }}
            </span>
            <p-button 
              icon="pi pi-times"
              size="small"
              [text]="true"
              severity="danger"
              (onClick)="store.removeTodo(todo.id)">
            </p-button>
          </li>
        } @empty {
          <li class="text-center text-gray-500 p-4">
            No todos {{ store.filter() === 'all' ? '' : store.filter() }}
          </li>
        }
      </ul>

      <!-- Clear completed -->
      @if (store.todosCount().completed > 0) {
        <div class="mt-4">
          <p-button 
            label="Clear Completed"
            [text]="true"
            severity="secondary"
            (onClick)="store.clearCompleted()">
          </p-button>
        </div>
      }
    </div>
  `
})
export class TodoListComponent {
  protected readonly store = inject(TodoStore);
  
  addTodo(): void {
    const input = document.querySelector('input') as HTMLInputElement;
    if (input.value.trim()) {
      this.store.addTodo(input.value.trim());
      input.value = '';
    }
  }
}
```

## Custom Features and Plugins

### Custom withLocalStorage Feature
```typescript
import { computed, Signal } from '@angular/core';
import { signalStoreFeature, withMethods, withHooks } from '@ngrx/signals';

export function withLocalStorage<T>(
  key: string,
  initialValue: T
): SignalStoreFeature<
  EmptyFeatureResult,
  {
    state: { [K in keyof T]: T[K] };
    computed: {
      storageKey: Signal<string>;
    };
    methods: {
      saveToStorage: () => void;
      loadFromStorage: () => void;
      clearStorage: () => void;
    };
  }
> {
  return signalStoreFeature(
    withState(initialValue),
    withComputed(() => ({
      storageKey: computed(() => key)
    })),
    withMethods((store) => ({
      saveToStorage: () => {
        try {
          localStorage.setItem(key, JSON.stringify(store()));
        } catch (error) {
          console.warn('Failed to save to localStorage:', error);
        }
      },
      
      loadFromStorage: () => {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const data = JSON.parse(stored);
            store.patchState(data);
          }
        } catch (error) {
          console.warn('Failed to load from localStorage:', error);
        }
      },
      
      clearStorage: () => {
        try {
          localStorage.removeItem(key);
          store.patchState(initialValue);
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      }
    })),
    withHooks({
      onInit: (store) => {
        // Auto-load on init
        store.loadFromStorage();
      }
    })
  );
}

// Usage
export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withLocalStorage('app-settings', {
    theme: 'light' as 'light' | 'dark',
    language: 'en',
    notifications: true
  }),
  withMethods((store) => ({
    toggleTheme: () => {
      const newTheme = store.theme() === 'light' ? 'dark' : 'light';
      store.patchState({ theme: newTheme });
      store.saveToStorage();
    },
    setLanguage: (language: string) => {
      store.patchState({ language });
      store.saveToStorage();
    },
    toggleNotifications: () => {
      store.patchState({ notifications: !store.notifications() });
      store.saveToStorage();
    }
  }))
);
```

### withDevtools Feature
```typescript
import { signalStore, withState, withMethods } from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';

export const DebuggableStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withMethods((store) => ({
    increment: () => store.patchState({ count: store.count() + 1 }),
    decrement: () => store.patchState({ count: store.count() - 1 })
  })),
  // Enable Redux DevTools
  withDevtools('counter-store')
);
```

## Testing SignalStore

### Unit Testing Store
```typescript
import { TestBed } from '@angular/core/testing';
import { UserStore } from './user.store';
import { UserService } from './user.service';

describe('UserStore', () => {
  let store: InstanceType<typeof UserStore>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    const userServiceSpy = jasmine.createSpyObj('UserService', 
      ['getUsers', 'saveUser', 'deleteUser']
    );

    TestBed.configureTestingModule({
      providers: [
        UserStore,
        { provide: UserService, useValue: userServiceSpy }
      ]
    });

    store = TestBed.inject(UserStore);
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  it('should initialize with empty state', () => {
    expect(store.entities()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should add user', () => {
    const user: User = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      isActive: true
    };

    store.addUser(user);
    
    expect(store.entities()).toContain(user);
    expect(store.entities().length).toBe(1);
  });

  it('should filter users by search term', () => {
    const users: User[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', isActive: true },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', isActive: true }
    ];

    store.addUsers(users);
    store.setSearchTerm('john');

    expect(store.filteredUsers().length).toBe(1);
    expect(store.filteredUsers()[0].name).toBe('John Doe');
  });

  it('should handle loading state during async operations', fakeAsync(() => {
    const users: User[] = [
      { id: '1', name: 'Test User', email: 'test@example.com', role: 'user', isActive: true }
    ];
    
    userService.getUsers.and.returnValue(of(users).pipe(delay(100)));
    
    store.loadUsers();
    
    expect(store.loading()).toBe(true);
    
    tick(100);
    
    expect(store.loading()).toBe(false);
    expect(store.entities()).toEqual(users);
  }));
});
```

### Component Testing with Store
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserManagementComponent } from './user-management.component';
import { UserStore } from './user.store';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let store: jasmine.SpyObj<UserStore>;

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('UserStore', [
      'setSearchTerm',
      'selectUser',
      'loadUsers'
    ], {
      filteredUsers: signal([]),
      isLoading: signal(false),
      userStats: signal({ total: 0, active: 0, admins: 0, guests: 0 })
    });

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        { provide: UserStore, useValue: storeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(UserStore) as jasmine.SpyObj<UserStore>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call store methods on user interactions', () => {
    component.onUserSelect({ data: { id: '1', name: 'Test' } });
    
    expect(store.selectUser).toHaveBeenCalledWith('1');
  });
});
```

## Best Practices & Patterns

### Do's ✅
- Use SignalStore for local and feature-level state management
- Leverage withEntities for collections and CRUD operations
- Use rxMethod for async operations with proper error handling
- Implement computed selectors for derived state
- Use withHooks for initialization and cleanup logic
- Provide stores at appropriate levels (root, component, route)
- Use meaningful method names that describe actions
- Implement proper loading and error states
- Use TypeScript interfaces for strong typing
- Test stores in isolation and with components

### Don'ts ❌
- Don't mutate state directly (always use patchState)
- Don't forget error handling in rxMethod
- Don't mix SignalStore with classic NgRx patterns in same feature
- Don't ignore loading states for async operations
- Don't create overly complex stores (split if needed)
- Don't access store state synchronously in rxMethod
- Don't forget to handle edge cases in computed selectors
- Don't use SignalStore for complex state machines
- Don't neglect proper typing for better developer experience

## Performance Optimization

### Memoization and Computed Signals
```typescript
export const OptimizedStore = signalStore(
  withState<{ items: Item[]; filters: FilterState }>({
    items: [],
    filters: { category: null, priceRange: [0, 1000] }
  }),
  withComputed((store) => ({
    // Expensive computation - memoized automatically
    expensiveCalculation: computed(() => {
      return store.items().reduce((acc, item) => {
        // Complex calculation here
        return acc + item.value * item.quantity;
      }, 0);
    }),
    
    // Filtered items - only recalculates when items or filters change
    filteredItems: computed(() => {
      const items = store.items();
      const filters = store.filters();
      
      return items.filter(item => {
        if (filters.category && item.category !== filters.category) {
          return false;
        }
        if (item.price < filters.priceRange[0] || item.price > filters.priceRange[1]) {
          return false;
        }
        return true;
      });
    }),
    
    // Nested computed - depends on other computed
    sortedFilteredItems: computed(() => {
      return store.filteredItems().sort((a, b) => a.name.localeCompare(b.name));
    })
  }))
);
```

### Efficient Entity Updates
```typescript
export const ProductStore = signalStore(
  withEntities<Product>(),
  withMethods((store) => ({
    // Efficient bulk updates
    updatePrices: (priceUpdates: Record<string, number>) => {
      const updates = Object.entries(priceUpdates).map(([id, price]) => ({
        id,
        changes: { price }
      }));
      
      store.patchState(
        updates.reduce(
          (state, update) => updateEntity(update)(state),
          store()
        )
      );
    },
    
    // Optimized filtering without recreating arrays
    toggleProductActive: (productId: string) => {
      const product = store.entityMap()[productId];
      if (product) {
        store.patchState(
          updateEntity({
            id: productId,
            changes: { isActive: !product.isActive }
          })
        );
      }
    }
  }))
);
```

## Advanced Patterns

### Store Composition
```typescript
// Base store with common functionality
const createBaseStore = <T extends { id: string }>() =>
  signalStoreFeature(
    withEntities<T>(),
    withState({ loading: false, error: null as string | null }),
    withComputed((store) => ({
      isEmpty: computed(() => store.entities().length === 0),
      hasError: computed(() => !!store.error())
    })),
    withMethods((store) => ({
      setLoading: (loading: boolean) => store.patchState({ loading }),
      setError: (error: string | null) => store.patchState({ error }),
      clearError: () => store.patchState({ error: null })
    }))
  );

// Specialized store using base functionality
export const ProductStore = signalStore(
  { providedIn: 'root' },
  createBaseStore<Product>(),
  withState({ 
    selectedCategory: null as string | null,
    sortField: 'name' as keyof Product,
    sortDirection: 'asc' as 'asc' | 'desc'
  }),
  withComputed((store) => ({
    sortedProducts: computed(() => {
      const products = store.entities();
      const field = store.sortField();
      const direction = store.sortDirection();
      
      return [...products].sort((a, b) => {
        const aValue = a[field];
        const bValue = b[field];
        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return direction === 'asc' ? comparison : -comparison;
      });
    })
  })),
  withMethods((store) => ({
    setSortField: (field: keyof Product) => {
      store.patchState({ sortField: field });
    },
    toggleSortDirection: () => {
      store.patchState({
        sortDirection: store.sortDirection() === 'asc' ? 'desc' : 'asc'
      });
    }
  }))
);
```

### Store Communication Pattern
```typescript
// Shared service for store communication
@Injectable({ providedIn: 'root' })
export class StoreNotificationService {
  private readonly notificationSubject = new Subject<StoreNotification>();
  
  readonly notifications$ = this.notificationSubject.asObservable();
  
  notify(notification: StoreNotification): void {
    this.notificationSubject.next(notification);
  }
}

interface StoreNotification {
  type: 'user-updated' | 'product-deleted' | 'order-created';
  payload?: any;
}

// Store A - sends notifications
export const UserStore = signalStore(
  { providedIn: 'root' },
  withEntities<User>(),
  withMethods((store) => {
    const notificationService = inject(StoreNotificationService);
    
    return {
      updateUser: rxMethod<{ id: string; changes: Partial<User> }>(
        pipe(
          switchMap(({ id, changes }) =>
            userService.updateUser(id, changes).pipe(
              tap((updatedUser) => {
                store.patchState(updateEntity({ id, changes: updatedUser }));
                notificationService.notify({
                  type: 'user-updated',
                  payload: updatedUser
                });
              })
            )
          )
        )
      )
    };
  })
);

// Store B - reacts to notifications
export const OrderStore = signalStore(
  { providedIn: 'root' },
  withEntities<Order>(),
  withHooks({
    onInit: (store) => {
      const notificationService = inject(StoreNotificationService);
      
      notificationService.notifications$
        .pipe(
          filter(notification => notification.type === 'user-updated'),
          map(notification => notification.payload as User)
        )
        .subscribe((updatedUser) => {
          // Update orders that reference this user
          const ordersToUpdate = store.entities()
            .filter(order => order.userId === updatedUser.id);
            
          ordersToUpdate.forEach(order => {
            store.patchState(
              updateEntity({
                id: order.id,
                changes: { userName: updatedUser.name }
              })
            );
          });
        });
    }
  })
);
```

### Middleware Pattern
```typescript
// Logging middleware
export function withLogging<T>(storeName: string) {
  return signalStoreFeature(
    withMethods((store) => {
      const originalPatchState = store.patchState;
      
      return {
        patchState: (partial: Partial<T>) => {
          console.log(`[${storeName}] State update:`, partial);
          console.log(`[${storeName}] Previous state:`, store());
          
          originalPatchState(partial);
          
          console.log(`[${storeName}] New state:`, store());
        }
      };
    })
  );
}

// Usage
export const LoggedStore = signalStore(
  withState({ count: 0 }),
  withLogging<{ count: number }>('Counter'),
  withMethods((store) => ({
    increment: () => store.patchState({ count: store.count() + 1 })
  }))
);
```

## Real-World Examples

### Shopping Cart Store
```typescript
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  discountCode: string | null;
  discountAmount: number;
  shipping: number;
  tax: number;
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({
    items: [],
    discountCode: null,
    discountAmount: 0,
    shipping: 0,
    tax: 0
  }),
  withComputed((store) => ({
    subtotal: computed(() => 
      store.items().reduce((sum, item) => sum + (item.price * item.quantity), 0)
    ),
    
    total: computed(() => {
      const subtotal = store.subtotal();
      const discount = store.discountAmount();
      const shipping = store.shipping();
      const tax = store.tax();
      
      return Math.max(0, subtotal - discount + shipping + tax);
    }),
    
    itemCount: computed(() => 
      store.items().reduce((count, item) => count + item.quantity, 0)
    ),
    
    isEmpty: computed(() => store.items().length === 0),
    
    hasDiscount: computed(() => !!store.discountCode())
  })),
  withMethods((store) => {
    const discountService = inject(DiscountService);
    
    return {
      addItem: (product: Product) => {
        const existingItem = store.items().find(item => item.productId === product.id);
        
        if (existingItem) {
          store.patchState({
            items: store.items().map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
          };
          
          store.patchState({
            items: [...store.items(), newItem]
          });
        }
      },
      
      removeItem: (productId: string) => {
        store.patchState({
          items: store.items().filter(item => item.productId !== productId)
        });
      },
      
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          store.removeItem(productId);
          return;
        }
        
        store.patchState({
          items: store.items().map(item =>
            item.productId === productId ? { ...item, quantity } : item
          )
        });
      },
      
      clearCart: () => {
        store.patchState({
          items: [],
          discountCode: null,
          discountAmount: 0
        });
      },
      
      applyDiscount: rxMethod<string>(
        pipe(
          switchMap((code) =>
            discountService.validateDiscount(code, store.subtotal()).pipe(
              tap((discount) => {
                store.patchState({
                  discountCode: code,
                  discountAmount: discount.amount
                });
              }),
              catchError((error) => {
                console.error('Invalid discount code:', error);
                return of(null);
              })
            )
          )
        )
      ),
      
      removeDiscount: () => {
        store.patchState({
          discountCode: null,
          discountAmount: 0
        });
      },
      
      calculateShipping: rxMethod<string>(
        pipe(
          switchMap((address) =>
            shippingService.calculateShipping(address, store.items()).pipe(
              tap((shipping) => {
                store.patchState({ shipping: shipping.cost });
              })
            )
          )
        )
      )
    };
  })
);
```

### Form State Store
```typescript
interface FormFieldState {
  value: any;
  errors: string[];
  touched: boolean;
  dirty: boolean;
}

interface FormState {
  fields: Record<string, FormFieldState>;
  isSubmitting: boolean;
  submitError: string | null;
  lastSubmittedAt: Date | null;
}

export function createFormStore<T extends Record<string, any>>(
  initialValues: T,
  validators: Record<keyof T, ((value: any) => string[])>
) {
  return signalStore(
    withState<FormState>({
      fields: Object.keys(initialValues).reduce((fields, key) => ({
        ...fields,
        [key]: {
          value: initialValues[key],
          errors: [],
          touched: false,
          dirty: false
        }
      }), {}),
      isSubmitting: false,
      submitError: null,
      lastSubmittedAt: null
    }),
    
    withComputed((store) => ({
      values: computed(() => 
        Object.keys(store.fields()).reduce((values, key) => ({
          ...values,
          [key]: store.fields()[key].value
        }), {} as T)
      ),
      
      isValid: computed(() => 
        Object.values(store.fields()).every(field => field.errors.length === 0)
      ),
      
      isDirty: computed(() =>
        Object.values(store.fields()).some(field => field.dirty)
      ),
      
      touchedFields: computed(() =>
        Object.keys(store.fields()).filter(key => store.fields()[key].touched)
      ),
      
      fieldErrors: computed(() =>
        Object.keys(store.fields()).reduce((errors, key) => {
          const field = store.fields()[key];
          return field.errors.length > 0 ? { ...errors, [key]: field.errors } : errors;
        }, {} as Record<string, string[]>)
      )
    })),
    
    withMethods((store) => ({
      setFieldValue: (fieldName: string, value: any) => {
        const field = store.fields()[fieldName];
        const errors = validators[fieldName]?.(value) || [];
        
        store.patchState({
          fields: {
            ...store.fields(),
            [fieldName]: {
              ...field,
              value,
              errors,
              dirty: value !== initialValues[fieldName]
            }
          }
        });
      },
      
      touchField: (fieldName: string) => {
        const field = store.fields()[fieldName];
        store.patchState({
          fields: {
            ...store.fields(),
            [fieldName]: { ...field, touched: true }
          }
        });
      },
      
      touchAllFields: () => {
        const updatedFields = Object.keys(store.fields()).reduce((fields, key) => ({
          ...fields,
          [key]: { ...store.fields()[key], touched: true }
        }), {});
        
        store.patchState({ fields: updatedFields });
      },
      
      validateAllFields: () => {
        const updatedFields = Object.keys(store.fields()).reduce((fields, key) => {
          const field = store.fields()[key];
          const errors = validators[key]?.(field.value) || [];
          
          return {
            ...fields,
            [key]: { ...field, errors, touched: true }
          };
        }, {});
        
        store.patchState({ fields: updatedFields });
      },
      
      reset: () => {
        const resetFields = Object.keys(initialValues).reduce((fields, key) => ({
          ...fields,
          [key]: {
            value: initialValues[key],
            errors: [],
            touched: false,
            dirty: false
          }
        }), {});
        
        store.patchState({
          fields: resetFields,
          isSubmitting: false,
          submitError: null
        });
      },
      
      setSubmitting: (isSubmitting: boolean) => {
        store.patchState({ isSubmitting });
      },
      
      setSubmitError: (error: string | null) => {
        store.patchState({ 
          submitError: error, 
          isSubmitting: false 
        });
      },
      
      markSubmitted: () => {
        store.patchState({ 
          lastSubmittedAt: new Date(),
          isSubmitting: false,
          submitError: null
        });
      }
    }))
  );
}

// Usage
const userValidators = {
  name: (value: string) => value?.length < 2 ? ['Name must be at least 2 characters'] : [],
  email: (value: string) => {
    const errors: string[] = [];
    if (!value) errors.push('Email is required');
    else if (!/\S+@\S+\.\S+/.test(value)) errors.push('Email is invalid');
    return errors;
  },
  age: (value: number) => value < 18 ? ['Must be 18 or older'] : []
};

export const UserFormStore = createFormStore(
  { name: '', email: '', age: 18 },
  userValidators
);
```

## Integration with External Libraries

### WebSocket Integration
```typescript
export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState<{
    messages: Message[];
    connected: boolean;
    typing: string[];
    currentUser: string | null;
  }>({
    messages: [],
    connected: false,
    typing: [],
    currentUser: null
  }),
  withMethods((store) => {
    const webSocketService = inject(WebSocketService);
    
    return {
      connect: rxMethod<string>(
        pipe(
          tap((username) => {
            store.patchState({ currentUser: username });
          }),
          switchMap((username) =>
            webSocketService.connect().pipe(
              tap(() => {
                store.patchState({ connected: true });
                webSocketService.send({ type: 'join', username });
              }),
              switchMap(() =>
                webSocketService.messages$.pipe(
                  tap((message) => {
                    switch (message.type) {
                      case 'message':
                        store.patchState({
                          messages: [...store.messages(), message.data]
                        });
                        break;
                      case 'typing':
                        store.patchState({
                          typing: message.data.typing ? 
                            [...store.typing(), message.data.user] :
                            store.typing().filter(user => user !== message.data.user)
                        });
                        break;
                    }
                  })
                )
              ),
              catchError(() => {
                store.patchState({ connected: false });
                return of(null);
              })
            )
          )
        )
      ),
      
      sendMessage: (text: string) => {
        if (store.connected() && text.trim()) {
          webSocketService.send({
            type: 'message',
            data: {
              text: text.trim(),
              user: store.currentUser(),
              timestamp: new Date()
            }
          });
        }
      },
      
      disconnect: () => {
        webSocketService.disconnect();
        store.patchState({ 
          connected: false, 
          messages: [], 
          typing: [],
          currentUser: null 
        });
      }
    };
  }),
  withHooks({
    onDestroy: (store) => {
      if (store.connected()) {
        store.disconnect();
      }
    }
  })
);
```

This comprehensive guide covers all aspects of NgRx SignalStore for modern Angular applications, providing patterns and best practices for effective state management with the latest Angular features!
