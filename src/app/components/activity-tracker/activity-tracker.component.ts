import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

import { ActivityStore } from '../../store/activity.store';
import { ActivityService, VaultProgress, GreatVaultReward } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { Activity, CharacterActivity, MythicPlusRun } from '../../models/activity.model';
import { ActivityType } from '../../enums/activity-type.enum';

@Component({
  selector: 'wow-activity-tracker',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    PanelModule,
    ProgressBarModule,
    BadgeModule,
    ButtonModule,
    TooltipModule,
    DividerModule,
    TagModule
  ],
  templateUrl: './activity-tracker.component.html',
  styleUrl: './activity-tracker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityTrackerComponent {
  private readonly activityStore = inject(ActivityStore);
  private readonly activityService = inject(ActivityService);

  // Constants
  protected readonly MYTHIC_LOOT_THRESHOLD = 10;

  // Component inputs
  readonly selectedCharacter = input<Character | null>(null);

  // Store data
  protected readonly activities = this.activityStore.activities;
  protected readonly loading = this.activityStore.loading;

  // Computed data for selected character

  protected readonly currentWeekActivities = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return null;

    const characterActivity = this.activities()[character.id];
    return characterActivity || null;
  });

  protected readonly vaultProgress = computed((): VaultProgress => {
    const characterActivity = this.currentWeekActivities();
    if (!characterActivity) {
      return { raid: 0, mythicPlus: 0, pvp: 0, total: 0 };
    }

    // Calculate M+ vault slots (1/4/8 dungeons for 1/2/3 slots)
    const mythicPlusSlots = characterActivity.mythicPlus.dungeonCount >= 8 ? 3 :
                           characterActivity.mythicPlus.dungeonCount >= 4 ? 2 :
                           characterActivity.mythicPlus.dungeonCount >= 1 ? 1 : 0;

    // Calculate raid vault slots (2/4/6 bosses for 1/2/3 slots)
    const totalBosses = characterActivity.raid.normalBossesKilled +
                       characterActivity.raid.heroicBossesKilled +
                       characterActivity.raid.mythicBossesKilled;

    const raidSlots = totalBosses >= 6 ? 3 :
                     totalBosses >= 4 ? 2 :
                     totalBosses >= 2 ? 1 : 0;

    return {
      raid: raidSlots,
      mythicPlus: mythicPlusSlots,
      pvp: 0,
      total: raidSlots + mythicPlusSlots
    };
  });

  protected readonly vaultProgressPercentage = computed(() => {
    const progress = this.vaultProgress();
    const maxSlots = 6; // 3 M+ + 3 Raid
    return Math.round((progress.total / maxSlots) * 100);
  });

  protected readonly projectedRewards = computed((): GreatVaultReward[] => {
    const characterActivity = this.currentWeekActivities();
    const rewards: GreatVaultReward[] = [];

    if (characterActivity && characterActivity.mythicPlus && characterActivity.mythicPlus.runs) {
      // Sort runs by key level (highest first) to determine vault rewards
      const sortedRuns = [...characterActivity.mythicPlus.runs].sort((a, b) => b.keyLevel - a.keyLevel);
      const count = characterActivity.mythicPlus.dungeonCount;

      // Add M+ rewards based on actual runs
      if (count >= 1 && sortedRuns[0]) {
        rewards.push({
          slot: 1,
          source: 'mythicPlus',
          itemLevel: sortedRuns[0].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 470 : 450,
          quality: sortedRuns[0].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 'Mythic' : 'Heroic'
        });
      }
      if (count >= 4 && sortedRuns[3]) {
        rewards.push({
          slot: 2,
          source: 'mythicPlus',
          itemLevel: sortedRuns[3].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 470 : 450,
          quality: sortedRuns[3].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 'Mythic' : 'Heroic'
        });
      }
      if (count >= 8 && sortedRuns[7]) {
        rewards.push({
          slot: 3,
          source: 'mythicPlus',
          itemLevel: sortedRuns[7].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 470 : 450,
          quality: sortedRuns[7].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 'Mythic' : 'Heroic'
        });
      }
    }

    // Add raid rewards (simplified)
    const progress = this.vaultProgress();
    for (let i = 1; i <= progress.raid; i++) {
      rewards.push({
        slot: i + 3,
        source: 'raid',
        itemLevel: 460,
        quality: 'Heroic'
      });
    }

    return rewards;
  });

  protected readonly activityStats = computed(() => {
    const characterActivity = this.currentWeekActivities();
    if (!characterActivity) {
      return {
        totalActivities: 0,
        mythicPlusCompleted: 0,
        raidsCompleted: 0,
        pvpMatches: 0,
        questsCompleted: 0,
        achievementsEarned: 0
      };
    }

    const totalBosses = characterActivity.raid.normalBossesKilled +
                       characterActivity.raid.heroicBossesKilled +
                       characterActivity.raid.mythicBossesKilled;

    const totalQuests = (characterActivity.weeklyQuests.worldBossCompleted ? 1 : 0) +
                       characterActivity.weeklyQuests.professionQuestsDone +
                       (characterActivity.weeklyQuests.weeklyEventCompleted ? 1 : 0);

    return {
      totalActivities: characterActivity.mythicPlus.dungeonCount + totalBosses + totalQuests,
      mythicPlusCompleted: characterActivity.mythicPlus.dungeonCount,
      raidsCompleted: totalBosses,
      pvpMatches: 0,
      questsCompleted: totalQuests,
      achievementsEarned: 0
    };
  });

  protected readonly weeklyProgress = computed(() => {
    const progress = this.vaultProgress();
    const maxSlots = 9; // Maximum vault slots available

    return {
      completedSlots: progress.total,
      maxSlots,
      percentage: Math.round((progress.total / maxSlots) * 100),
      raidProgress: Math.round((progress.raid / 3) * 100),
      mythicPlusProgress: Math.round((progress.mythicPlus / 3) * 100),
      pvpProgress: Math.round((progress.pvp / 3) * 100)
    };
  });

  protected readonly nextResetDate = computed(() => {
    return this.activityService.getNextResetDate();
  });

  protected readonly timeUntilReset = computed(() => {
    const resetDate = this.nextResetDate();
    const now = new Date();
    const timeDiff = resetDate.getTime() - now.getTime();

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  });

  // Utility methods for template
  protected getVaultSourceIcon(source: 'raid' | 'mythicPlus' | 'pvp'): string {
    switch (source) {
      case 'raid':
        return 'pi pi-trophy';
      case 'mythicPlus':
        return 'pi pi-compass';
      case 'pvp':
        return 'pi pi-flag';
      default:
        return 'pi pi-circle';
    }
  }

  protected getVaultSourceLabel(source: 'raid' | 'mythicPlus' | 'pvp'): string {
    switch (source) {
      case 'raid':
        return 'Raid';
      case 'mythicPlus':
        return 'Mythic+';
      case 'pvp':
        return 'PvP';
      default:
        return 'Unknown';
    }
  }

  protected getQualitySeverity(quality: 'Heroic' | 'Mythic'): 'info' | 'warn' | 'success' {
    switch (quality) {
      case 'Mythic':
        return 'warn';
      case 'Heroic':
        return 'info';
      default:
        return 'success';
    }
  }

  protected getProgressSeverity(percentage: number): 'success' | 'info' | 'warn' | 'danger' {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warn';
    return 'danger';
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }

  protected onRefreshData(): void {
    // Force refresh of activity data
    // In a real app, this might trigger a reload from an API
    console.log('Refreshing activity data...');
  }

  // Quick-add methods for Mythic+
  protected onAddHighLevelRun(): void {
    this.addQuickRun(this.MYTHIC_LOOT_THRESHOLD);
  }

  protected onAddLowLevelRun(): void {
    this.addQuickRun(this.MYTHIC_LOOT_THRESHOLD - 1);
  }

  private addQuickRun(keyLevel: number): void {
    const character = this.selectedCharacter();
    if (!character) {
      return;
    }

    const characterId = character.id;

    // Create the new run
    const newRun: MythicPlusRun = {
      keyLevel,
      timestamp: new Date()
    };

    // Add the run to the store
    this.activityStore.addMythicPlusRun(characterId, newRun);
  }
}