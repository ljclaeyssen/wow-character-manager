import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { NotificationService } from '../../../../services/notification.service';
import { BlizzardApiCredentialsService } from '../../../../services/blizzard-api-credentials.service';

interface BlizzardCredentials {
  clientId: string;
  clientSecret: string;
}

interface BlizzardCredentialsFormControls {
  clientId: FormControl<string>;
  clientSecret: FormControl<string>;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    TooltipModule,
    DividerModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly credentialsService = inject(BlizzardApiCredentialsService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly credentialsForm = new FormGroup<BlizzardCredentialsFormControls>({
    clientId: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^[a-zA-Z0-9]+$/)
      ]
    }),
    clientSecret: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^[a-zA-Z0-9]+$/)
      ]
    })
  });

  protected readonly hasCredentials = computed(() => this.credentialsService.hasCredentials());
  protected readonly formValiditySignal = signal(false);
  protected readonly isFormValid = computed(() => this.formValiditySignal());
  protected readonly isFormDirty = computed(() => this.credentialsForm.dirty);

  constructor() {
    this.loadExistingCredentials();
    this.setupFormValidityTracking();
  }

  protected onSaveCredentials(): void {
    if (!this.credentialsForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const formValue = this.credentialsForm.value;
      const credentials: BlizzardCredentials = {
        clientId: formValue.clientId || '',
        clientSecret: formValue.clientSecret || ''
      };

      const success = this.credentialsService.saveCredentials(credentials);

      if (success) {
        this.notificationService.showSuccess('Blizzard API credentials saved successfully');
        this.credentialsForm.markAsPristine();
      } else {
        this.error.set('Failed to save credentials to local storage');
        this.notificationService.showError('Failed to save credentials');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.error.set(errorMessage);
      this.notificationService.showError(`Error saving credentials: ${errorMessage}`);
    } finally {
      this.loading.set(false);
    }
  }

  protected onClearCredentials(): void {
    this.loading.set(true);

    try {
      const success = this.credentialsService.clearCredentials();

      if (success) {
        this.credentialsForm.reset();
        this.credentialsForm.markAsPristine();
        this.error.set(null);
        this.notificationService.showSuccess('Blizzard API credentials cleared');
      } else {
        this.notificationService.showError('Failed to clear credentials');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.notificationService.showError(`Error clearing credentials: ${errorMessage}`);
    } finally {
      this.loading.set(false);
    }
  }

  protected getFieldError(fieldName: keyof BlizzardCredentialsFormControls): string | null {
    const field = this.credentialsForm.get(fieldName);
    if (!field || !field.touched || !field.errors) {
      return null;
    }

    if (field.errors['required']) {
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }

    if (field.errors['minlength']) {
      return `${this.getFieldDisplayName(fieldName)} must be at least 10 characters`;
    }

    if (field.errors['pattern']) {
      return `${this.getFieldDisplayName(fieldName)} must contain only alphanumeric characters`;
    }

    return 'Invalid value';
  }

  private loadExistingCredentials(): void {
    const existingCredentials = this.credentialsService.getCredentials();
    if (existingCredentials) {
      this.credentialsForm.patchValue({
        clientId: existingCredentials.clientId,
        clientSecret: existingCredentials.clientSecret
      });
      this.credentialsForm.markAsPristine();
    }
    // Update form validity signal after loading
    this.formValiditySignal.set(this.credentialsForm.valid);
  }

  private setupFormValidityTracking(): void {
    // Update validity signal whenever form status changes
    this.credentialsForm.statusChanges.subscribe(() => {
      this.formValiditySignal.set(this.credentialsForm.valid);
    });

    // Also update on value changes to ensure real-time updates
    this.credentialsForm.valueChanges.subscribe(() => {
      this.formValiditySignal.set(this.credentialsForm.valid);
    });

    // Set initial validity
    this.formValiditySignal.set(this.credentialsForm.valid);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.credentialsForm.controls).forEach(key => {
      const control = this.credentialsForm.get(key as keyof BlizzardCredentialsFormControls);
      control?.markAsTouched();
    });
  }

  private getFieldDisplayName(fieldName: keyof BlizzardCredentialsFormControls): string {
    switch (fieldName) {
      case 'clientId':
        return 'Client ID';
      case 'clientSecret':
        return 'Client Secret';
      default:
        return 'Field';
    }
  }
}