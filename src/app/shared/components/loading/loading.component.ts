import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

export type LoadingType = 'fullscreen' | 'inline' | 'skeleton' | 'overlay' | 'button';
export type LoadingSize = 'small' | 'medium' | 'large';

export interface LoadingConfig {
  type: LoadingType;
  size: LoadingSize;
  message?: string;
  showCancelButton?: boolean;
  timeoutMs?: number;
  overlay?: boolean;
  transparent?: boolean;
}

export interface SkeletonConfig {
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
  showText?: boolean;
  animationDuration?: string;
}

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
    SkeletonModule,
    CardModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingComponent implements OnInit, OnDestroy {
  // Input properties
  readonly loading = input<boolean>(false);
  readonly config = input<Partial<LoadingConfig>>({});
  readonly skeletonConfig = input<Partial<SkeletonConfig>>({});

  // Output events
  readonly cancelled = output<void>();
  readonly timeout = output<void>();

  // Component state
  private readonly _startTime = signal<number | null>(null);
  private readonly _timeoutId = signal<number | null>(null);
  protected readonly timedOut = signal(false);

  // Default configurations
  private readonly defaultConfig: LoadingConfig = {
    type: 'inline',
    size: 'medium',
    message: 'Loading...',
    showCancelButton: false,
    timeoutMs: 30000, // 30 seconds default timeout
    overlay: false,
    transparent: false
  };

  private readonly defaultSkeletonConfig: SkeletonConfig = {
    rows: 3,
    columns: 1,
    showAvatar: true,
    showText: true,
    animationDuration: '2s'
  };

  // Computed properties
  protected readonly effectiveConfig = computed(() => ({
    ...this.defaultConfig,
    ...this.config()
  }));

  protected readonly effectiveSkeletonConfig = computed(() => ({
    ...this.defaultSkeletonConfig,
    ...this.skeletonConfig()
  }));

  protected readonly spinnerSize = computed(() => {
    const size = this.effectiveConfig().size;
    switch (size) {
      case 'small': return '24px';
      case 'large': return '48px';
      default: return '32px';
    }
  });

  protected readonly elapsedTime = computed(() => {
    const startTime = this._startTime();
    if (!startTime || !this.loading()) return 0;
    return Date.now() - startTime;
  });

  protected readonly shouldShowTimeout = computed(() => {
    const config = this.effectiveConfig();
    return this.timedOut() && config.timeoutMs && config.timeoutMs > 0;
  });

  ngOnInit(): void {
    // Start tracking when loading begins
    if (this.loading()) {
      this.startLoading();
    }
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }

  // Lifecycle methods for loading state
  private startLoading(): void {
    this._startTime.set(Date.now());
    this.timedOut.set(false);
    this.setupTimeout();
  }

  private stopLoading(): void {
    this._startTime.set(null);
    this.timedOut.set(false);
    this.clearTimeout();
  }

  private setupTimeout(): void {
    const config = this.effectiveConfig();
    if (config.timeoutMs && config.timeoutMs > 0) {
      const timeoutId = window.setTimeout(() => {
        this.timedOut.set(true);
        this.timeout.emit();
      }, config.timeoutMs);

      this._timeoutId.set(timeoutId);
    }
  }

  private clearTimeout(): void {
    const timeoutId = this._timeoutId();
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      this._timeoutId.set(null);
    }
  }

  // Watch for loading state changes
  protected readonly loadingEffect = computed(() => {
    const isLoading = this.loading();

    if (isLoading) {
      if (!this._startTime()) {
        this.startLoading();
      }
    } else {
      if (this._startTime()) {
        this.stopLoading();
      }
    }

    return isLoading;
  });

  // Event handlers
  protected cancel(): void {
    this.cancelled.emit();
    this.stopLoading();
  }

  protected retry(): void {
    this.timedOut.set(false);
    if (this.loading()) {
      this.startLoading();
    }
  }

  // Utility methods
  protected formatElapsedTime(): string {
    const elapsed = this.elapsedTime();
    if (elapsed < 1000) return `${elapsed}ms`;

    const seconds = Math.floor(elapsed / 1000);
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  protected getLoadingMessage(): string {
    const config = this.effectiveConfig();
    const baseMessage = config.message || 'Loading...';

    if (this.timedOut()) {
      return 'Operation timed out';
    }

    if (this.elapsedTime() > 5000) {
      return `${baseMessage} (${this.formatElapsedTime()})`;
    }

    return baseMessage;
  }

  protected generateSkeletonRows(): Array<{ width: string, height: string }> {
    const config = this.effectiveSkeletonConfig();
    const rows: Array<{ width: string, height: string }> = [];

    for (let i = 0; i < (config.rows || 3); i++) {
      const isLast = i === (config.rows || 3) - 1;
      const width = isLast ? '60%' : '100%';
      rows.push({
        width,
        height: '1rem'
      });
    }

    return rows;
  }

  protected generateTableColumns(): number[] {
    const config = this.effectiveSkeletonConfig();
    return Array.from({ length: config.columns || 3 }, (_, i) => i);
  }

  protected generateTableRows(): number[] {
    const config = this.effectiveSkeletonConfig();
    return Array.from({ length: config.rows || 3 }, (_, i) => i);
  }

  protected getSpinnerStyleClass(): string {
    const config = this.effectiveConfig();
    const classes = ['loading-spinner'];

    classes.push(`spinner-${config.size}`);

    if (config.type === 'fullscreen') {
      classes.push('spinner-fullscreen');
    } else if (config.type === 'overlay') {
      classes.push('spinner-overlay');
    }

    return classes.join(' ');
  }

  protected getContainerStyleClass(): string {
    const config = this.effectiveConfig();
    const classes = ['loading-container'];

    classes.push(`loading-${config.type}`);

    if (config.overlay) {
      classes.push('loading-overlay');
    }

    if (config.transparent) {
      classes.push('loading-transparent');
    }

    return classes.join(' ');
  }
}