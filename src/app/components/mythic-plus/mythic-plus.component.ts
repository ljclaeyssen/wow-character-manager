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

interface DungeonOption {
  label: string;
  value: string;
}

interface MythicPlusRun {
  dungeon: string;
  keystoneLevel: number;
  completed: boolean;
  inTime: boolean;
}

@Component({
  selector: 'wow-mythic-plus',
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
  templateUrl: './mythic-plus.component.html',
  styleUrl: './mythic-plus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MythicPlusComponent {
  private readonly activityStore = inject(ActivityStore);
  private readonly activityService = inject(ActivityService);

  // Component inputs and outputs
  readonly selectedCharacter = input<Character | null>(null);
  readonly activityAdded = output<Activity>();

  // Store data
  protected readonly activities = this.activityStore.activities;
  protected readonly loading = this.activityStore.loading;

  // Form state
  protected selectedDungeon = '';
  protected keystoneLevel = 15;
  protected completedInTime = true;

  // Dungeon options (Dragonflight Season 3 dungeons as example)
  protected readonly dungeonOptions: DungeonOption[] = [
    { label: 'Ruby Life Pools', value: 'ruby-life-pools' },
    { label: 'The Nokhud Offensive', value: 'nokhud-offensive' },
    { label: 'The Azure Vault', value: 'azure-vault' },
    { label: 'Algeth\'ar Academy', value: 'algethar-academy' },
    { label: 'Uldaman: Legacy of Tyr', value: 'uldaman' },
    { label: 'Neltharus', value: 'neltharus' },
    { label: 'Brackenhide Hollow', value: 'brackenhide-hollow' },
    { label: 'Halls of Infusion', value: 'halls-of-infusion' }
  ];

  // Computed data for selected character
  protected readonly characterMythicPlusActivities = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return [];

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.mythicPlus) return [];

    // For now, return empty array until we have the actual activities array structure
    return [];
  });

  protected readonly currentWeekMythicPlus = computed((): Activity[] => {
    const character = this.selectedCharacter();
    if (!character) return [];

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.mythicPlus) return [];

    // Return empty array for now - in real implementation would return current week's runs
    return [];
  });

  protected readonly vaultProgress = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return { completed: 0, required: [1, 4, 8], slots: 0, percentage: 0, nextMilestone: { target: 1, remaining: 1 } };

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.mythicPlus) {
      return { completed: 0, required: [1, 4, 8], slots: 0, percentage: 0, nextMilestone: { target: 1, remaining: 1 } };
    }

    const count = characterActivity.mythicPlus.dungeonCount;

    return {
      completed: count,
      required: [1, 4, 8],
      slots: this.calculateMythicPlusSlots(count),
      percentage: this.calculateProgressPercentage(count),
      nextMilestone: this.getNextMilestone(count)
    };
  });

  protected readonly highestKeystone = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return 0;

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.mythicPlus) return 0;

    return characterActivity.mythicPlus.highestKeyLevel || 0;
  });

  protected readonly rewardQuality = computed(() => {
    const highestKey = this.highestKeystone();
    return highestKey >= 10 ? 'Mythic' : 'Heroic';
  });

  protected readonly weeklyStats = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return { totalRuns: 0, averageKeyLevel: 0, highestKeyLevel: 0, inTimeRuns: 0 };

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.mythicPlus) {
      return { totalRuns: 0, averageKeyLevel: 0, highestKeyLevel: 0, inTimeRuns: 0 };
    }

    return {
      totalRuns: characterActivity.mythicPlus.dungeonCount,
      averageKeyLevel: characterActivity.mythicPlus.averageKeyLevel || 0,
      highestKeyLevel: characterActivity.mythicPlus.highestKeyLevel || 0,
      inTimeRuns: characterActivity.mythicPlus.inTimeRuns || 0
    };
  });

  // Methods
  protected onAddMythicPlus(): void {
    if (!this.selectedCharacter() || !this.selectedDungeon || this.keystoneLevel < 2) {
      return;
    }

    const dungeonLabel = this.dungeonOptions.find(d => d.value === this.selectedDungeon)?.label || this.selectedDungeon;
    const timeStatus = this.completedInTime ? 'in time' : 'over time';

    const newActivity: Omit<Activity, 'id'> = {
      characterId: this.selectedCharacter()!.id,
      type: ActivityType.MythicPlusCompleted,
      description: `Completed M+${this.keystoneLevel} ${dungeonLabel} (${timeStatus})`,
      date: new Date(),
      vaultSlot: this.shouldGetVaultSlot() ? {
        type: 'mythicPlus',
        index: 0 // TODO: Calculate proper index based on current count
      } : undefined
    };

    // TODO: Update to use proper store method for mythic plus
    // this.activityStore.updateMythicPlusActivity(character.id, {...});

    this.activityAdded.emit({
      ...newActivity,
      id: this.generateActivityId()
    });

    // Reset form
    this.resetForm();
  }

  protected onRemoveActivity(activityId: string): void {
    // TODO: Update to use proper store method for mythic plus
    // this.activityStore.removeMythicPlusActivity(character.id, activityId);
  }

  protected getVaultSlotSeverity(slotIndex: number): 'success' | 'info' | 'warn' {
    const progress = this.vaultProgress();
    return slotIndex < progress.slots ? 'success' : 'info';
  }

  protected getProgressSeverity(percentage: number): 'success' | 'info' | 'warn' | 'danger' {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warn';
    return 'danger';
  }

  protected getKeystoneSeverity(level: number): 'success' | 'info' | 'warn' | 'danger' {
    if (level >= 20) return 'success';
    if (level >= 15) return 'info';
    if (level >= 10) return 'warn';
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

  protected canAddRun(): boolean {
    return !!(this.selectedCharacter() && this.selectedDungeon && this.keystoneLevel >= 2);
  }

  // Private helper methods
  private calculateMythicPlusSlots(count: number): number {
    if (count >= 8) return 3;
    if (count >= 4) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  private calculateProgressPercentage(count: number): number {
    // Progress towards next vault slot
    if (count >= 8) return 100;
    if (count >= 4) return Math.round((count / 8) * 100);
    if (count >= 1) return Math.round((count / 4) * 100);
    return Math.round((count / 1) * 100);
  }

  private getNextMilestone(count: number): { target: number; remaining: number } {
    if (count < 1) return { target: 1, remaining: 1 - count };
    if (count < 4) return { target: 4, remaining: 4 - count };
    if (count < 8) return { target: 8, remaining: 8 - count };
    return { target: 8, remaining: 0 };
  }

  private shouldGetVaultSlot(): boolean {
    const character = this.selectedCharacter();
    if (!character) return false;

    const characterActivity = this.activities()[character.id];
    if (!characterActivity || !characterActivity.mythicPlus) return true;

    const currentCount = characterActivity.mythicPlus.dungeonCount;
    return currentCount < 8; // Only award vault slots up to 8 runs
  }

  private generateActivityId(): string {
    return `mplus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private resetForm(): void {
    this.selectedDungeon = '';
    this.keystoneLevel = 15;
    this.completedInTime = true;
  }
}