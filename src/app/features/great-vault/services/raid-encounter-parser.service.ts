import { Injectable, inject } from '@angular/core';
import {
  BlizzardCharacterRaidsResponse,
  RaidBossKill,
  RaidDifficulty,
  BlizzardRaidMode,
  BlizzardRaidEncounter
} from '../models/great-vault.model';
import { WeeklyResetService } from './weekly-reset.service';

@Injectable({
  providedIn: 'root'
})
export class RaidEncounterParserService {
  private readonly weeklyResetService = inject(WeeklyResetService);

  /**
   * Parse Blizzard raid encounters response into boss kills
   */
  parseRaidEncounters(response: BlizzardCharacterRaidsResponse): RaidBossKill[] {
    const bossKills: RaidBossKill[] = [];

    if (!response.expansions) {
      return bossKills;
    }

    // Process current season raids - Blizzard provides a dedicated "Current Season" expansion
    const currentSeasonExpansion = response.expansions.find(exp =>
      exp.expansion.name === 'Current Season'
    );

    if (!currentSeasonExpansion?.instances) {
      console.log('[Great Vault] No "Current Season" expansion found in API response');
      return bossKills;
    }

    console.log(`[Great Vault] Processing raids from expansion: "${currentSeasonExpansion.expansion.name}" (ID: ${currentSeasonExpansion.expansion.id})`);
    console.log(`[Great Vault] Found ${currentSeasonExpansion.instances.length} raid instance(s)`);

    for (const instance of currentSeasonExpansion.instances) {
      if (!instance.modes) continue;

      for (const mode of instance.modes) {
        const difficulty = this.mapDifficultyFromBlizzard(mode.difficulty.type);
        const encounters = mode.progress?.encounters || [];

        for (const encounter of encounters) {
          if (encounter.completed_count > 0 && encounter.last_kill_timestamp) {
            const killDate = new Date(encounter.last_kill_timestamp);

            // Only include kills from current week
            if (this.weeklyResetService.isDateInCurrentWeek(killDate)) {
              bossKills.push({
                bossId: encounter.encounter.id,
                bossName: encounter.encounter.name,
                instanceId: instance.instance.id,
                instanceName: instance.instance.name,
                difficulty,
                killedAt: killDate,
                lootEligible: this.determineEligibility(encounter, killDate)
              });
            }
          }
        }
      }
    }

    console.log(`[Great Vault] Processed ${bossKills.length} boss kills from current week`);
    return bossKills;
  }

  /**
   * Get unique boss kills (same boss on different difficulties = 1 kill)
   */
  getUniqueBossKills(bossKills: RaidBossKill[]): RaidBossKill[] {
    const uniqueKills = new Map<number, RaidBossKill>();

    for (const kill of bossKills) {
      if (!kill.lootEligible) continue;

      const existing = uniqueKills.get(kill.bossId);

      // Keep the highest difficulty kill
      if (!existing || this.getDifficultyPriority(kill.difficulty) > this.getDifficultyPriority(existing.difficulty)) {
        uniqueKills.set(kill.bossId, kill);
      }
    }

    return Array.from(uniqueKills.values()).sort((a, b) => a.bossName.localeCompare(b.bossName));
  }

  /**
   * Get the highest raid difficulty completed this week
   */
  getHighestDifficulty(bossKills: RaidBossKill[]): RaidDifficulty {
    if (bossKills.length === 0) return RaidDifficulty.LFR;

    const difficulties = bossKills
      .filter(kill => kill.lootEligible)
      .map(kill => kill.difficulty);

    if (difficulties.includes(RaidDifficulty.Mythic)) return RaidDifficulty.Mythic;
    if (difficulties.includes(RaidDifficulty.Heroic)) return RaidDifficulty.Heroic;
    if (difficulties.includes(RaidDifficulty.Normal)) return RaidDifficulty.Normal;
    return RaidDifficulty.LFR;
  }

  /**
   * Calculate item level based on highest difficulty and raid tier
   */
  calculateRaidItemLevel(highestDifficulty: RaidDifficulty): number {
    // The War Within Season 1 item levels
    switch (highestDifficulty) {
      case RaidDifficulty.Mythic:
        return 639; // Mythic Nerub-ar Palace
      case RaidDifficulty.Heroic:
        return 626; // Heroic Nerub-ar Palace
      case RaidDifficulty.Normal:
        return 613; // Normal Nerub-ar Palace
      case RaidDifficulty.LFR:
        return 597; // LFR Nerub-ar Palace
      default:
        return 597;
    }
  }

  /**
   * Get raid progress summary
   */
  getRaidProgressSummary(bossKills: RaidBossKill[]): {
    totalKills: number;
    uniqueKills: number;
    byDifficulty: Record<RaidDifficulty, number>;
  } {
    const uniqueKills = this.getUniqueBossKills(bossKills);
    const byDifficulty = {
      [RaidDifficulty.LFR]: 0,
      [RaidDifficulty.Normal]: 0,
      [RaidDifficulty.Heroic]: 0,
      [RaidDifficulty.Mythic]: 0
    };

    for (const kill of bossKills.filter(k => k.lootEligible)) {
      byDifficulty[kill.difficulty]++;
    }

    return {
      totalKills: bossKills.length,
      uniqueKills: uniqueKills.length,
      byDifficulty
    };
  }

  // Private helper methods

  /**
   * Map Blizzard difficulty type to our enum
   */
  private mapDifficultyFromBlizzard(difficultyType: string): RaidDifficulty {
    const difficultyMap: Record<string, RaidDifficulty> = {
      'LFR': RaidDifficulty.LFR,
      'NORMAL': RaidDifficulty.Normal,
      'HEROIC': RaidDifficulty.Heroic,
      'MYTHIC': RaidDifficulty.Mythic
    };

    return difficultyMap[difficultyType.toUpperCase()] || RaidDifficulty.Normal;
  }

  /**
   * Determine if the player was loot eligible for this kill
   */
  private determineEligibility(encounter: BlizzardRaidEncounter, killDate: Date): boolean {
    // Simplified eligibility check
    // In reality, this would need more complex logic to determine actual loot eligibility
    // For now, assume first kill of the week per difficulty is eligible

    const weekStart = this.weeklyResetService.getCurrentWeeklyReset().currentWeekStart;
    const hoursAfterWeekStart = (killDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60);

    // Assume eligible if killed within reasonable time after reset
    // This is a simplified heuristic - real implementation would need more data
    return hoursAfterWeekStart >= 0 && hoursAfterWeekStart <= 7 * 24;
  }

  /**
   * Get difficulty priority for comparison (higher = better)
   */
  private getDifficultyPriority(difficulty: RaidDifficulty): number {
    switch (difficulty) {
      case RaidDifficulty.Mythic: return 4;
      case RaidDifficulty.Heroic: return 3;
      case RaidDifficulty.Normal: return 2;
      case RaidDifficulty.LFR: return 1;
      default: return 0;
    }
  }
}