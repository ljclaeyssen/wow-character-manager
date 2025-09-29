import { Injectable } from '@angular/core';
import { Faction } from '../../enums/faction.enum';
import { Race } from '../../enums/race.enum';
import { CharacterClass } from '../../enums/class.enum';
import { RaiderIoCharacterProfile } from '../raider-io-api.service';
import { Character } from '../../models/character.model';
import { Profession } from '../../enums/profession.enum';

@Injectable({
  providedIn: 'root'
})
export class RaiderIoMapperHelper {

  /**
   * Map a complete Raider.IO character profile to our Character model
   */
  mapProfileToCharacter(
    profile: RaiderIoCharacterProfile,
    professions: Profession[] = [],
    existingCharacter?: Partial<Character>
  ): Character {
    return {
      id: existingCharacter?.id || crypto.randomUUID(),
      name: profile.name,
      server: existingCharacter?.server || profile.realm,
      faction: this.mapFactionFromApi(profile.faction),
      race: this.mapRaceFromApi(profile.race),
      characterClass: this.mapClassFromApi(profile.class),
      specialization: profile.active_spec_name,
      professions: professions,
      itemLevel: profile.gear?.item_level_equipped || undefined,
      rioScore: this.getCurrentMythicPlusScore(profile) || undefined,
      createdAt: existingCharacter?.createdAt || new Date(),
      updatedAt: new Date(),
      lastApiUpdateAt: new Date()
    };
  }

  /**
   * Update an existing character with fresh API data
   */
  updateCharacterWithApiData(
    character: Character,
    profile: RaiderIoCharacterProfile
  ): Character {
    return {
      ...character,
      // Update character info from API (keep local professions)
      faction: this.mapFactionFromApi(profile.faction),
      race: this.mapRaceFromApi(profile.race),
      characterClass: this.mapClassFromApi(profile.class),
      specialization: profile.active_spec_name,
      itemLevel: profile.gear?.item_level_equipped || undefined,
      rioScore: this.getCurrentMythicPlusScore(profile) || undefined,
      updatedAt: new Date(),
      lastApiUpdateAt: new Date()
    };
  }

  /**
   * Map Raider.IO faction string to our Faction enum
   */
  mapFactionFromApi(apiFaction: string): Faction {
    return apiFaction.toLowerCase() === 'alliance' ? Faction.Alliance : Faction.Horde;
  }

  /**
   * Map Raider.IO race string to our Race enum
   */
  mapRaceFromApi(apiRace: string): Race {
    const raceMap: Record<string, Race> = {
      // Alliance Races
      'human': Race.Human,
      'night elf': Race.NightElf,
      'dwarf': Race.Dwarf,
      'gnome': Race.Gnome,
      'draenei': Race.Draenei,
      'worgen': Race.Worgen,
      'void elf': Race.VoidElf,
      'lightforged draenei': Race.LightforgedDraenei,
      'dark iron dwarf': Race.DarkIronDwarf,
      'kul tiran': Race.KulTiran,
      'mechagnome': Race.Mechagnome,

      // Horde Races
      'orc': Race.Orc,
      'undead': Race.Undead,
      'forsaken': Race.Undead, // Alternative name
      'tauren': Race.Tauren,
      'troll': Race.Troll,
      'blood elf': Race.BloodElf,
      'goblin': Race.Goblin,
      'nightborne': Race.Nightborne,
      'highmountain tauren': Race.HighmountainTauren,
      'mag\'har orc': Race.MagharOrc,
      'zandalari troll': Race.ZandalariTroll,
      'vulpera': Race.Vulpera,

      // Neutral Races
      'pandaren': Race.Pandaren,
      'dracthyr': Race.Dracthyr
    };

    const normalizedRace = apiRace.toLowerCase().trim();
    return raceMap[normalizedRace] || Race.Human; // Default fallback
  }

  /**
   * Map Raider.IO class string to our CharacterClass enum
   */
  mapClassFromApi(apiClass: string): CharacterClass {
    const classMap: Record<string, CharacterClass> = {
      'warrior': CharacterClass.Warrior,
      'paladin': CharacterClass.Paladin,
      'hunter': CharacterClass.Hunter,
      'rogue': CharacterClass.Rogue,
      'priest': CharacterClass.Priest,
      'death knight': CharacterClass.DeathKnight,
      'shaman': CharacterClass.Shaman,
      'mage': CharacterClass.Mage,
      'warlock': CharacterClass.Warlock,
      'monk': CharacterClass.Monk,
      'druid': CharacterClass.Druid,
      'demon hunter': CharacterClass.DemonHunter,
      'evoker': CharacterClass.Evoker
    };

    const normalizedClass = apiClass.toLowerCase().trim();
    return classMap[normalizedClass] || CharacterClass.Warrior; // Default fallback
  }

  /**
   * Get additional character info from API profile
   */
  getCharacterStats(profile: RaiderIoCharacterProfile) {
    return {
      achievementPoints: profile.achievement_points || 0,
      honorableKills: profile.honorable_kills || 0,
      itemLevel: profile.gear?.item_level_equipped || 0,
      mythicPlusScore: this.getCurrentMythicPlusScore(profile),
      thumbnailUrl: profile.thumbnail_url,
      profileUrl: profile.profile_url,
      lastCrawledAt: profile.last_crawled_at ? new Date(profile.last_crawled_at) : null
    };
  }

  /**
   * Extract just the core character progression data
   */
  getCharacterProgression(profile: RaiderIoCharacterProfile) {
    return {
      itemLevel: profile.gear?.item_level_equipped || 0,
      rioScore: this.getCurrentMythicPlusScore(profile) || 0
    };
  }

  /**
   * Get character's current mythic plus score
   */
  private getCurrentMythicPlusScore(profile: RaiderIoCharacterProfile): number {
    if (!profile.mythic_plus_scores_by_season || profile.mythic_plus_scores_by_season.length === 0) {
      return 0;
    }

    // Get the most recent season (should be current)
    const currentSeason = profile.mythic_plus_scores_by_season[0];
    return currentSeason.scores.all || 0;
  }

  /**
   * Check if API data is recent (within specified hours)
   */
  isApiDataRecent(profile: RaiderIoCharacterProfile, hoursThreshold: number = 24): boolean {
    if (!profile.last_crawled_at) return false;

    const lastCrawled = new Date(profile.last_crawled_at);
    const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    return lastCrawled > threshold;
  }

  /**
   * Get a human-readable description of when the data was last updated
   */
  getDataFreshnessDescription(profile: RaiderIoCharacterProfile): string {
    if (!profile.last_crawled_at) return 'Unknown';

    const lastCrawled = new Date(profile.last_crawled_at);
    const now = new Date();
    const diffMs = now.getTime() - lastCrawled.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return `Over a week ago`;
  }
}