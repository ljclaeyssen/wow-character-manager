import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

export interface AppError {
  id: string;
  type: 'network' | 'validation' | 'system' | 'user' | 'unknown';
  severity: 'error' | 'warn' | 'info';
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
  recoverable?: boolean;
  retryAction?: () => void;
  dismissible?: boolean;
}

export interface ErrorDisplayConfig {
  mode: 'inline' | 'modal';
  showDetails: boolean;
  showTimestamp: boolean;
  autoHide: boolean;
  autoHideDelay: number;
  maxErrors: number;
}

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    MessageModule,
    DialogModule,
    CardModule,
    DividerModule
  ],
  templateUrl: './error-display.component.html',
  styleUrl: './error-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorDisplayComponent {
  // Input properties
  readonly errors = input<AppError[]>([]);
  readonly config = input<Partial<ErrorDisplayConfig>>({});

  // Output events
  readonly errorDismissed = output<string>();
  readonly errorRetried = output<AppError>();
  readonly allErrorsCleared = output<void>();
  readonly errorReported = output<AppError>();

  // Component state
  protected readonly selectedError = signal<AppError | null>(null);
  protected readonly modalVisible = signal(false);
  protected readonly expandedErrors = signal<Set<string>>(new Set());

  // Default configuration
  private readonly defaultConfig: ErrorDisplayConfig = {
    mode: 'inline',
    showDetails: true,
    showTimestamp: true,
    autoHide: false,
    autoHideDelay: 5000,
    maxErrors: 10
  };

  // Computed properties
  protected readonly effectiveConfig = computed(() => ({
    ...this.defaultConfig,
    ...this.config()
  }));

  protected readonly displayErrors = computed(() => {
    const errors = this.errors();
    const config = this.effectiveConfig();

    // Limit number of errors displayed
    const limitedErrors = errors.slice(0, config.maxErrors);

    // Sort by timestamp (newest first)
    return limitedErrors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  protected readonly hasErrors = computed(() => this.displayErrors().length > 0);

  protected readonly errorCount = computed(() => this.errors().length);

  protected readonly criticalErrors = computed(() =>
    this.displayErrors().filter(error => error.severity === 'error')
  );

  protected readonly warningErrors = computed(() =>
    this.displayErrors().filter(error => error.severity === 'warn')
  );

  protected readonly infoErrors = computed(() =>
    this.displayErrors().filter(error => error.severity === 'info')
  );

  // Error display methods
  protected showErrorModal(error: AppError): void {
    this.selectedError.set(error);
    this.modalVisible.set(true);
  }

  protected hideErrorModal(): void {
    this.modalVisible.set(false);
    this.selectedError.set(null);
  }

  protected toggleErrorDetails(errorId: string): void {
    this.expandedErrors.update(expanded => {
      const newExpanded = new Set(expanded);
      if (newExpanded.has(errorId)) {
        newExpanded.delete(errorId);
      } else {
        newExpanded.add(errorId);
      }
      return newExpanded;
    });
  }

  protected isErrorExpanded(errorId: string): boolean {
    return this.expandedErrors().has(errorId);
  }

  // Error actions
  protected dismissError(errorId: string): void {
    this.errorDismissed.emit(errorId);
  }

  protected retryError(error: AppError): void {
    if (error.retryAction) {
      try {
        error.retryAction();
        this.errorRetried.emit(error);
      } catch (retryError) {
        console.error('Error during retry:', retryError);
      }
    }
  }

  protected reportError(error: AppError): void {
    this.errorReported.emit(error);
  }

  protected clearAllErrors(): void {
    this.allErrorsCleared.emit();
  }

  // Utility methods
  protected getErrorIcon(error: AppError): string {
    switch (error.type) {
      case 'network':
        return 'pi pi-wifi';
      case 'validation':
        return 'pi pi-exclamation-triangle';
      case 'system':
        return 'pi pi-cog';
      case 'user':
        return 'pi pi-user';
      default:
        return 'pi pi-exclamation-circle';
    }
  }

  protected getErrorSeverityClass(severity: string): string {
    switch (severity) {
      case 'error':
        return 'error-critical';
      case 'warn':
        return 'error-warning';
      case 'info':
        return 'error-info';
      default:
        return 'error-unknown';
    }
  }

  protected getErrorTypeLabel(type: string): string {
    switch (type) {
      case 'network':
        return 'Network Error';
      case 'validation':
        return 'Validation Error';
      case 'system':
        return 'System Error';
      case 'user':
        return 'User Error';
      default:
        return 'Unknown Error';
    }
  }

  protected formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  protected copyErrorToClipboard(error: AppError): void {
    const errorText = this.formatErrorForClipboard(error);

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(errorText).then(() => {
        console.log('Error copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy error to clipboard:', err);
        this.fallbackCopyToClipboard(errorText);
      });
    } else {
      this.fallbackCopyToClipboard(errorText);
    }
  }

  private formatErrorForClipboard(error: AppError): string {
    const parts = [
      `Error ID: ${error.id}`,
      `Type: ${this.getErrorTypeLabel(error.type)}`,
      `Severity: ${error.severity.toUpperCase()}`,
      `Title: ${error.title}`,
      `Message: ${error.message}`,
      `Timestamp: ${error.timestamp.toISOString()}`
    ];

    if (error.details) {
      parts.push(`Details: ${error.details}`);
    }

    if (error.context) {
      parts.push(`Context: ${JSON.stringify(error.context, null, 2)}`);
    }

    return parts.join('\n');
  }

  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('Error copied to clipboard (fallback)');
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
  }

  // Error recovery suggestions
  protected getRecoveryActions(error: AppError): Array<{label: string, action: () => void, icon: string}> {
    const actions: Array<{label: string, action: () => void, icon: string}> = [];

    // Add retry action if available
    if (error.retryAction) {
      actions.push({
        label: 'Retry',
        action: () => this.retryError(error),
        icon: 'pi pi-refresh'
      });
    }

    // Add type-specific recovery actions
    switch (error.type) {
      case 'network':
        actions.push({
          label: 'Check Connection',
          action: () => this.checkNetworkConnection(),
          icon: 'pi pi-wifi'
        });
        break;
      case 'validation':
        actions.push({
          label: 'Review Input',
          action: () => this.focusOnValidationError(error),
          icon: 'pi pi-search'
        });
        break;
      case 'system':
        actions.push({
          label: 'Reload Page',
          action: () => window.location.reload(),
          icon: 'pi pi-refresh'
        });
        break;
    }

    // Always add copy and report actions
    actions.push({
      label: 'Copy Details',
      action: () => this.copyErrorToClipboard(error),
      icon: 'pi pi-copy'
    });

    actions.push({
      label: 'Report Issue',
      action: () => this.reportError(error),
      icon: 'pi pi-send'
    });

    return actions;
  }

  private checkNetworkConnection(): void {
    if (navigator.onLine) {
      // Perform a simple network test
      fetch('/assets/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
        .then(() => {
          console.log('Network connection appears to be working');
        })
        .catch(() => {
          console.log('Network connection issues detected');
        });
    } else {
      console.log('Device appears to be offline');
    }
  }

  private focusOnValidationError(error: AppError): void {
    // Try to focus on the element that caused the validation error
    if (error.context?.['elementId']) {
      const element = document.getElementById(error.context['elementId']);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}