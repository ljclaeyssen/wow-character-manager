# PrimeNG v20 Guidelines for Claude Code

## Core Principles (PrimeNG v20)
- Use standalone components with PrimeNG imports
- Leverage @primeuix/themes for consistent theming
- Use native class attribute instead of deprecated styleClass
- Implement proper accessibility (WCAG 2.1 AA compliance)
- Utilize Angular 18+ features (Signals, new control flow)
- Follow PrimeNG's component-specific best practices

## Installation & Setup (v20)

### Package Installation
```bash
npm install primeng @primeuix/themes primeicons
```

### App Configuration (app.config.ts)
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
// import Material from '@primeuix/themes/material';
// import Lara from '@primeuix/themes/lara';
// import Nora from '@primeuix/themes/nora';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark-mode',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    })
  ]
};
```

### Styles Configuration (styles.scss)
```scss
@import 'primeicons/primeicons.css';

// CSS Layer configuration for compatibility
@layer tailwind-base, primeng, tailwind-utilities;

// Custom theme overrides if needed
:root {
  --p-primary-color: #3b82f6;
  --p-primary-contrast-color: #ffffff;
}
```

## Component Import Patterns

### Individual Component Imports
```typescript
import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TableModule,
    DialogModule
  ],
  template: `...`
})
export class ExampleComponent {
  // Component logic
}
```

## Modern Component Implementation

### Signal-based Component with PrimeNG
```typescript
@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="user-manager">
      <p-table 
        [value]="users()" 
        [loading]="loading()"
        [paginator]="true"
        [rows]="10"
        [rowsPerPageOptions]="[5, 10, 20]"
        class="p-datatable-sm">
        
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="body" let-user>
          <tr>
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <p-tag 
                [value]="user.status" 
                [severity]="getStatusSeverity(user.status)">
              </p-tag>
            </td>
            <td>
              <p-button 
                icon="pi pi-pencil" 
                [text]="true"
                [rounded]="true"
                severity="info"
                (onClick)="editUser(user)"
                ariaLabel="Edit user">
              </p-button>
              <p-button 
                icon="pi pi-trash" 
                [text]="true"
                [rounded]="true"
                severity="danger"
                (onClick)="deleteUser(user)"
                ariaLabel="Delete user">
              </p-button>
            </td>
          </tr>
        </ng-template>
        
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="4" class="text-center">No users found</td>
          </tr>
        </ng-template>
      </p-table>

      <p-dialog 
        [(visible)]="dialogVisible"
        [modal]="true"
        [closable]="true"
        [draggable]="false"
        [resizable]="false"
        header="User Details"
        class="max-w-md">
        
        @if (selectedUser(); as user) {
          <form [formGroup]="userForm" (ngSubmit)="saveUser()">
            <div class="flex flex-col gap-4">
              <div class="form-field">
                <label for="name">Name</label>
                <p-inputtext
                  id="name"
                  formControlName="name"
                  [invalid]="nameControl().invalid && nameControl().touched"
                  class="w-full">
                </p-inputtext>
                
                @if (nameControl().invalid && nameControl().touched) {
                  <small class="text-red-500">Name is required</small>
                }
              </div>
              
              <div class="form-field">
                <label for="status">Status</label>
                <p-dropdown
                  id="status"
                  formControlName="status"
                  [options]="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select status"
                  class="w-full">
                </p-dropdown>
              </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-4">
              <p-button 
                label="Cancel" 
                [text]="true"
                (onClick)="closeDialog()">
              </p-button>
              <p-button 
                label="Save" 
                type="submit"
                [disabled]="userForm.invalid || saving()">
              </p-button>
            </div>
          </form>
        }
      </p-dialog>
    </div>
  `
})
export class UserManagerComponent {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  
  // Signals for state management
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly dialogVisible = signal(false);
  
  // Form setup
  protected readonly userForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    status: ['', [Validators.required]]
  });
  
  protected readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' }
  ];
  
  // Computed signals
  protected readonly nameControl = computed(() => this.userForm.controls.name);
  protected readonly emailControl = computed(() => this.userForm.controls.email);
  
  constructor() {
    this.loadUsers();
  }
  
  protected editUser(user: User): void {
    this.selectedUser.set(user);
    this.userForm.patchValue(user);
    this.dialogVisible.set(true);
  }
  
  protected deleteUser(user: User): void {
    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users => users.filter(u => u.id !== user.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete user'
        });
      }
    });
  }
  
  protected saveUser(): void {
    if (this.userForm.valid) {
      this.saving.set(true);
      const userData = this.userForm.getRawValue();
      
      // Implement save logic
      this.userService.updateUser(this.selectedUser()!.id, userData).subscribe({
        next: (updatedUser) => {
          this.users.update(users => 
            users.map(u => u.id === updatedUser.id ? updatedUser : u)
          );
          this.closeDialog();
          this.saving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully'
          });
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update user'
          });
        }
      });
    }
  }
  
  protected closeDialog(): void {
    this.dialogVisible.set(false);
    this.selectedUser.set(null);
    this.userForm.reset();
  }
  
  protected getStatusSeverity(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'danger';
      case 'pending': return 'warning';
      default: return 'info';
    }
  }
  
  private loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
      }
    });
  }
}
```

## Form Components Best Practices

### Reactive Forms with PrimeNG v20
```typescript
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    MessageModule
  ],
  template: `
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="max-w-md mx-auto">
      <div class="flex flex-col gap-6">
        <div class="form-field">
          <label for="firstname">First Name *</label>
          <p-inputtext
            id="firstname"
            formControlName="firstname"
            placeholder="Enter first name"
            [invalid]="isFieldInvalid('firstname')"
            class="w-full">
          </p-inputtext>
          
          @if (isFieldInvalid('firstname')) {
            <small class="text-red-500">
              @if (userForm.get('firstname')?.errors?.['required']) {
                First name is required
              }
              @if (userForm.get('firstname')?.errors?.['minlength']) {
                First name must be at least 2 characters
              }
            </small>
          }
        </div>

        <div class="form-field">
          <label for="email">Email *</label>
          <p-inputtext
            id="email"
            type="email"
            formControlName="email"
            placeholder="Enter email address"
            [invalid]="isFieldInvalid('email')"
            class="w-full">
          </p-inputtext>
          
          @if (isFieldInvalid('email')) {
            <small class="text-red-500">
              @if (userForm.get('email')?.errors?.['required']) {
                Email is required
              }
              @if (userForm.get('email')?.errors?.['email']) {
                Please enter a valid email address
              }
            </small>
          }
        </div>

        <div class="form-field">
          <label for="password">Password *</label>
          <p-password
            id="password"
            formControlName="password"
            [feedback]="true"
            [toggleMask]="true"
            placeholder="Enter password"
            [invalid]="isFieldInvalid('password')"
            class="w-full">
          </p-password>
          
          @if (isFieldInvalid('password')) {
            <small class="text-red-500">Password is required</small>
          }
        </div>

        <div class="form-field">
          <label for="country">Country</label>
          <p-dropdown
            id="country"
            formControlName="country"
            [options]="countries"
            optionLabel="name"
            optionValue="code"
            [filter]="true"
            filterBy="name"
            placeholder="Select a country"
            class="w-full">
            
            <ng-template pTemplate="selectedItem" let-selectedOption>
              @if (selectedOption) {
                {{ selectedOption.name }}
              }
            </ng-template>
            
            <ng-template pTemplate="item" let-country>
              {{ country.name }}
            </ng-template>
          </p-dropdown>
        </div>

        <div class="form-field">
          <label for="birthdate">Birth Date</label>
          <p-calendar
            id="birthdate"
            formControlName="birthdate"
            [showIcon]="true"
            [maxDate]="maxDate"
            dateFormat="dd/mm/yy"
            placeholder="Select date"
            class="w-full">
          </p-calendar>
        </div>

        <div class="flex justify-end gap-2">
          <p-button 
            label="Cancel" 
            [text]="true"
            type="button"
            (onClick)="onCancel()">
          </p-button>
          <p-button 
            label="Save" 
            type="submit"
            [disabled]="userForm.invalid || submitting()"
            [loading]="submitting()">
          </p-button>
        </div>
      </div>
    </form>

    @if (formErrors().length > 0) {
      <p-message 
        severity="error" 
        text="Please correct the following errors:"
        class="mt-4">
      </p-message>
    }
  `
})
export class UserFormComponent {
  private readonly fb = inject(FormBuilder);
  
  protected readonly submitting = signal(false);
  protected readonly formErrors = computed(() => {
    const errors: string[] = [];
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control?.invalid && control?.touched) {
        errors.push(`${key} is invalid`);
      }
    });
    return errors;
  });

  protected readonly userForm = this.fb.group({
    firstname: ['', [Validators.required, Validators.minLength(2)]],
    lastname: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    country: [''],
    birthdate: [null as Date | null]
  });

  protected readonly countries = [
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'Spain', code: 'ES' },
    { name: 'United Kingdom', code: 'GB' }
  ];

  protected readonly maxDate = new Date();

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  protected onSubmit(): void {
    if (this.userForm.valid) {
      this.submitting.set(true);
      const formData = this.userForm.getRawValue();
      
      // Simulate API call
      setTimeout(() => {
        console.log('Form submitted:', formData);
        this.submitting.set(false);
        this.userForm.reset();
      }, 1000);
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  protected onCancel(): void {
    this.userForm.reset();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }
}
```

## Component-Specific Guidelines

### Button Component
```typescript
// Correct usage - v20
<p-button 
  label="Save"
  icon="pi pi-save"
  [disabled]="isDisabled"
  severity="primary"
  size="small"
  class="mr-2"
  (onClick)="handleSave()">
</p-button>

// Text button
<p-button 
  label="Cancel"
  [text]="true"
  severity="secondary"
  (onClick)="handleCancel()">
</p-button>

// Icon only button
<p-button 
  icon="pi pi-search"
  [rounded]="true"
  ariaLabel="Search"
  (onClick)="handleSearch()">
</p-button>
```

### Table Component
```typescript
// Modern table implementation
<p-table 
  [value]="data()" 
  [loading]="loading()"
  [paginator]="true"
  [rows]="pageSize()"
  [rowsPerPageOptions]="[10, 25, 50]"
  [globalFilterFields]="['name', 'email']"
  [sortMode]="'multiple'"
  class="p-datatable-striped">
  
  <ng-template pTemplate="caption">
    <div class="flex justify-between items-center">
      <h2>Users</h2>
      <p-iconfield iconPosition="left">
        <p-inputicon>
          <i class="pi pi-search"></i>
        </p-inputicon>
        <input 
          pInputText 
          type="text" 
          placeholder="Global search..."
          (input)="onGlobalSearch($event)">
      </p-iconfield>
    </div>
  </ng-template>
  
  <ng-template pTemplate="header">
    <tr>
      <th pSortableColumn="name">
        Name <p-sorticon field="name"></p-sorticon>
      </th>
      <th pSortableColumn="email">
        Email <p-sorticon field="email"></p-sorticon>
      </th>
      <th>Actions</th>
    </tr>
  </ng-template>
  
  <ng-template pTemplate="body" let-item let-index="rowIndex">
    <tr>
      <td>{{ item.name }}</td>
      <td>{{ item.email }}</td>
      <td>
        <div class="flex gap-2">
          <p-button 
            icon="pi pi-pencil" 
            size="small"
            [text]="true"
            (onClick)="edit(item)">
          </p-button>
          <p-button 
            icon="pi pi-trash" 
            size="small"
            [text]="true"
            severity="danger"
            (onClick)="delete(item)">
          </p-button>
        </div>
      </td>
    </tr>
  </ng-template>
</p-table>
```

### Dialog Component
```typescript
<p-dialog 
  [(visible)]="visible"
  [modal]="true"
  [closable]="true"
  [draggable]="false"
  [resizable]="false"
  header="Dialog Title"
  class="max-w-2xl">
  
  <ng-template pTemplate="header">
    <div class="flex items-center gap-2">
      <i class="pi pi-user"></i>
      <span>User Details</span>
    </div>
  </ng-template>
  
  <p>Dialog content goes here...</p>
  
  <ng-template pTemplate="footer">
    <div class="flex justify-end gap-2">
      <p-button 
        label="Cancel" 
        [text]="true"
        (onClick)="cancel()">
      </p-button>
      <p-button 
        label="Save" 
        (onClick)="save()">
      </p-button>
    </div>
  </ng-template>
</p-dialog>
```

## Theming & Styling (v20)

### Custom Theme Configuration
```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: 'system', // 'system', 'class', or false
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      }
    })
  ]
};
```

### CSS Custom Properties
```scss
:root {
  // Primary colors
  --p-primary-50: #eff6ff;
  --p-primary-100: #dbeafe;
  --p-primary-500: #3b82f6;
  --p-primary-600: #2563eb;
  --p-primary-700: #1d4ed8;
  
  // Surface colors
  --p-surface-0: #ffffff;
  --p-surface-50: #f8fafc;
  --p-surface-100: #f1f5f9;
  --p-surface-900: #0f172a;
  
  // Text colors
  --p-text-color: #334155;
  --p-text-muted-color: #64748b;
  
  // Border radius
  --p-border-radius: 8px;
  
  // Focus ring
  --p-focus-ring: 0 0 0 2px var(--p-primary-200);
}

// Dark mode
.dark-mode {
  --p-surface-0: #0f172a;
  --p-surface-50: #1e293b;
  --p-text-color: #f1f5f9;
}
```

## Accessibility Best Practices

### ARIA Labels and Descriptions
```typescript
// Proper accessibility implementation
<p-button 
  icon="pi pi-trash"
  ariaLabel="Delete user"
  [attr.aria-describedby]="'delete-description'"
  (onClick)="deleteUser()">
</p-button>
<span id="delete-description" class="sr-only">
  This action cannot be undone
</span>

// Form field accessibility
<div class="form-field">
  <label for="email" [attr.aria-required]="true">
    Email Address *
  </label>
  <p-inputtext
    id="email"
    formControlName="email"
    [attr.aria-invalid]="emailControl.invalid && emailControl.touched"
    [attr.aria-describedby]="emailControl.errors ? 'email-error' : null">
  </p-inputtext>
  
  @if (emailControl.errors && emailControl.touched) {
    <small id="email-error" role="alert" class="text-red-500">
      Email is required and must be valid
    </small>
  }
</div>
```

### Keyboard Navigation
```typescript
// Proper keyboard support
<div 
  class="interactive-element"
  tabindex="0"
  role="button"
  [attr.aria-pressed]="isPressed"
  (click)="handleClick()"
  (keydown.enter)="handleClick()"
  (keydown.space)="handleClick()">
  Custom Interactive Element
</div>
```

## Performance Optimization

### Virtual Scrolling
```typescript
<p-table 
  [value]="largeDataset()"
  [scrollable]="true"
  [virtualScroll]="true"
  [virtualScrollItemSize]="46"
  scrollHeight="400px">
  
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{ item.name }}</td>
      <td>{{ item.email }}</td>
    </tr>
  </ng-template>
</p-table>
```

### Lazy Loading
```typescript
<p-dropdown
  [options]="options"
  [lazy]="true"
  (onLazyLoad)="loadOptions($event)"
  [loading]="loading()">
</p-dropdown>
```

## Migration Notes (v19 → v20)

### Deprecated styleClass Usage
```typescript
// Old way (deprecated) ❌
<p-button styleClass="my-custom-class" label="Button"></p-button>
<p-dropdown styleClass="w-full" [options]="options"></p-dropdown>

// New way (v20) ✅
<p-button class="my-custom-class" label="Button"></p-button>
<p-dropdown class="w-full" [options]="options"></p-dropdown>
```

### Theme Package Update
```bash
# Old packages (remove)
npm uninstall @primeng/themes

# New packages (install)
npm install @primeuix/themes
```

### Invalid State Handling
```typescript
// Old way (automatic) ❌
// Relied on ng-invalid.ng-dirty classes

// New way (explicit control) ✅
<p-inputtext
  formControlName="email"
  [invalid]="emailControl.invalid && (emailControl.touched || formSubmitted)">
</p-inputtext>
```

## Do's and Don'ts (PrimeNG v20)

### Do's ✅
- Use native `class` attribute instead of `styleClass`
- Import individual component modules for tree shaking
- Use `@primeuix/themes` for theming
- Implement proper ARIA labels and descriptions
- Use signals for reactive state management
- Leverage virtual scrolling for large datasets
- Use proper form validation with `[invalid]` property
- Follow PrimeNG's template naming conventions (pTemplate)
- Use PrimeIcons for consistent iconography
- Implement proper loading states

### Don'ts ❌
- Don't use deprecated `styleClass` property
- Don't import entire PrimeNG library
- Don't use `@primeng/themes` (use `@primeuix/themes`)
- Don't rely on automatic ng-invalid.ng-dirty styling
- Don't forget accessibility attributes
- Don't use inline styles for theming (use CSS custom properties)
- Don't ignore keyboard navigation requirements
- Don't mix PrimeNG components with other UI libraries inconsistently
- Don't forget to handle loading and error states
- Don't use non-semantic HTML with PrimeNG components

## Common Patterns

### Service Integration
```typescript
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly messageService = inject(MessageService);
  
  showSuccess(message: string, title = 'Success'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000
    });
  }
  
  showError(message: string, title = 'Error'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 5000
    });
  }
  
  showInfo(message: string, title = 'Information'): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 4000
    });
  }
}
```

### Confirmation Dialog Pattern
```typescript
@Component({
  providers: [ConfirmationService]
})
export class ComponentWithConfirmation {
  private readonly confirmationService = inject(ConfirmationService);
  
  confirmDelete(item: any): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this item?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.performDelete(item);
      }
    });
  }
}
```