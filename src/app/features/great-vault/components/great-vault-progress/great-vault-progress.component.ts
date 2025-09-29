import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

import { Character } from '../../../../models/character.model';
import { GreatVaultProgress, GreatVaultSummary } from '../../models/great-vault.model';
import { GreatVaultService } from '../../services/great-vault.service';
import { VaultSlotComponent } from '../vault-slot/vault-slot.component';

@Component({
  selector: 'app-great-vault-progress',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    MessageModule,
    DividerModule,
    VaultSlotComponent,
  ],
  templateUrl: './great-vault-progress.component.html',
  styleUrl: './great-vault-progress.component.scss'
})
export class GreatVaultProgressComponent {
  private readonly greatVaultService = inject(GreatVaultService);

  // Inputs
  readonly character = input.required<Character>();

  // Internal state
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly progress = signal<GreatVaultProgress | null>(null);

  // Computed properties
  protected readonly isTrackingAvailable = computed(() =>
    this.greatVaultService.isTrackingAvailable()
  );

  protected readonly summary = computed(() => {
    const prog = this.progress();
    return prog ? this.greatVaultService.createSummary(prog) : null;
  });

  protected readonly weeklyReset = computed(() =>
    this.greatVaultService.getWeeklyResetInfo()
  );

  protected readonly timeUntilReset = computed(() =>
    this.greatVaultService.formatTimeUntilReset()
  );

  protected readonly hasProgress = computed(() => {
    const prog = this.progress();
    return prog && prog.totalSlots > 0;
  });

  protected readonly progressPercentage = computed(() => {
    const sum = this.summary();
    return sum ? Math.round(sum.weeklyProgress * 100) : 0;
  });

  /**
   * Refresh Great Vault data
   */
  protected onRefresh(): void {
    this.loading.set(true);
    this.error.set(null);

    this.greatVaultService.getCharacterGreatVaultProgress(this.character()).subscribe({
      next: (result) => {
        if (result.success && result.progress) {
          this.progress.set(result.progress);
        } else {
          this.error.set(result.error || 'Failed to load Great Vault data');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Network error occurred');
        this.loading.set(false);
        console.error('Great Vault refresh error:', err);
      }
    });
  }

  /**
   * Setup authentication and load data
   */
  protected onSetupApi(): void {
    this.loading.set(true);
    this.error.set(null);

    this.greatVaultService.ensureAuthentication().subscribe({
      next: (authenticated) => {
        if (authenticated) {
          this.onRefresh();
        } else {
          this.error.set('Failed to authenticate with Blizzard API. Check your credentials in Settings.');
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.error.set('Authentication failed');
        this.loading.set(false);
        console.error('Authentication error:', err);
      }
    });
  }

  /**
   * Clear error state
   */
  protected onClearError(): void {
    this.error.set(null);
  }

  /**
   * Get severity for total slots tag
   */
  protected getSlotsSeverity(slots: number): 'success' | 'info' | 'warn' | 'danger' {
    if (slots >= 7) return 'success';
    if (slots >= 5) return 'info';
    if (slots >= 3) return 'warn';
    return 'danger';
  }

  /**
   * Get progress bar severity
   */
  protected getProgressSeverity(percentage: number): 'success' | 'info' | 'warn' | 'danger' {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'info';
    if (percentage >= 25) return 'warn';
    return 'danger';
  }

  /**
   * Format raid boss details
   */
  protected getRaidDetails(): string {
    const prog = this.progress();
    if (!prog) return '';

    const uniqueBosses = prog.raids.uniqueBossCount;
    const difficulty = prog.raids.highestDifficulty;

    return uniqueBosses > 0
      ? `${uniqueBosses} bosses (${difficulty.toUpperCase()})`
      : 'No bosses killed';
  }

  /**
   * Format Mythic+ details
   */
  protected getMythicPlusDetails(): string {
    const prog = this.progress();
    if (!prog) return '';

    const dungeons = prog.mythicPlus.completedDungeons;
    const highestKey = prog.mythicPlus.highestKeyLevel;

    return dungeons > 0
      ? `${dungeons} dungeons (highest +${highestKey})`
      : 'No dungeons completed';
  }

  /**
   * Initialize component
   */
  ngOnInit(): void {
    if (this.isTrackingAvailable()) {
      this.onRefresh();
    }
  }
}