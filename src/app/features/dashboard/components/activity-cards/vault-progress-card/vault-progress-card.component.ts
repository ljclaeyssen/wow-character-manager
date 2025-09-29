import { ChangeDetectionStrategy, Component, computed, input, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { VaultRewardsCalculatorService, VaultRewards } from '../../../../../services/vault-rewards-calculator.service';
import { Character } from '../../../../../models/character.model';

@Component({
  selector: 'wow-vault-progress-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    MessageModule,
    DividerModule,
    ProgressBarModule,
    ButtonModule
  ],
  templateUrl: './vault-progress-card.component.html',
  styleUrl: './vault-progress-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VaultProgressCardComponent {
  private readonly vaultRewardsCalculator = inject(VaultRewardsCalculatorService);

  // Inputs
  readonly character = input<Character | null>(null);

  // State
  private readonly vaultRewards = signal<VaultRewards | null>(null);
  protected readonly loading = signal(false);
  protected readonly lastUpdateTime = signal<Date | null>(null);

  constructor() {
    // Load vault rewards when character changes
    effect(() => {
      const char = this.character();
      if (char) {
        this.loadVaultRewards(char);
        // Update last update time when character loads
        const lastUpdate = this.vaultRewardsCalculator.getLastUpdateTime(char);
        this.lastUpdateTime.set(lastUpdate);
      } else {
        this.vaultRewards.set(null);
        this.lastUpdateTime.set(null);
      }
    });
  }

  // Computed properties
  protected readonly mythicPlusVaultProgress = computed(() => {
    const rewards = this.vaultRewards();
    return rewards?.mythicPlus || {
      slots: 0,
      slotRewards: ['No reward', 'No reward', 'No reward'],
      nextMilestone: { remaining: 1 }
    };
  });

  protected readonly raidVaultProgress = computed(() => {
    const rewards = this.vaultRewards();
    return rewards?.raid || {
      slots: 0,
      slotRewards: ['No reward', 'No reward', 'No reward'],
      nextMilestone: { remaining: 2 }
    };
  });

  protected readonly isLoaded = computed(() => {
    const rewards = this.vaultRewards();
    return rewards?.success ?? false;
  });

  protected readonly errorMessage = computed(() => {
    const rewards = this.vaultRewards();
    return rewards?.error ?? null;
  });

  // Actions
  protected onRefreshData(): void {
    const char = this.character();
    if (char) {
      this.loadVaultRewards(char, true); // Force refresh
    }
  }

  // Private methods
  private loadVaultRewards(character: Character, forceRefresh: boolean = false): void {
    this.loading.set(true);

    this.vaultRewardsCalculator.calculateVaultRewards(character, forceRefresh).subscribe({
      next: (rewards) => {
        this.vaultRewards.set(rewards);
        this.loading.set(false);
        // Update last update time
        const lastUpdate = this.vaultRewardsCalculator.getLastUpdateTime(character);
        this.lastUpdateTime.set(lastUpdate);
      },
      error: (error) => {
        console.error('Error loading vault rewards:', error);
        this.vaultRewards.set({
          mythicPlus: {
            slots: 0,
            slot1: { unlocked: false, quality: 'No reward', itemLevel: 0 },
            slot2: { unlocked: false, quality: 'No reward', itemLevel: 0 },
            slot3: { unlocked: false, quality: 'No reward', itemLevel: 0 },
            nextMilestone: { remaining: 1 },
            slotRewards: ['No reward', 'No reward', 'No reward']
          },
          raid: {
            slots: 0,
            slot1: { unlocked: false, quality: 'No reward', itemLevel: 0 },
            slot2: { unlocked: false, quality: 'No reward', itemLevel: 0 },
            slot3: { unlocked: false, quality: 'No reward', itemLevel: 0 },
            nextMilestone: { remaining: 2 },
            slotRewards: ['No reward', 'No reward', 'No reward']
          },
          success: false,
          error: 'Failed to load vault rewards'
        });
        this.loading.set(false);
      }
    });
  }

  // Helper method for tag severity
  protected getTagSeverity(reward: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (reward) {
      case 'Mythic': return 'warning';
      case 'Heroic': return 'info';
      case 'Normal': return 'success';
      case 'LFR': return 'secondary';
      default: return 'secondary';
    }
  }

  // Progress calculation helpers
  protected calculateMythicPlusProgress(): number {
    const progress = this.mythicPlusVaultProgress();
    return Math.round((progress.slots / 3) * 100);
  }

  protected calculateRaidProgress(): number {
    const progress = this.raidVaultProgress();
    return Math.round((progress.slots / 3) * 100);
  }

  // Helper method to format last update time
  protected formatLastUpdate(): string {
    const lastUpdate = this.lastUpdateTime();
    if (!lastUpdate) {
      return 'Never updated';
    }

    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
}