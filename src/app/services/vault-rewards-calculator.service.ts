import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { BlizzardApiService } from './blizzard-api.service';
import { WeeklyProgressService, WeeklyProgress } from './weekly-progress.service';
import { ItemLevelConfigService } from './item-level-config.service';
import { ApiCacheService } from './api-cache.service';
import { Character } from '../models/character.model';
import { RaidEncounterParserService } from '../features/great-vault/services/raid-encounter-parser.service';
import { WeeklyResetService } from '../features/great-vault/services/weekly-reset.service';
import { RaidDifficulty } from '../features/great-vault';

export interface VaultSlotReward {
  unlocked: boolean;
  quality: 'Mythic' | 'Heroic' | 'Normal' | 'No reward';
  itemLevel: number;
  keyLevel?: number; // For M+ slots
  difficulty?: string; // For raid slots
}

export interface VaultRewards {
  mythicPlus: {
    slots: number;
    slot1: VaultSlotReward;
    slot2: VaultSlotReward;
    slot3: VaultSlotReward;
    nextMilestone: { remaining: number };
    slotRewards: string[];
  };
  raid: {
    slots: number;
    slot1: VaultSlotReward;
    slot2: VaultSlotReward;
    slot3: VaultSlotReward;
    nextMilestone: { remaining: number };
    slotRewards: string[];
  };
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VaultRewardsCalculatorService {
  private readonly weeklyProgressService = inject(WeeklyProgressService);
  private readonly blizzardApiService = inject(BlizzardApiService);
  private readonly raidParserService = inject(RaidEncounterParserService);
  private readonly itemLevelConfig = inject(ItemLevelConfigService);
  private readonly apiCacheService = inject(ApiCacheService);
  private readonly weeklyResetService = inject(WeeklyResetService);

  /**
   * Calculate vault rewards based on weekly progress and detailed API data
   */
  calculateVaultRewards(character: Character, forceRefresh: boolean = false): Observable<VaultRewards> {
    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cachedRewards = this.apiCacheService.getCachedVaultRewards(character.id);
      if (cachedRewards) {
        return of(cachedRewards.vaultRewards);
      }
    }

    // Make API calls directly to avoid duplicate calls
    return this.getDetailedVaultRewardsDirectly(character, forceRefresh).pipe(
      map(vaultRewards => {
        // Cache the result if successful
        if (vaultRewards.success) {
          this.apiCacheService.setCachedVaultRewards(character.id, vaultRewards);
        }
        return vaultRewards;
      }),
      catchError(error => of(this.createEmptyVaultRewards(error.message || 'Unknown error')))
    );
  }

  /**
   * Get detailed vault rewards directly by making API calls once
   */
  private getDetailedVaultRewardsDirectly(character: Character, forceRefresh: boolean = false): Observable<VaultRewards> {
    // Check for cached API data first unless forced refresh
    if (!forceRefresh) {
      const cachedApiData = this.apiCacheService.getCachedApiData(character.id);
      if (cachedApiData) {
        // Use cached data to calculate rewards
        const dungeonCount = this.countWeeklyDungeons(cachedApiData.mythicKeystoneProfile);
        const bossCount = this.countWeeklyBosses(cachedApiData.raidEncounters);

        const mythicPlusRewards = this.calculateMythicPlusRewards(dungeonCount, cachedApiData.mythicKeystoneProfile);
        const raidRewards = this.calculateRaidRewards(bossCount, cachedApiData.raidEncounters);

        return of({
          mythicPlus: mythicPlusRewards,
          raid: raidRewards,
          success: true
        });
      }
    }

    const realmSlug = this.formatRealmSlug(character.server);

    // Fetch detailed M+ and raid data
    const mythicKeystone$ = this.blizzardApiService.getCharacterMythicKeystoneProfile(realmSlug, character.name)
      .pipe(catchError(() => of(null)));

    const raidEncounters$ = this.blizzardApiService.getCharacterRaidEncounters(realmSlug, character.name)
      .pipe(catchError(() => of(null)));

    return mythicKeystone$.pipe(
      switchMap(mythicData => {
        return raidEncounters$.pipe(
          map(raidData => {
            // Cache the API data
            this.apiCacheService.setCachedApiData(character.id, mythicData, raidData);

            // Calculate weekly progress counts
            const dungeonCount = this.countWeeklyDungeons(mythicData);
            const bossCount = this.countWeeklyBosses(raidData);

            const mythicPlusRewards = this.calculateMythicPlusRewards(dungeonCount, mythicData);
            const raidRewards = this.calculateRaidRewards(bossCount, raidData);

            return {
              mythicPlus: mythicPlusRewards,
              raid: raidRewards,
              success: true
            };
          })
        );
      }),
      catchError(() => of({
        mythicPlus: this.createEmptyMythicPlusRewards(),
        raid: this.createEmptyRaidRewards(),
        success: false,
        error: 'Failed to fetch character data from Blizzard API'
      }))
    );
  }

  /**
   * Get detailed vault rewards by fetching M+ and raid data (DEPRECATED - use getDetailedVaultRewardsDirectly)
   */
  private getDetailedVaultRewards(character: Character, progress: WeeklyProgress, forceRefresh: boolean = false): Observable<VaultRewards> {
    // Check for cached API data first unless forced refresh
    if (!forceRefresh) {
      const cachedApiData = this.apiCacheService.getCachedApiData(character.id);
      if (cachedApiData) {
        // Use cached data to calculate rewards
        const mythicPlusRewards = this.calculateMythicPlusRewards(progress.dungeons, cachedApiData.mythicKeystoneProfile);
        const raidRewards = this.calculateRaidRewards(progress.bosses, cachedApiData.raidEncounters);

        return of({
          mythicPlus: mythicPlusRewards,
          raid: raidRewards,
          success: true
        });
      }
    }

    const realmSlug = this.formatRealmSlug(character.server);

    // Fetch detailed M+ and raid data
    const mythicKeystone$ = this.blizzardApiService.getCharacterMythicKeystoneProfile(realmSlug, character.name)
      .pipe(catchError(() => of(null)));

    const raidEncounters$ = this.blizzardApiService.getCharacterRaidEncounters(realmSlug, character.name)
      .pipe(catchError(() => of(null)));

    return mythicKeystone$.pipe(
      switchMap(mythicData => {
        return raidEncounters$.pipe(
          map(raidData => {
            // Cache the API data
            this.apiCacheService.setCachedApiData(character.id, mythicData, raidData);

            const mythicPlusRewards = this.calculateMythicPlusRewards(progress.dungeons, mythicData);
            const raidRewards = this.calculateRaidRewards(progress.bosses, raidData);

            return {
              mythicPlus: mythicPlusRewards,
              raid: raidRewards,
              success: true
            };
          })
        );
      }),
      catchError(() => of({
        mythicPlus: this.calculateMythicPlusRewards(progress.dungeons, null),
        raid: this.calculateRaidRewards(progress.bosses, null),
        success: true
      }))
    );
  }

  /**
   * Calculate Mythic+ vault rewards
   */
  private calculateMythicPlusRewards(dungeonCount: number, mythicData: any) {
    const slots = this.calculateSlots(dungeonCount, [1, 4, 8]);

    // Extract key levels from API data if available
    const keyLevels = this.extractKeyLevels(mythicData);

    console.log(keyLevels)

    // Calculate rewards for each slot
    const slot1 = this.createMythicPlusSlot(dungeonCount >= 1, keyLevels[0]);
    const slot2 = this.createMythicPlusSlot(dungeonCount >= 4, keyLevels[3]);
    const slot3 = this.createMythicPlusSlot(dungeonCount >= 8, keyLevels[7]);

    const nextMilestone = this.calculateNextMilestone(dungeonCount, [1, 4, 8]);
    const slotRewards = [slot1.quality, slot2.quality, slot3.quality];
    console.log(slotRewards);

    return {
      slots,
      slot1,
      slot2,
      slot3,
      nextMilestone,
      slotRewards
    };
  }

  /**
   * Calculate Raid vault rewards
   */
  private calculateRaidRewards(bossCount: number, raidData?: any) {
    const slots = this.calculateSlots(bossCount, [2, 4, 6]);
    console.log(slots)

    // Parse actual raid encounter data if available
    let raidDifficulties: string[] = [];
    if (raidData) {
      try {
        const bossKills = this.raidParserService.parseRaidEncounters(raidData);
        const uniqueKills = this.raidParserService.getUniqueBossKills(bossKills);
        console.log(bossKills);
        console.log(uniqueKills);

        // Sort by difficulty priority (highest first) for vault slot assignment
        const sortedKills = uniqueKills.sort((a, b) =>
          this.getRaidDifficultyPriority(b.difficulty) - this.getRaidDifficultyPriority(a.difficulty)
        );

        console.log(sortedKills);

        raidDifficulties = sortedKills.map(kill => this.mapRaidDifficultyToString(kill.difficulty));

        console.log('[Vault Calculator] Parsed raid difficulties:', raidDifficulties);
      } catch (error) {
        console.warn('[Vault Calculator] Failed to parse raid data:', error);
      }
    }

    // Create slots based on actual difficulties or fallback to simplified logic
    const slot1 = this.createRaidSlot(bossCount >= 2, raidDifficulties[1] || 'Heroic'); // 2nd highest kill
    const slot2 = this.createRaidSlot(bossCount >= 4, raidDifficulties[3] || 'Heroic'); // 4th highest kill
    const slot3 = this.createRaidSlot(bossCount >= 6, raidDifficulties[5] || 'Heroic'); // 6th highest kill

    const nextMilestone = this.calculateNextMilestone(bossCount, [2, 4, 6]);
    const slotRewards = [slot1.quality, slot2.quality, slot3.quality];

    return {
      slots,
      slot1,
      slot2,
      slot3,
      nextMilestone,
      slotRewards
    };
  }

  /**
   * Extract key levels from mythic keystone data
   */
  private extractKeyLevels(mythicData: any): number[] {
    if (!mythicData?.current_period?.best_runs) {
      return [];
    }

    // Sort runs by key level (highest first)
    const runs = mythicData.current_period.best_runs
      .filter((run: any) => this.isCurrentWeek(run.completed_timestamp))
      .sort((a: any, b: any) => b.keystone_level - a.keystone_level);

    return runs.map((run: any) => run.keystone_level);
  }

  /**
   * Create a Mythic+ vault slot reward
   */
  private createMythicPlusSlot(unlocked: boolean, keyLevel?: number): VaultSlotReward {
    if (!unlocked || !keyLevel) {
      return {
        unlocked: false,
        quality: 'No reward',
        itemLevel: 0
      };
    }

    const itemLevel = this.calculateMythicPlusItemLevel(keyLevel);
    const quality = this.getItemQuality(itemLevel);

    return {
      unlocked: true,
      quality,
      itemLevel,
      keyLevel
    };
  }

  /**
   * Create a Raid vault slot reward
   */
  private createRaidSlot(unlocked: boolean, difficulty: string): VaultSlotReward {
    if (!unlocked) {
      return {
        unlocked: false,
        quality: 'No reward',
        itemLevel: 0
      };
    }

    const itemLevel = this.calculateRaidItemLevel(difficulty);
    const quality = this.getItemQuality(itemLevel);

    return {
      unlocked: true,
      quality,
      itemLevel,
      difficulty
    };
  }

  /**
   * Calculate number of unlocked slots
   */
  private calculateSlots(count: number, thresholds: number[]): number {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (count >= thresholds[i]) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * Calculate next milestone
   */
  private calculateNextMilestone(count: number, thresholds: number[]): { remaining: number } {
    for (const threshold of thresholds) {
      if (count < threshold) {
        return { remaining: threshold - count };
      }
    }
    return { remaining: 0 };
  }

  /**
   * Calculate Mythic+ item level based on key level
   */
  private calculateMythicPlusItemLevel(keyLevel: number): number {
    return this.itemLevelConfig.getMythicPlusItemLevel(keyLevel);
  }

  /**
   * Calculate Raid item level based on difficulty
   */
  private calculateRaidItemLevel(difficulty: string): number {
    return this.itemLevelConfig.getRaidItemLevel(difficulty);
  }

  /**
   * Get item quality based on item level
   */
  private getItemQuality(itemLevel: number): 'Mythic' | 'Heroic' | 'Normal' | 'No reward' {
    return this.itemLevelConfig.getItemQuality(itemLevel);
  }

  /**
   * Check if timestamp is from current week
   */
  private isCurrentWeek(timestamp: number): boolean {
    const now = new Date();
    const runDate = new Date(timestamp);

    // Get current Wednesday 15:00 UTC
    const currentWeek = new Date(now);
    currentWeek.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 4) % 7));
    currentWeek.setUTCHours(15, 0, 0, 0);

    if (currentWeek > now) {
      currentWeek.setUTCDate(currentWeek.getUTCDate() - 7);
    }

    return runDate >= currentWeek;
  }

  /**
   * Format realm name to slug format
   */
  private formatRealmSlug(realmName: string): string {
    return realmName
      .toLowerCase()
      .replace(/'/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Create empty vault rewards for error cases
   */
  private createEmptyVaultRewards(error: string): VaultRewards {
    const emptySlot: VaultSlotReward = {
      unlocked: false,
      quality: 'No reward',
      itemLevel: 0
    };

    return {
      mythicPlus: {
        slots: 0,
        slot1: emptySlot,
        slot2: emptySlot,
        slot3: emptySlot,
        nextMilestone: { remaining: 1 },
        slotRewards: ['No reward', 'No reward', 'No reward']
      },
      raid: {
        slots: 0,
        slot1: emptySlot,
        slot2: emptySlot,
        slot3: emptySlot,
        nextMilestone: { remaining: 2 },
        slotRewards: ['No reward', 'No reward', 'No reward']
      },
      success: false,
      error
    };
  }

  /**
   * Get raid difficulty priority for sorting (higher = better)
   */
  private getRaidDifficultyPriority(difficulty: RaidDifficulty): number {
    // Map the RaidDifficulty enum values to priority numbers
    switch (difficulty) {
      case RaidDifficulty.Mythic:
        return 4;
      case RaidDifficulty.Heroic:
        return 3;
      case RaidDifficulty.Normal:
        return 2;
      case RaidDifficulty.LFR:
        return 1;
      default:
        return 0;
    }
  }

  /**
   * Map raid difficulty enum to string
   */
  private mapRaidDifficultyToString(difficulty: RaidDifficulty): string {
    console.log(difficulty);
    switch (difficulty) {
      case RaidDifficulty.Mythic:
        return 'Mythic';
      case RaidDifficulty.Heroic:
        return 'Heroic';
      case RaidDifficulty.Normal:
        return 'Normal';
      case RaidDifficulty.LFR:
        return 'LFR';
      default:
        return 'Normal';
    }
  }

  /**
   * Get last update time for a character's API data
   */
  getLastUpdateTime(character: Character): Date | null {
    return this.apiCacheService.getLastUpdateTime(character.id);
  }

  /**
   * Check if character has valid cached data
   */
  hasValidCache(character: Character): boolean {
    return this.apiCacheService.hasValidCache(character.id);
  }

  /**
   * Count dungeons completed this week
   */
  private countWeeklyDungeons(mythicKeystoneProfile: any): number {
    if (!mythicKeystoneProfile?.current_period?.best_runs) {
      return 0;
    }

    const weekStart = this.getCurrentWeekStart();
    const runs = mythicKeystoneProfile.current_period.best_runs;

    // Filter runs from current week and level 2+
    const validRuns = runs.filter((run: any) => {
      const runDate = new Date(run.completed_timestamp);
      return runDate >= weekStart && run.keystone_level >= 2;
    });

    return validRuns.length;
  }

  /**
   * Count unique raid bosses killed this week
   */
  private countWeeklyBosses(raidEncounters: any): number {
    if (!raidEncounters) {
      return 0;
    }

    // Parse raid encounters to get boss kills
    const raidBossKills = this.raidParserService.parseRaidEncounters(raidEncounters);

    // Filter to current week and get unique boss count
    const weekStart = this.getCurrentWeekStart();
    const weeklyKills = raidBossKills.filter(kill => {
      const killDate = new Date(kill.killedAt);
      return killDate >= weekStart;
    });

    // Get unique boss count (same boss on different difficulties counts as 1)
    const uniqueBosses = this.raidParserService.getUniqueBossKills(weeklyKills);
    return uniqueBosses.length;
  }

  /**
   * Get current week start (Wednesday 15:00 UTC)
   */
  private getCurrentWeekStart(): Date {
    const reset = this.weeklyResetService.getCurrentWeeklyReset();
    return reset.currentWeekStart;
  }

  /**
   * Create empty mythic plus rewards structure
   */
  private createEmptyMythicPlusRewards() {
    return {
      slots: 0,
      slot1: { unlocked: false, quality: 'No reward' as const, itemLevel: 0 },
      slot2: { unlocked: false, quality: 'No reward' as const, itemLevel: 0 },
      slot3: { unlocked: false, quality: 'No reward' as const, itemLevel: 0 },
      nextMilestone: { remaining: 1 },
      slotRewards: ['No reward', 'No reward', 'No reward']
    };
  }

  /**
   * Create empty raid rewards structure
   */
  private createEmptyRaidRewards() {
    return {
      slots: 0,
      slot1: { unlocked: false, quality: 'No reward' as const, itemLevel: 0 },
      slot2: { unlocked: false, quality: 'No reward' as const, itemLevel: 0 },
      slot3: { unlocked: false, quality: 'No reward' as const, itemLevel: 0 },
      nextMilestone: { remaining: 2 },
      slotRewards: ['No reward', 'No reward', 'No reward']
    };
  }
}
