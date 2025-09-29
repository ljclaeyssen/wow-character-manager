import { Injectable } from '@angular/core';
import {
  GreatVaultProgress,
  GreatVaultSlot,
  GreatVaultMythicPlusProgress,
  GreatVaultRaidProgress,
  GreatVaultPvpProgress,
  GreatVaultRewardType,
  RaidBossKill,
  RaidDifficulty,
  GreatVaultSummary
} from '../models/great-vault.model';
import { BlizzardMythicKeystoneRun } from '../../../services/blizzard-api.service';

@Injectable({
  providedIn: 'root'
})
export class GreatVaultCalculationService {

  /**
   * Calculate complete Great Vault progress
   */
  calculateGreatVaultProgress(
    characterId: string,
    characterName: string,
    mythicRuns: BlizzardMythicKeystoneRun[],
    raidBossKills: RaidBossKill[],
    honorEarned: number = 0,
    pvpRating: number = 0
  ): GreatVaultProgress {
    const weekStartDate = this.getCurrentWeekStart();

    const mythicPlus = this.calculateMythicPlusProgress(mythicRuns);
    const raids = this.calculateRaidProgress(raidBossKills);
    const pvp = this.calculatePvpProgress(honorEarned, pvpRating);

    const totalSlots = this.countTotalUnlockedSlots(mythicPlus, raids, pvp);

    return {
      characterId,
      characterName,
      weekStartDate,
      lastUpdated: new Date(),
      mythicPlus,
      raids,
      pvp,
      totalSlots
    };
  }

  /**
   * Calculate Mythic+ vault progress
   */
  calculateMythicPlusProgress(runs: BlizzardMythicKeystoneRun[]): GreatVaultMythicPlusProgress {
    const weekStart = this.getCurrentWeekStart();

    // Filter runs from current week and level 2+
    const validRuns = runs.filter(run => {
      const runDate = new Date(run.completed_timestamp);
      return runDate >= weekStart && run.keystone_level >= 2;
    });

    // Sort runs by keystone level (highest first) to determine slot rewards
    const sortedRuns = [...validRuns].sort((a, b) => b.keystone_level - a.keystone_level);

    const completedDungeons = validRuns.length;
    const highestKeyLevel = validRuns.length > 0
      ? Math.max(...validRuns.map(run => run.keystone_level))
      : 0;

    // Calculate slot rewards based on the key level of runs that unlock each slot
    const slot1KeyLevel = completedDungeons >= 1 && sortedRuns[0] ? sortedRuns[0].keystone_level : 0;
    const slot2KeyLevel = completedDungeons >= 4 && sortedRuns[3] ? sortedRuns[3].keystone_level : 0; // 4th highest run
    const slot3KeyLevel = completedDungeons >= 8 && sortedRuns[7] ? sortedRuns[7].keystone_level : 0; // 8th highest run

    return {
      slot1: this.createVaultSlot(
        completedDungeons >= 1,
        completedDungeons >= 1 ? 1 : completedDungeons / 1,
        '1 Mythic+ dungeon',
        this.calculateMythicPlusItemLevel(slot1KeyLevel),
        GreatVaultRewardType.MythicPlus
      ),
      slot2: this.createVaultSlot(
        completedDungeons >= 4,
        completedDungeons >= 4 ? 1 : completedDungeons / 4,
        '4 Mythic+ dungeons',
        this.calculateMythicPlusItemLevel(slot2KeyLevel),
        GreatVaultRewardType.MythicPlus
      ),
      slot3: this.createVaultSlot(
        completedDungeons >= 8,
        completedDungeons >= 8 ? 1 : completedDungeons / 8,
        '8 Mythic+ dungeons',
        this.calculateMythicPlusItemLevel(slot3KeyLevel),
        GreatVaultRewardType.MythicPlus
      ),
      completedDungeons,
      highestKeyLevel,
      itemLevel: this.calculateMythicPlusItemLevel(highestKeyLevel)
    };
  }

  /**
   * Calculate raid vault progress
   */
  calculateRaidProgress(raidBossKills: RaidBossKill[]): GreatVaultRaidProgress {
    const eligibleKills = raidBossKills.filter(kill => kill.lootEligible);
    const uniqueBossCount = this.getUniqueBossCount(eligibleKills);
    const highestDifficulty = this.getHighestDifficulty(eligibleKills);
    const itemLevel = this.calculateRaidItemLevel(highestDifficulty);

    return {
      slot1: this.createVaultSlot(
        uniqueBossCount >= 2,
        uniqueBossCount / 2,
        '2 raid bosses',
        itemLevel,
        GreatVaultRewardType.Raid
      ),
      slot2: this.createVaultSlot(
        uniqueBossCount >= 4,
        uniqueBossCount / 4,
        '4 raid bosses',
        itemLevel + 7,
        GreatVaultRewardType.Raid
      ),
      slot3: this.createVaultSlot(
        uniqueBossCount >= 6,
        uniqueBossCount / 6,
        '6 raid bosses',
        itemLevel + 13,
        GreatVaultRewardType.Raid
      ),
      killedBosses: raidBossKills,
      uniqueBossCount,
      highestDifficulty,
      itemLevel
    };
  }

  /**
   * Calculate PvP vault progress
   */
  calculatePvpProgress(honorEarned: number, rating: number): GreatVaultPvpProgress {
    const baseItemLevel = this.calculatePvpItemLevel(rating);

    return {
      slot1: this.createVaultSlot(
        honorEarned >= 1250,
        honorEarned / 1250,
        '1,250 Honor earned',
        baseItemLevel,
        GreatVaultRewardType.PvP
      ),
      slot2: this.createVaultSlot(
        honorEarned >= 2500,
        honorEarned / 2500,
        '2,500 Honor earned',
        baseItemLevel + 7,
        GreatVaultRewardType.PvP
      ),
      slot3: this.createVaultSlot(
        honorEarned >= 6250,
        honorEarned / 6250,
        '6,250 Honor earned',
        baseItemLevel + 13,
        GreatVaultRewardType.PvP
      ),
      honorEarned,
      rating,
      itemLevel: baseItemLevel
    };
  }

  /**
   * Create a Great Vault summary
   */
  createSummary(progress: GreatVaultProgress): GreatVaultSummary {
    const mythicPlusSlots = this.countUnlockedSlots(progress.mythicPlus);
    const raidSlots = this.countUnlockedSlots(progress.raids);
    const pvpSlots = this.countUnlockedSlots(progress.pvp);

    const highestItemLevel = Math.max(
      ...this.getSlotItemLevels(progress.mythicPlus),
      ...this.getSlotItemLevels(progress.raids),
      ...this.getSlotItemLevels(progress.pvp)
    );

    const totalProgress = (
      this.getProgressPercentage(progress.mythicPlus) +
      this.getProgressPercentage(progress.raids) +
      this.getProgressPercentage(progress.pvp)
    ) / 3;

    return {
      characterId: progress.characterId,
      totalUnlockedSlots: progress.totalSlots,
      mythicPlusSlots,
      raidSlots,
      pvpSlots,
      highestItemLevel,
      weeklyProgress: totalProgress,
      lastUpdated: progress.lastUpdated
    };
  }

  // Private helper methods

  /**
   * Create a vault slot
   */
  private createVaultSlot(
    unlocked: boolean,
    progress: number,
    requirement: string,
    itemLevel: number,
    rewardType: GreatVaultRewardType
  ): GreatVaultSlot {
    return {
      unlocked,
      progress: Math.min(1, progress),
      requirement,
      itemLevel,
      rewardType
    };
  }

  /**
   * Get current WoW week start (Wednesday)
   */
  private getCurrentWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
    const monday = new Date(now.setDate(diff));

    // WoW reset is on Wednesday
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);
    wednesday.setHours(15, 0, 0, 0); // 15:00 UTC reset time

    // If we haven't passed Wednesday yet, use last Wednesday
    if (now < wednesday) {
      wednesday.setDate(wednesday.getDate() - 7);
    }

    return wednesday;
  }

  /**
   * Calculate Mythic+ item level based on highest key
   */
  private calculateMythicPlusItemLevel(highestKeyLevel: number): number {
    // The War Within Season 1 M+ item levels
    if (highestKeyLevel >= 10) return 639; // +10 and above
    if (highestKeyLevel >= 8) return 632;  // +8-9
    if (highestKeyLevel >= 6) return 626;  // +6-7
    if (highestKeyLevel >= 4) return 619;  // +4-5
    if (highestKeyLevel >= 2) return 613;  // +2-3
    return 597; // Base level
  }

  /**
   * Calculate raid item level based on difficulty
   */
  private calculateRaidItemLevel(difficulty: RaidDifficulty): number {
    // The War Within Season 1 raid item levels
    switch (difficulty) {
      case RaidDifficulty.Mythic: return 639;
      case RaidDifficulty.Heroic: return 626;
      case RaidDifficulty.Normal: return 613;
      case RaidDifficulty.LFR: return 597;
      default: return 597;
    }
  }

  /**
   * Calculate PvP item level based on rating
   */
  private calculatePvpItemLevel(rating: number): number {
    // The War Within Season 1 PvP item levels
    if (rating >= 2400) return 639; // Elite
    if (rating >= 2100) return 632; // Duelist
    if (rating >= 1800) return 626; // Rival
    if (rating >= 1600) return 619; // Challenger
    if (rating >= 1400) return 613; // Combatant
    return 597; // Unrated
  }

  /**
   * Get unique boss count from raid kills
   */
  private getUniqueBossCount(raidKills: RaidBossKill[]): number {
    const uniqueBosses = new Set(raidKills.map(kill => kill.bossId));
    return uniqueBosses.size;
  }

  /**
   * Get highest raid difficulty
   */
  private getHighestDifficulty(raidKills: RaidBossKill[]): RaidDifficulty {
    if (raidKills.some(kill => kill.difficulty === RaidDifficulty.Mythic)) {
      return RaidDifficulty.Mythic;
    }
    if (raidKills.some(kill => kill.difficulty === RaidDifficulty.Heroic)) {
      return RaidDifficulty.Heroic;
    }
    if (raidKills.some(kill => kill.difficulty === RaidDifficulty.Normal)) {
      return RaidDifficulty.Normal;
    }
    return RaidDifficulty.LFR;
  }

  /**
   * Count total unlocked slots across all categories
   */
  private countTotalUnlockedSlots(
    mythicPlus: GreatVaultMythicPlusProgress,
    raids: GreatVaultRaidProgress,
    pvp: GreatVaultPvpProgress
  ): number {
    return this.countUnlockedSlots(mythicPlus) +
           this.countUnlockedSlots(raids) +
           this.countUnlockedSlots(pvp);
  }

  /**
   * Count unlocked slots for a specific category
   */
  private countUnlockedSlots(category: any): number {
    let count = 0;
    if (category.slot1?.unlocked) count++;
    if (category.slot2?.unlocked) count++;
    if (category.slot3?.unlocked) count++;
    return count;
  }

  /**
   * Get item levels from all slots in a category
   */
  private getSlotItemLevels(category: any): number[] {
    const levels: number[] = [];
    if (category.slot1?.unlocked) levels.push(category.slot1.itemLevel);
    if (category.slot2?.unlocked) levels.push(category.slot2.itemLevel);
    if (category.slot3?.unlocked) levels.push(category.slot3.itemLevel);
    return levels;
  }

  /**
   * Get overall progress percentage for a category
   */
  private getProgressPercentage(category: any): number {
    const totalProgress = (category.slot1?.progress || 0) +
                         (category.slot2?.progress || 0) +
                         (category.slot3?.progress || 0);
    return totalProgress / 3;
  }
}