import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';

import { Character } from '../../../../models/character.model';
import { GreatVaultSummary } from '../../models/great-vault.model';
import { GreatVaultService } from '../../services/great-vault.service';
import { BlizzardApiService } from '../../../../services/blizzard-api.service';
import { BlizzardApiCredentialsService } from '../../../../services/blizzard-api-credentials.service';

@Component({
  selector: 'app-great-vault-summary',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    ProgressBarModule,
    SkeletonModule,
  ],
  templateUrl: './great-vault-summary.component.html',
  styleUrl: './great-vault-summary.component.scss'
})
export class GreatVaultSummaryComponent {
  private readonly greatVaultService = inject(GreatVaultService);
  private readonly blizzardApi = inject(BlizzardApiService);
  private readonly credentialsService = inject(BlizzardApiCredentialsService);

  // Inputs
  readonly character = input.required<Character>();

  // Internal state
  protected readonly loading = signal(false);
  protected readonly summary = signal<GreatVaultSummary | null>(null);

  // Computed properties
  protected readonly isTrackingAvailable = computed(() =>
    this.greatVaultService.isTrackingAvailable()
  );

  protected readonly hasCredentials = computed(() =>
    this.credentialsService.hasCredentials()
  );

  protected readonly timeUntilReset = computed(() =>
    this.greatVaultService.formatTimeUntilReset()
  );

  protected readonly progressPercentage = computed(() => {
    const sum = this.summary();
    return sum ? Math.round(sum.weeklyProgress * 100) : 0;
  });

  /**
   * Load summary data
   */
  protected loadSummary(): void {
    if (!this.isTrackingAvailable()) {
      return;
    }

    this.loading.set(true);

    this.greatVaultService.getCharacterGreatVaultProgress(this.character()).subscribe({
      next: (result) => {
        if (result.success && result.progress) {
          const summaryData = this.greatVaultService.createSummary(result.progress);
          this.summary.set(summaryData);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Get severity for vault slots
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
   * Get tooltip text for summary
   */
  protected getTooltipText(): string {
    const sum = this.summary();
    if (!sum) return 'Great Vault progress unavailable';

    return `Great Vault Progress:
• Mythic+: ${sum.mythicPlusSlots}/3 slots
• Raid: ${sum.raidSlots}/3 slots
• PvP: ${sum.pvpSlots}/3 slots
• Highest Reward: ${sum.highestItemLevel} ilvl
• Resets in: ${this.timeUntilReset()}`;
  }

  /**
   * Handle setup API button click
   */
  protected onSetupAPI(): void {
    if (this.hasCredentials()) {
      // Try to authenticate with existing credentials
      this.loading.set(true);
      this.blizzardApi.authenticate().subscribe({
        next: () => {
          console.log('Authentication successful!');
          this.loadSummary(); // Reload vault data
        },
        error: (error) => {
          console.error('Authentication failed:', error);
          this.showSetupInstructions();
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    } else {
      // Show setup instructions
      this.showSetupInstructions();
    }
  }

  /**
   * Show setup instructions for Blizzard API
   */
  private showSetupInstructions(): void {
    const instructions = `
To use Great Vault tracking, you need to set up Blizzard API credentials:

1. Go to https://develop.battle.net/
2. Create an account or sign in
3. Create a new "Client" application
4. Copy your Client ID and Client Secret
5. Go to Settings in this app and enter them in the Blizzard API section

Required scopes: wow.profile
Grant type: Client Credentials

For detailed instructions, visit:
https://community.developer.battle.net/documentation/guides/using-oauth
    `;

    alert(instructions.trim());
  }

  ngOnInit(): void {
    this.loadSummary();
  }
}