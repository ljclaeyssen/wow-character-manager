import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';

import { ActivityStore } from '../../store/activity.store';
import { ActivityService, VaultProgress, GreatVaultReward } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { Activity, CharacterActivity, MythicPlusRun } from '../../models/activity.model';
import { ActivityType } from '../../enums/activity-type.enum';
import { Profession } from '../../enums/profession.enum';

@Component({
  selector: 'wow-activity-tracker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    PanelModule,
    ProgressBarModule,
    BadgeModule,
    ButtonModule,
    TooltipModule,
    DividerModule,
    TagModule,
    MessageModule,
    CheckboxModule
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

  // Mythic+ specific vault progress (like the mythic-plus component)
  protected readonly mythicPlusVaultProgress = computed(() => {
    const characterActivity = this.currentWeekActivities();
    if (!characterActivity || !characterActivity.mythicPlus) {
      return {
        completed: 0,
        required: [1, 4, 8],
        slots: 0,
        percentage: 0,
        nextMilestone: { target: 1, remaining: 1 },
        slotRewards: ['No reward', 'No reward', 'No reward']
      };
    }

    const count = characterActivity.mythicPlus.dungeonCount;
    const runs = characterActivity.mythicPlus.runs || [];

    // Sort runs by key level (highest first) to determine vault rewards
    const sortedRuns = [...runs].sort((a, b) => b.keyLevel - a.keyLevel);

    // Calculate slot rewards based on sorted runs
    const slotRewards = [
      count >= 1 && sortedRuns[0] ? (sortedRuns[0].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 'Mythic' : 'Heroic') : 'No reward',
      count >= 4 && sortedRuns[3] ? (sortedRuns[3].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 'Mythic' : 'Heroic') : 'No reward',
      count >= 8 && sortedRuns[7] ? (sortedRuns[7].keyLevel >= this.MYTHIC_LOOT_THRESHOLD ? 'Mythic' : 'Heroic') : 'No reward'
    ];

    return {
      completed: count,
      required: [1, 4, 8],
      slots: this.calculateMythicPlusSlots(count),
      percentage: this.calculateMythicPlusProgressPercentage(count),
      nextMilestone: this.getMythicPlusNextMilestone(count),
      slotRewards
    };
  });

  // Raid specific vault progress
  protected readonly raidVaultProgress = computed(() => {
    const activity = this.currentWeekActivities();
    if (!activity?.raid) {
      return {
        completed: 0,
        required: [2, 4, 6],
        slots: 0,
        percentage: 0,
        nextMilestone: { target: 2, remaining: 2 },
        slotRewards: ['No reward', 'No reward', 'No reward']
      };
    }

    const raid = activity.raid;
    const totalBosses = (raid.mythicBossesKilled || 0) +
                       (raid.heroicBossesKilled || 0) +
                       (raid.normalBossesKilled || 0) +
                       (raid.lfrBossesKilled || 0);

    // Create array of all boss kills sorted by difficulty (highest first)
    const bossKills: string[] = [];

    // Add mythic kills first (highest priority)
    for (let i = 0; i < (raid.mythicBossesKilled || 0); i++) {
      bossKills.push('Mythic');
    }
    // Add heroic kills
    for (let i = 0; i < (raid.heroicBossesKilled || 0); i++) {
      bossKills.push('Heroic');
    }
    // Add normal kills
    for (let i = 0; i < (raid.normalBossesKilled || 0); i++) {
      bossKills.push('Normal');
    }
    // Add LFR kills last (lowest priority)
    for (let i = 0; i < (raid.lfrBossesKilled || 0); i++) {
      bossKills.push('LFR');
    }

    // Calculate vault slots earned (2/4/6 bosses for 1/2/3 slots)
    const slots = totalBosses >= 6 ? 3 : totalBosses >= 4 ? 2 : totalBosses >= 2 ? 1 : 0;

    // Calculate next milestone
    let nextTarget = 2;
    let remaining = 2 - totalBosses;
    if (totalBosses >= 2) {
      nextTarget = 4;
      remaining = 4 - totalBosses;
    }
    if (totalBosses >= 4) {
      nextTarget = 6;
      remaining = 6 - totalBosses;
    }
    if (totalBosses >= 6) {
      remaining = 0;
    }

    // Calculate slot rewards based on boss kill order
    const slotRewards = [
      bossKills[1] || 'No reward', // 2nd boss determines slot 1 reward
      bossKills[3] || 'No reward', // 4th boss determines slot 2 reward
      bossKills[5] || 'No reward'  // 6th boss determines slot 3 reward
    ];

    return {
      completed: totalBosses,
      required: [2, 4, 6],
      slots,
      percentage: Math.round((totalBosses / 6) * 100),
      nextMilestone: { target: nextTarget, remaining: Math.max(0, remaining) },
      slotRewards
    };
  });

  protected getMythicPlusVaultSlotSeverity(slotIndex: number): 'success' | 'info' | 'warn' {
    const progress = this.mythicPlusVaultProgress();
    return slotIndex < progress.slots ? 'success' : 'info';
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

  // Quick-add methods for Raid
  protected onAddLFRBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    let activity = this.activities()[character.id];
    if (!activity) {
      this.activityStore.initializeCharacterActivity(character.id);
      activity = this.activities()[character.id];
      if (!activity) return;
    }

    this.activityStore.updateRaidActivity(character.id, {
      lfrBossesKilled: (activity.raid.lfrBossesKilled || 0) + 1
    });
  }

  protected onAddNormalBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    let activity = this.activities()[character.id];
    if (!activity) {
      this.activityStore.initializeCharacterActivity(character.id);
      activity = this.activities()[character.id];
      if (!activity) return;
    }

    this.activityStore.updateRaidActivity(character.id, {
      normalBossesKilled: (activity.raid.normalBossesKilled || 0) + 1
    });
  }

  protected onAddHeroicBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    let activity = this.activities()[character.id];
    if (!activity) {
      this.activityStore.initializeCharacterActivity(character.id);
      activity = this.activities()[character.id];
      if (!activity) return;
    }

    this.activityStore.updateRaidActivity(character.id, {
      heroicBossesKilled: (activity.raid.heroicBossesKilled || 0) + 1
    });
  }

  protected onAddMythicBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    let activity = this.activities()[character.id];
    if (!activity) {
      this.activityStore.initializeCharacterActivity(character.id);
      activity = this.activities()[character.id];
      if (!activity) return;
    }

    this.activityStore.updateRaidActivity(character.id, {
      mythicBossesKilled: (activity.raid.mythicBossesKilled || 0) + 1
    });
  }

  // Helper methods for mythic+ vault calculations
  private calculateMythicPlusSlots(count: number): number {
    if (count >= 8) return 3;
    if (count >= 4) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  private calculateMythicPlusProgressPercentage(count: number): number {
    // Progress towards next vault slot
    if (count >= 8) return 100;
    if (count >= 4) return Math.round((count / 8) * 100);
    if (count >= 1) return Math.round((count / 4) * 100);
    return Math.round((count / 1) * 100);
  }

  private getMythicPlusNextMilestone(count: number): { target: number; remaining: number } {
    if (count < 1) return { target: 1, remaining: 1 - count };
    if (count < 4) return { target: 4, remaining: 4 - count };
    if (count < 8) return { target: 8, remaining: 8 - count };
    return { target: 8, remaining: 0 };
  }

  // Helper methods for raid vault calculations
  private calculateRaidSlots(bossCount: number): number {
    if (bossCount >= 6) return 3;
    if (bossCount >= 4) return 2;
    if (bossCount >= 2) return 1;
    return 0;
  }

  private calculateRaidProgressPercentage(bossCount: number): number {
    // Progress towards next vault slot
    if (bossCount >= 6) return 100;
    if (bossCount >= 4) return Math.round((bossCount / 6) * 100);
    if (bossCount >= 2) return Math.round((bossCount / 4) * 100);
    return Math.round((bossCount / 2) * 100);
  }

  private getRaidNextMilestone(bossCount: number): { target: number; remaining: number } {
    if (bossCount < 2) return { target: 2, remaining: 2 - bossCount };
    if (bossCount < 4) return { target: 4, remaining: 4 - bossCount };
    if (bossCount < 6) return { target: 6, remaining: 6 - bossCount };
    return { target: 6, remaining: 0 };
  }

  // WEEKLY QUEST FUNCTIONALITY
  // Weekly events (rotating content)
  protected readonly weeklyEvents = [
    'Timewalking Dungeons',
    'Mythic+ Bonus Event',
    'PvP Brawl',
    'Pet Battle Bonus Event',
    'Arena Skirmish Event'
  ];

  protected readonly currentWeekEvent = this.weeklyEvents[0]; // Would be dynamic in real app

  // Computed data for weekly quests
  protected readonly characterWeeklyQuests = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return null;

    const characterActivity = this.activities()[character.id];
    return characterActivity?.weeklyQuests || null;
  });

  // World Boss Progress
  protected readonly worldBossCompleted = computed(() => {
    const weeklyQuests = this.characterWeeklyQuests();
    return weeklyQuests?.worldBossCompleted || false;
  });

  // Spark Fragment Progress (every 2 weeks = 1 full spark)
  protected readonly sparkProgress = computed(() => {
    const weeklyQuests = this.characterWeeklyQuests();
    if (!weeklyQuests) return { current: 0, max: 2, percentage: 0 };

    const currentFragments = weeklyQuests.sparkFragments;

    return {
      current: currentFragments,
      max: 2,
      percentage: Math.round((currentFragments / 2) * 100)
    };
  });

  // Profession Quest Progress
  protected readonly professionQuestProgress = computed(() => {
    const character = this.selectedCharacter();
    const weeklyQuests = this.characterWeeklyQuests();
    if (!character || !weeklyQuests) return [];

    const completedQuests = weeklyQuests.professionQuestsDone;
    const totalQuests = character.professions.length;

    return character.professions.map((profession, index) => {
      return {
        profession,
        completed: index < completedQuests,
        name: `${profession} Knowledge Quest`,
        description: `Weekly profession quest for ${profession} knowledge points`
      };
    });
  });

  // Weekly Event Progress
  protected readonly weeklyEventCompleted = computed(() => {
    const weeklyQuests = this.characterWeeklyQuests();
    return weeklyQuests?.weeklyEventCompleted || false;
  });

  // Profession quest completion count
  protected readonly completedProfessionQuests = computed(() => {
    const progress = this.professionQuestProgress();
    return progress.filter(p => p.completed).length;
  });

  // Overall weekly quest progress
  protected readonly weeklyQuestProgress = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return { completed: 0, total: 0, percentage: 0 };

    const worldBoss = this.worldBossCompleted() ? 1 : 0;
    const spark = this.sparkProgress().current >= 1 ? 1 : 0;
    const professions = this.professionQuestProgress().filter(p => p.completed).length;
    const weeklyEvent = this.weeklyEventCompleted() ? 1 : 0;

    const completed = worldBoss + spark + professions + weeklyEvent;
    const total = 1 + 1 + character.professions.length + 1; // worldBoss + spark + professions + event

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  });

  // Weekly quest methods
  protected onToggleWorldBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const isCompleted = currentActivity.weeklyQuests.worldBossCompleted;

    this.activityStore.updateWeeklyQuests(character.id, {
      worldBossCompleted: !isCompleted
    });
  }

  protected onToggleSparkQuest(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const currentFragments = currentActivity.weeklyQuests.sparkFragments;
    const newFragments = currentFragments >= 2 ? 0 : currentFragments + 1;

    this.activityStore.updateWeeklyQuests(character.id, {
      sparkFragments: newFragments
    });
  }

  protected onToggleProfessionQuest(profession: Profession): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const currentQuests = currentActivity.weeklyQuests.professionQuestsDone;
    const maxQuests = character.professions.length; // Each profession has 1 quest per week
    const newQuests = currentQuests >= maxQuests ? 0 : currentQuests + 1;

    this.activityStore.updateWeeklyQuests(character.id, {
      professionQuestsDone: newQuests
    });
  }

  protected onToggleWeeklyEvent(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const isCompleted = currentActivity.weeklyQuests.weeklyEventCompleted;

    this.activityStore.updateWeeklyQuests(character.id, {
      weeklyEventCompleted: !isCompleted
    });
  }

  protected getCompletionSeverity(completed: boolean): 'success' | 'warn' {
    return completed ? 'success' : 'warn';
  }

  protected getProfessionIcon(profession: Profession): string {
    return `professions_icon/Ui_profession_${profession.toLowerCase()}.png`;
  }
}