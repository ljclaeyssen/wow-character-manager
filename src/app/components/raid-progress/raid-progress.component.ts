import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { Activity } from '../../models/activity.model';
import { ActivityType } from '../../enums/activity-type.enum';

interface RaidDifficultyOption {
  label: string;
  value: string;
  color: string;
}

interface RaidBossKill {
  raidName: string;
  bossName: string;
  difficulty: string;
  date: Date;
}

@Component({
  selector: 'wow-raid-progress',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    ProgressBarModule,
    BadgeModule,
    TooltipModule,
    DividerModule,
    PanelModule,
    TagModule,
    MessageModule
  ],
  templateUrl: './raid-progress.component.html',
  styleUrl: './raid-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RaidProgressComponent {
  private readonly activityStore = inject(ActivityStore);
  private readonly activityService = inject(ActivityService);

  // Component inputs and outputs
  readonly selectedCharacter = input<Character | null>(null);
  readonly activityAdded = output<Activity>();

  // Store data
  protected readonly activities = this.activityStore.activities;
  protected readonly loading = this.activityStore.loading;

  // Form state
  protected selectedRaid = 'vault-of-the-incarnates';
  protected selectedBoss = '';
  protected selectedDifficulty = 'Normal';
  protected bossCount = 1;

  // Raid and difficulty options
  protected readonly raidOptions = [
    { label: 'Vault of the Incarnates', value: 'vault-of-the-incarnates' },
    { label: 'Aberrus, the Shadowed Crucible', value: 'aberrus' },
    { label: 'Amirdrassil, the Dream\'s Hope', value: 'amirdrassil' }
  ];

  protected readonly difficultyOptions: RaidDifficultyOption[] = [
    { label: 'LFR', value: 'LFR', color: '#22c55e' },
    { label: 'Normal', value: 'Normal', color: '#3b82f6' },
    { label: 'Heroic', value: 'Heroic', color: '#8b5cf6' },
    { label: 'Mythic', value: 'Mythic', color: '#f59e0b' }
  ];

  protected readonly bossOptions = computed(() => {
    switch (this.selectedRaid) {
      case 'vault-of-the-incarnates':
        return [
          'Eranog', 'Terros', 'The Primal Council', 'Sennarth',
          'Dathea', 'Kurog Grimtotem', 'Diurna', 'Raszageth'
        ];
      case 'aberrus':
        return [
          'Kazzara', 'The Amalgamation Chamber', 'The Forgotten Experiments',
          'Assault of the Zaqali', 'Rashok', 'The Vigilant Steward',
          'Magmorax', 'Echo of Neltharion', 'Scalecommander Sarkareth'
        ];
      case 'amirdrassil':
        return [
          'Gnarlroot', 'Igira the Cruel', 'Volcoross', 'Council of Dreams',
          'Larodar', 'Nymue', 'Smolderon', 'Tindral Sageswift', 'Fyrakk'
        ];
      default:
        return [];
    }
  });

  // Computed data for selected character
  protected readonly characterRaidActivities = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return null;

    const characterActivity = this.activities()[character.id];
    return characterActivity?.raid || null;
  });

  protected readonly currentWeekRaids = computed(() => {
    return this.characterRaidActivities();
  });

  protected readonly currentWeekRaidActivities = computed((): Activity[] => {
    const character = this.selectedCharacter();
    if (!character) return [];

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.raid) return [];

    // Return empty array for now - in real implementation would return current week's raid activities
    return [];
  });

  protected readonly vaultProgress = computed(() => {
    const raidActivity = this.currentWeekRaids();
    if (!raidActivity) return {
      completed: 0,
      required: [2, 4, 6],
      slots: 0,
      percentage: 0,
      nextMilestone: { target: 2, remaining: 2 }
    };

    const totalBosses = raidActivity.normalBossesKilled +
                       raidActivity.heroicBossesKilled +
                       raidActivity.mythicBossesKilled;
    const count = totalBosses;

    return {
      completed: count,
      required: [2, 4, 6],
      slots: this.calculateRaidSlots(count),
      percentage: this.calculateProgressPercentage(count),
      nextMilestone: this.getNextMilestone(count)
    };
  });

  protected readonly difficultyStats = computed(() => {
    const activities = this.characterRaidActivities();
    const stats = {
      LFR: 0,
      Normal: 0,
      Heroic: 0,
      Mythic: 0
    };

    if (activities) {
      // TODO: Implement based on actual raid activity structure
      stats.Normal = activities.normalBossesKilled || 0;
      stats.Heroic = activities.heroicBossesKilled || 0;
      stats.Mythic = activities.mythicBossesKilled || 0;
      stats.LFR = activities.lfrBossesKilled || 0;
    }

    return stats;
  });

  protected readonly highestDifficulty = computed(() => {
    const stats = this.difficultyStats();
    if (stats.Mythic > 0) return 'Mythic';
    if (stats.Heroic > 0) return 'Heroic';
    if (stats.Normal > 0) return 'Normal';
    if (stats.LFR > 0) return 'LFR';
    return 'None';
  });

  protected readonly rewardQuality = computed(() => {
    const difficulty = this.highestDifficulty();
    return difficulty === 'Mythic' ? 'Mythic' : 'Heroic';
  });

  protected readonly weeklyStats = computed(() => {
    const activities = this.currentWeekRaids();
    if (!activities) {
      return {
        totalBosses: 0,
        uniqueRaids: 0,
        highestDifficulty: 'None',
        progressByRaid: {}
      };
    }

    const totalBosses = activities.normalBossesKilled + activities.heroicBossesKilled + activities.mythicBossesKilled + (activities.lfrBossesKilled || 0);

    return {
      totalBosses,
      uniqueRaids: 1, // TODO: Calculate unique raids
      highestDifficulty: this.getWeeklyHighestDifficulty(),
      progressByRaid: {} // TODO: Implement progress by raid
    };
  });

  // Methods
  protected onAddRaidKill(): void {
    if (!this.selectedCharacter() || !this.selectedBoss || this.bossCount < 1) {
      return;
    }

    const raidLabel = this.raidOptions.find(r => r.value === this.selectedRaid)?.label || this.selectedRaid;

    for (let i = 0; i < this.bossCount; i++) {
      const newActivity: Omit<Activity, 'id'> = {
        characterId: this.selectedCharacter()!.id,
        type: ActivityType.RaidBossKilled,
        description: `Killed ${this.selectedDifficulty} ${this.selectedBoss} (${raidLabel})`,
        date: new Date(),
        vaultSlot: this.shouldGetVaultSlot() ? {
          type: 'raid',
          index: 0 // TODO: Calculate proper index
        } : undefined
      };

      // TODO: Update to use proper store method
      // this.activityStore.updateRaidActivity(character.id, {
      //   normalBossesKilled: updatedCounts.normal,
      //   heroicBossesKilled: updatedCounts.heroic,
      //   mythicBossesKilled: updatedCounts.mythic
      // });

      this.activityAdded.emit({
        ...newActivity,
        id: this.generateActivityId()
      });
    }

    // Reset form
    this.resetForm();
  }

  protected onRemoveActivity(activityId: string): void {
    // this.activityStore.removeActivity(activityId);
  }

  protected getDifficultyColor(difficulty: string): string {
    const option = this.difficultyOptions.find(d => d.value === difficulty);
    return option?.color || '#6b7280';
  }

  protected getDifficultySeverity(difficulty: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (difficulty) {
      case 'Mythic': return 'danger';
      case 'Heroic': return 'warn';
      case 'Normal': return 'info';
      case 'LFR': return 'success';
      default: return 'info';
    }
  }

  protected getDifficultyCount(difficulty: string): number {
    const stats = this.difficultyStats();
    switch (difficulty) {
      case 'LFR': return stats.LFR;
      case 'Normal': return stats.Normal;
      case 'Heroic': return stats.Heroic;
      case 'Mythic': return stats.Mythic;
      default: return 0;
    }
  }

  protected getTotalBossKills(): number {
    const activities = this.currentWeekRaids();
    if (!activities) return 0;
    return activities.normalBossesKilled + activities.heroicBossesKilled + activities.mythicBossesKilled + (activities.lfrBossesKilled || 0);
  }

  protected getVaultSlotSeverity(slotIndex: number): 'success' | 'info' | 'warn' {
    const progress = this.vaultProgress();
    return slotIndex < (progress.slots || 0) ? 'success' : 'info';
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

  protected canAddKill(): boolean {
    return !!(this.selectedCharacter() && this.selectedBoss && this.bossCount >= 1);
  }

  // Private helper methods
  private calculateRaidSlots(count: number): number {
    if (count >= 6) return 3;
    if (count >= 4) return 2;
    if (count >= 2) return 1;
    return 0;
  }

  private calculateProgressPercentage(count: number): number {
    if (count >= 6) return 100;
    if (count >= 4) return Math.round((count / 6) * 100);
    if (count >= 2) return Math.round((count / 4) * 100);
    return Math.round((count / 2) * 100);
  }

  private getNextMilestone(count: number): { target: number; remaining: number } {
    if (count < 2) return { target: 2, remaining: 2 - count };
    if (count < 4) return { target: 4, remaining: 4 - count };
    if (count < 6) return { target: 6, remaining: 6 - count };
    return { target: 6, remaining: 0 };
  }

  private shouldGetVaultSlot(): boolean {
    const activities = this.currentWeekRaids();
    if (!activities) return true;

    const currentCount = activities.normalBossesKilled + activities.heroicBossesKilled + activities.mythicBossesKilled + (activities.lfrBossesKilled || 0);
    return currentCount < 6; // Only award vault slots up to 6 bosses
  }

  private extractRaidName(description: string): string {
    if (description.includes('Vault of the Incarnates')) return 'VotI';
    if (description.includes('Aberrus')) return 'Aberrus';
    if (description.includes('Amirdrassil')) return 'Amirdrassil';
    return 'Unknown';
  }

  private getWeeklyHighestDifficulty(): string {
    const activities = this.currentWeekRaids();
    if (!activities) return 'None';

    if (activities.mythicBossesKilled > 0) return 'Mythic';
    if (activities.heroicBossesKilled > 0) return 'Heroic';
    if (activities.normalBossesKilled > 0) return 'Normal';
    if (activities.lfrBossesKilled && activities.lfrBossesKilled > 0) return 'LFR';
    return 'None';
  }

  private getProgressByRaid(activities: Activity[]): { [raid: string]: number } {
    const progress: { [raid: string]: number } = {};

    activities.forEach(activity => {
      const raidName = this.extractRaidName(activity.description || '');
      progress[raidName] = (progress[raidName] || 0) + 1;
    });

    return progress;
  }

  private generateActivityId(): string {
    return `raid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private resetForm(): void {
    this.selectedBoss = '';
    this.bossCount = 1;
  }
}