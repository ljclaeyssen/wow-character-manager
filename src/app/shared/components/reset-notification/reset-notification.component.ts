import { Component, computed, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { ResetService, ResetInfo } from '../../../services/reset.service';
import { NotificationService } from '../../../services/notification.service';

interface ResetNotificationState {
  isVisible: boolean;
  type: 'info' | 'warn' | 'success' | 'error';
  severity: 'info' | 'warn' | 'success' | 'error';
  autoHide: boolean;
  showManualReset: boolean;
}

@Component({
  selector: 'app-reset-notification',
  standalone: true,
  imports: [
    CommonModule,
    MessageModule,
    ToastModule,
    ButtonModule,
    CardModule,
    TagModule
  ],
  templateUrl: './reset-notification.component.html',
  styleUrl: './reset-notification.component.scss'
})
export class ResetNotificationComponent implements OnInit, OnDestroy {
  private readonly resetService = inject(ResetService);
  private readonly notificationService = inject(NotificationService);
  private readonly messageService = inject(MessageService);

  // Component state
  protected readonly resetInfo = signal<ResetInfo | null>(null);
  protected readonly notificationState = signal<ResetNotificationState>({
    isVisible: false,
    type: 'info',
    severity: 'info',
    autoHide: true,
    showManualReset: false
  });

  protected readonly isLoading = signal<boolean>(false);
  protected readonly lastResetTriggered = signal<Date | null>(null);

  // Subscriptions
  private countdownSubscription?: Subscription;
  private resetEventSubscription?: Subscription;

  // Computed properties
  protected readonly timeUntilReset = computed(() => {
    const info = this.resetInfo();
    if (!info) return '';
    return this.resetService.getFormattedTimeUntilReset();
  });

  protected readonly resetStatusMessage = computed(() => {
    const info = this.resetInfo();
    if (!info) return '';
    return this.resetService.getResetStatusMessage();
  });

  protected readonly countdownDisplay = computed(() => {
    const info = this.resetInfo();
    if (!info) return { days: 0, hours: 0, minutes: 0 };

    return {
      days: info.daysUntilReset,
      hours: info.hoursUntilReset,
      minutes: info.minutesUntilReset
    };
  });

  protected readonly resetSeverity = computed((): 'success' | 'info' | 'warn' | 'danger' => {
    const info = this.resetInfo();
    if (!info) return 'info';

    if (info.isResetDay) return 'danger';
    if (info.daysUntilReset === 0) return 'warn';
    if (info.daysUntilReset === 1) return 'info';
    return 'success';
  });

  protected readonly shouldShowNotification = computed(() => {
    const info = this.resetInfo();
    const state = this.notificationState();

    if (!info || !state.isVisible) return false;

    // Show if it's reset day or within 24 hours
    return info.isResetDay || this.resetService.shouldNotifyUpcomingReset();
  });

  protected readonly canManualReset = computed(() => {
    const info = this.resetInfo();
    const daysSinceReset = this.resetService.getDaysSinceReset();

    // Allow manual reset if more than 6 days since last reset or if it's currently reset time
    return daysSinceReset >= 6 || (info?.isResetDay ?? false);
  });

  // Effects
  private readonly notificationEffect = effect(() => {
    const info = this.resetInfo();
    if (!info) return;

    this.updateNotificationState(info);
  });

  ngOnInit(): void {
    this.initializeResetTracking();
    this.subscribeToResetEvents();
    this.startPeriodicChecks();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // Initialization
  private initializeResetTracking(): void {
    try {
      // Get initial reset information
      const initialResetInfo = this.resetService.getResetInfo();
      this.resetInfo.set(initialResetInfo);

      // Set initial notification state
      this.notificationState.update(state => ({
        ...state,
        isVisible: this.shouldShowInitialNotification(initialResetInfo),
        showManualReset: this.resetService.isCurrentlyResetTime()
      }));

    } catch (error) {
      console.error('Failed to initialize reset tracking:', error);
      this.notificationService.showError('Failed to initialize weekly reset tracking');
    }
  }

  private subscribeToResetEvents(): void {
    // Subscribe to countdown updates
    this.countdownSubscription = this.resetService.getResetCountdown$().subscribe({
      next: (resetInfo) => {
        this.resetInfo.set(resetInfo);
      },
      error: (error) => {
        console.error('Reset countdown error:', error);
        this.notificationService.showError('Failed to update reset countdown');
      }
    });

    // Subscribe to reset events
    this.resetEventSubscription = this.resetService.resetEvent$.subscribe({
      next: () => {
        this.handleResetEvent();
      },
      error: (error) => {
        console.error('Reset event error:', error);
      }
    });
  }

  private startPeriodicChecks(): void {
    // Start periodic reset checks
    this.resetService.startPeriodicResetCheck();
  }

  // Event handlers
  private handleResetEvent(): void {
    this.lastResetTriggered.set(new Date());

    // Show reset notification
    this.showResetCompletedToast();

    // Update notification state
    this.notificationState.update(state => ({
      ...state,
      type: 'success',
      severity: 'success',
      isVisible: true,
      autoHide: false
    }));
  }

  protected onManualResetClick(): void {
    if (!this.canManualReset()) {
      this.notificationService.showWarning('Manual reset is not available yet');
      return;
    }

    this.isLoading.set(true);

    try {
      // Trigger manual reset
      this.resetService.triggerManualReset();

      // Show success message
      this.notificationService.showSuccess('Weekly reset triggered manually');

      // Update state
      this.lastResetTriggered.set(new Date());

    } catch (error) {
      console.error('Manual reset failed:', error);
      this.notificationService.showError('Failed to trigger manual reset');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onDismissNotification(): void {
    this.notificationState.update(state => ({
      ...state,
      isVisible: false
    }));
  }

  protected onShowNotification(): void {
    this.notificationState.update(state => ({
      ...state,
      isVisible: true
    }));
  }

  protected onShowResetInfo(): void {
    const info = this.resetInfo();
    if (!info) return;

    const daysSinceReset = this.resetService.getDaysSinceReset();
    const message = `
      Current Week: Day ${daysSinceReset + 1} of 7
      Next Reset: ${info.nextResetDate.toLocaleString()}
      Time Until Reset: ${this.timeUntilReset()}
    `;

    this.messageService.add({
      severity: 'info',
      summary: 'Weekly Reset Information',
      detail: message,
      life: 8000
    });
  }

  // Helper methods
  private updateNotificationState(resetInfo: ResetInfo): void {
    let type: 'info' | 'warn' | 'success' | 'error' = 'info';
    let autoHide = true;
    let isVisible = false;

    if (resetInfo.isResetDay) {
      type = 'warn';
      isVisible = true;
      autoHide = false;
    } else if (resetInfo.daysUntilReset === 0) {
      type = 'warn';
      isVisible = true;
    } else if (resetInfo.daysUntilReset === 1) {
      type = 'info';
      isVisible = true;
    } else if (this.resetService.shouldNotifyUpcomingReset()) {
      type = 'info';
      isVisible = true;
    }

    this.notificationState.update(state => ({
      ...state,
      type,
      severity: type,
      isVisible,
      autoHide,
      showManualReset: this.resetService.isCurrentlyResetTime()
    }));
  }

  private shouldShowInitialNotification(resetInfo: ResetInfo): boolean {
    // Show notification if within 2 days of reset or if it's reset day
    return resetInfo.daysUntilReset <= 2 || resetInfo.isResetDay;
  }

  private showResetCompletedToast(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Weekly Reset Complete!',
      detail: 'All weekly activities have been reset. Good luck with your runs!',
      life: 10000,
      sticky: false
    });
  }

  private cleanup(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
    if (this.resetEventSubscription) {
      this.resetEventSubscription.unsubscribe();
    }
  }

  // Template helpers
  protected getNotificationIcon(): string {
    const severity = this.resetSeverity();
    switch (severity) {
      case 'danger': return 'pi pi-exclamation-triangle';
      case 'warn': return 'pi pi-clock';
      case 'info': return 'pi pi-info-circle';
      case 'success': return 'pi pi-check-circle';
      default: return 'pi pi-info-circle';
    }
  }

  protected getCountdownColor(): string {
    const info = this.resetInfo();
    if (!info) return 'blue';

    if (info.isResetDay) return 'red';
    if (info.daysUntilReset === 0) return 'orange';
    if (info.daysUntilReset === 1) return 'yellow';
    return 'green';
  }
}