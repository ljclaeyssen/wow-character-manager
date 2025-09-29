import { Injectable } from '@angular/core';

export interface SeasonConfig {
  id: string;
  name: string;
  mythicPlusLevels: MythicPlusTrack[];
  raidDifficulties: RaidDifficultyLevel[];
  qualityThresholds: QualityThreshold[];
}

export interface MythicPlusTrack {
  minKeyLevel: number;
  maxKeyLevel?: number;
  itemLevel: number;
  trackName: 'Mythic' | 'Hero' | 'Champion' | 'Adventurer';
}

export interface RaidDifficultyLevel {
  difficulty: 'Mythic' | 'Heroic' | 'Normal' | 'LFR';
  itemLevel: number;
}

export interface QualityThreshold {
  minItemLevel: number;
  quality: 'Mythic' | 'Heroic' | 'Normal' | 'No reward';
}

@Injectable({
  providedIn: 'root'
})
export class ItemLevelConfigService {
  private readonly TWW_SEASON_1: SeasonConfig = {
    id: 'tww-s1',
    name: 'The War Within Season 1',
    mythicPlusLevels: [
      { minKeyLevel: 10, itemLevel: 707, trackName: 'Mythic' },
      { minKeyLevel: 7, maxKeyLevel: 9, itemLevel: 704, trackName: 'Hero' },
      { minKeyLevel: 6, maxKeyLevel: 6, itemLevel: 701, trackName: 'Hero' },
      { minKeyLevel: 4, maxKeyLevel: 5, itemLevel: 697, trackName: 'Hero' },
      { minKeyLevel: 2, maxKeyLevel: 3, itemLevel: 694, trackName: 'Champion' },
      { minKeyLevel: 0, maxKeyLevel: 1, itemLevel: 450, trackName: 'Adventurer' }
    ],
    raidDifficulties: [
      { difficulty: 'Mythic', itemLevel: 707 },
      { difficulty: 'Heroic', itemLevel: 701 },
      { difficulty: 'Normal', itemLevel: 680 },
      { difficulty: 'LFR', itemLevel: 450 }
    ],
    qualityThresholds: [
      { minItemLevel: 707, quality: 'Mythic' },
      { minItemLevel: 694, quality: 'Heroic' },
      { minItemLevel: 680, quality: 'Normal' },
      { minItemLevel: 0, quality: 'No reward' }
    ]
  };

  /**
   * Get the current season configuration
   * In the future, this could be dynamic based on current date or API
   */
  getCurrentSeason(): SeasonConfig {
    return this.TWW_SEASON_1;
  }

  /**
   * Get all available seasons (for future expansion)
   */
  getAllSeasons(): SeasonConfig[] {
    return [this.TWW_SEASON_1];
  }

  /**
   * Get Mythic+ item level based on key level
   */
  getMythicPlusItemLevel(keyLevel: number, seasonId?: string): number {
    const season = seasonId ? this.getSeasonById(seasonId) : this.getCurrentSeason();

    const track = season.mythicPlusLevels.find(level =>
      keyLevel >= level.minKeyLevel &&
      (level.maxKeyLevel === undefined || keyLevel <= level.maxKeyLevel)
    );

    return track?.itemLevel ?? 450;
  }

  /**
   * Get raid item level based on difficulty
   */
  getRaidItemLevel(difficulty: string, seasonId?: string): number {
    const season = seasonId ? this.getSeasonById(seasonId) : this.getCurrentSeason();

    const difficultyLevel = season.raidDifficulties.find(
      level => level.difficulty.toLowerCase() === difficulty.toLowerCase()
    );

    return difficultyLevel?.itemLevel ?? 463;
  }

  /**
   * Get item quality based on item level
   */
  getItemQuality(itemLevel: number, seasonId?: string): 'Mythic' | 'Heroic' | 'Normal' | 'No reward' {
    const season = seasonId ? this.getSeasonById(seasonId) : this.getCurrentSeason();

    // Sort thresholds in descending order to check highest first
    const sortedThresholds = [...season.qualityThresholds].sort(
      (a, b) => b.minItemLevel - a.minItemLevel
    );

    for (const threshold of sortedThresholds) {
      if (itemLevel >= threshold.minItemLevel) {
        return threshold.quality;
      }
    }

    return 'No reward';
  }

  /**
   * Get Mythic+ track name based on key level
   */
  getMythicPlusTrackName(keyLevel: number, seasonId?: string): string {
    const season = seasonId ? this.getSeasonById(seasonId) : this.getCurrentSeason();

    const track = season.mythicPlusLevels.find(level =>
      keyLevel >= level.minKeyLevel &&
      (level.maxKeyLevel === undefined || keyLevel <= level.maxKeyLevel)
    );

    return track?.trackName ?? 'Adventurer';
  }

  /**
   * Get season configuration by ID
   */
  private getSeasonById(seasonId: string): SeasonConfig {
    const seasons = this.getAllSeasons();
    const season = seasons.find(s => s.id === seasonId);

    if (!season) {
      console.warn(`Season ${seasonId} not found, falling back to current season`);
      return this.getCurrentSeason();
    }

    return season;
  }

  /**
   * Get all Mythic+ tracks for current season (useful for UI display)
   */
  getMythicPlusTracks(seasonId?: string): MythicPlusTrack[] {
    const season = seasonId ? this.getSeasonById(seasonId) : this.getCurrentSeason();
    return season.mythicPlusLevels;
  }

  /**
   * Get all raid difficulties for current season (useful for UI display)
   */
  getRaidDifficulties(seasonId?: string): RaidDifficultyLevel[] {
    const season = seasonId ? this.getSeasonById(seasonId) : this.getCurrentSeason();
    return season.raidDifficulties;
  }
}