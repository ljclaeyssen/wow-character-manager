import { Injectable } from '@angular/core';
import { Activity } from '../models/activity.model';
import { ActivityType } from '../enums/activity-type.enum';

export interface VaultProgress {
  raid: number;
  mythicPlus: number;
  pvp: number;
  total: number;
}

export interface GreatVaultReward {
  slot: number;
  source: 'raid' | 'mythicPlus' | 'pvp';
  itemLevel: number;
  quality: 'Heroic' | 'Mythic';
}

export interface ActivityValidation {
  isValid: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  /**
   * Calculate Great Vault progress based on activities
   */
  calculateVaultProgress(activities: Activity[]): VaultProgress {
    const raidBosses = this.countRaidBosses(activities);
    const mythicPlusDungeons = this.countMythicPlusDungeons(activities);
    const pvpWins = this.countPvpWins(activities);

    const raidSlots = this.calculateRaidVaultSlots(raidBosses);
    const mythicPlusSlots = this.calculateMythicPlusVaultSlots(mythicPlusDungeons);
    const pvpSlots = this.calculatePvpVaultSlots(pvpWins);

    return {
      raid: raidSlots,
      mythicPlus: mythicPlusSlots,
      pvp: pvpSlots,
      total: raidSlots + mythicPlusSlots + pvpSlots
    };
  }

  /**
   * Calculate raid vault slots based on context.md requirements
   * 2/4/6 raid bosses killed = 1/2/3 vault reward slots
   */
  private calculateRaidVaultSlots(bossesKilled: number): number {
    if (bossesKilled >= 6) return 3;
    if (bossesKilled >= 4) return 2;
    if (bossesKilled >= 2) return 1;
    return 0;
  }

  /**
   * Calculate M+ vault slots based on context.md requirements
   * 1/4/8 M+ dungeons = 1/2/3 vault reward slots
   */
  private calculateMythicPlusVaultSlots(dungeonsCompleted: number): number {
    if (dungeonsCompleted >= 8) return 3;
    if (dungeonsCompleted >= 4) return 2;
    if (dungeonsCompleted >= 1) return 1;
    return 0;
  }

  /**
   * Calculate PvP vault slots (simplified - can be expanded later)
   */
  private calculatePvpVaultSlots(pvpWins: number): number {
    if (pvpWins >= 15) return 3;
    if (pvpWins >= 10) return 2;
    if (pvpWins >= 5) return 1;
    return 0;
  }

  /**
   * Count raid bosses killed for vault progress
   */
  private countRaidBosses(activities: Activity[]): number {
    return activities
      .filter(activity => activity.type === ActivityType.RaidBossKilled)
      .length;
  }

  /**
   * Count M+ dungeons completed for vault progress
   */
  private countMythicPlusDungeons(activities: Activity[]): number {
    return activities
      .filter(activity => activity.type === ActivityType.MythicPlusCompleted)
      .length;
  }

  /**
   * Count PvP wins for vault progress
   */
  private countPvpWins(activities: Activity[]): number {
    return activities
      .filter(activity => activity.type === ActivityType.PvPMatchCompleted)
      .length;
  }

  /**
   * Get projected Great Vault rewards based on current progress
   */
  getProjectedVaultRewards(activities: Activity[]): GreatVaultReward[] {
    const progress = this.calculateVaultProgress(activities);
    const rewards: GreatVaultReward[] = [];

    // Add raid rewards
    for (let i = 0; i < progress.raid; i++) {
      rewards.push({
        slot: i + 1,
        source: 'raid',
        itemLevel: this.calculateRaidItemLevel(activities),
        quality: this.getRaidItemQuality(activities)
      });
    }

    // Add M+ rewards
    for (let i = 0; i < progress.mythicPlus; i++) {
      rewards.push({
        slot: i + 1 + progress.raid,
        source: 'mythicPlus',
        itemLevel: this.calculateMythicPlusItemLevel(activities),
        quality: this.getMythicPlusItemQuality(activities)
      });
    }

    // Add PvP rewards
    for (let i = 0; i < progress.pvp; i++) {
      rewards.push({
        slot: i + 1 + progress.raid + progress.mythicPlus,
        source: 'pvp',
        itemLevel: this.calculatePvpItemLevel(activities),
        quality: 'Heroic' // PvP rewards are typically Heroic equivalent
      });
    }

    return rewards.slice(0, 9); // Max 9 vault slots
  }

  /**
   * Calculate item level for raid rewards based on difficulty
   */
  private calculateRaidItemLevel(activities: Activity[]): number {
    const raidActivities = activities.filter(a => a.type === ActivityType.RaidBossKilled);
    const hasHeroic = raidActivities.some(a => a.description?.toLowerCase().includes('heroic'));
    const hasMythic = raidActivities.some(a => a.description?.toLowerCase().includes('mythic'));

    if (hasMythic) return 489; // Mythic raid item level (example)
    if (hasHeroic) return 476; // Heroic raid item level (example)
    return 463; // Normal raid item level (example)
  }

  /**
   * Get raid item quality based on highest difficulty completed
   */
  private getRaidItemQuality(activities: Activity[]): 'Heroic' | 'Mythic' {
    const raidActivities = activities.filter(a => a.type === ActivityType.RaidBossKilled);
    const hasMythic = raidActivities.some(a => a.description?.toLowerCase().includes('mythic'));
    return hasMythic ? 'Mythic' : 'Heroic';
  }

  /**
   * Calculate item level for M+ rewards based on keystone level
   * Keys < 10 → Heroic items, Keys ≥ 10 → Mythic items
   */
  private calculateMythicPlusItemLevel(activities: Activity[]): number {
    const mythicPlusActivities = activities.filter(a => a.type === ActivityType.MythicPlusCompleted);

    let highestKey = 0;
    mythicPlusActivities.forEach(activity => {
      const keyMatch = activity.description?.match(/\+(\d+)/);
      if (keyMatch) {
        const keyLevel = parseInt(keyMatch[1], 10);
        if (keyLevel > highestKey) {
          highestKey = keyLevel;
        }
      }
    });

    // Item level based on key level (simplified calculation)
    if (highestKey >= 10) return 489; // Mythic vault level
    if (highestKey >= 5) return 476; // Heroic vault level
    return 463; // Base M+ vault level
  }

  /**
   * Get M+ item quality based on keystone level
   */
  private getMythicPlusItemQuality(activities: Activity[]): 'Heroic' | 'Mythic' {
    const mythicPlusActivities = activities.filter(a => a.type === ActivityType.MythicPlusCompleted);

    const hasHighKey = mythicPlusActivities.some(activity => {
      const keyMatch = activity.description?.match(/\+(\d+)/);
      return keyMatch && parseInt(keyMatch[1], 10) >= 10;
    });

    return hasHighKey ? 'Mythic' : 'Heroic';
  }

  /**
   * Calculate PvP item level (simplified)
   */
  private calculatePvpItemLevel(activities: Activity[]): number {
    return 476; // Standard PvP vault reward level
  }

  /**
   * Validate activity data
   */
  validateActivity(activity: Partial<Activity>): ActivityValidation {
    const errors: string[] = [];

    if (!activity.type) {
      errors.push('Activity type is required');
    }

    if (!activity.description || activity.description.trim().length === 0) {
      errors.push('Activity description is required');
    }

    if (!activity.date) {
      errors.push('Activity date is required');
    }

    if (!activity.characterId) {
      errors.push('Character ID is required');
    }

    // Validate M+ specific requirements
    if (activity.type === ActivityType.MythicPlusCompleted) {
      if (!activity.description?.match(/\+\d+/)) {
        errors.push('Mythic+ activities must include keystone level (e.g., "+15")');
      }
    }

    // Validate raid specific requirements
    if (activity.type === ActivityType.RaidBossKilled) {
      const validDifficulties = ['normal', 'heroic', 'mythic'];
      const hasValidDifficulty = validDifficulties.some(difficulty =>
        activity.description?.toLowerCase().includes(difficulty)
      );
      if (!hasValidDifficulty) {
        errors.push('Raid activities should specify difficulty (Normal, Heroic, or Mythic)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if activities are from current week
   */
  isCurrentWeek(activityDate: Date): boolean {
    const now = new Date();
    const currentWeekStart = this.getWeekStartDate(now);
    const activityWeekStart = this.getWeekStartDate(activityDate);

    return currentWeekStart.getTime() === activityWeekStart.getTime();
  }

  /**
   * Get the start date of the week (Wednesday for EU reset)
   */
  private getWeekStartDate(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    // Wednesday is day 3, so we calculate days since last Wednesday
    const diff = day < 3 ? day + 4 : day - 3;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get next reset date (next Wednesday)
   */
  getNextResetDate(): Date {
    const now = new Date();
    const nextReset = new Date(now);
    const day = now.getDay();
    const daysUntilWednesday = day <= 3 ? 3 - day : 10 - day;

    nextReset.setDate(now.getDate() + daysUntilWednesday);
    nextReset.setHours(0, 0, 0, 0);

    return nextReset;
  }

  /**
   * Filter activities for current week only
   */
  getCurrentWeekActivities(activities: Activity[]): Activity[] {
    return activities.filter(activity => this.isCurrentWeek(activity.date));
  }

  /**
   * Get vault progress percentage (out of 9 possible slots)
   */
  getVaultProgressPercentage(activities: Activity[]): number {
    const progress = this.calculateVaultProgress(activities);
    return Math.round((progress.total / 9) * 100);
  }
}