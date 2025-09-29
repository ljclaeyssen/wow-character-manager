import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { BlizzardApiService, BlizzardCharacterProfile, BlizzardCharacterEquipment, BlizzardCharacterMythicKeystoneProfile } from './blizzard-api.service';
import { Character } from '../models/character.model';
import { MythicPlusRun as ActivityMythicPlusRun } from '../models/activity.model';
import { Race } from '../enums/race.enum';
import { Faction } from '../enums/faction.enum';
import { CharacterClass } from '../enums/class.enum';

export interface BlizzardCharacterData {
  profile: BlizzardCharacterProfile;
  equipment: BlizzardCharacterEquipment;
  mythicKeystone: BlizzardCharacterMythicKeystoneProfile;
}

export interface BlizzardRefreshResult {
  character: Character;
  mythicRuns: ActivityMythicPlusRun[];
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlizzardCharacterIntegrationService {
  private readonly blizzardApi = inject(BlizzardApiService);

  /**
   * Fetch complete character data from Blizzard API
   */
  fetchCharacterData(
    realmSlug: string,
    characterName: string
  ): Observable<BlizzardCharacterData> {
    const profile$ = this.blizzardApi.getCharacterProfile(realmSlug, characterName);
    const equipment$ = this.blizzardApi.getCharacterEquipment(realmSlug, characterName);
    const mythicKeystone$ = this.blizzardApi.getCharacterMythicKeystoneProfile(realmSlug, characterName);

    return forkJoin({
      profile: profile$,
      equipment: equipment$.pipe(catchError(() => of(null))), // Equipment might not be available
      mythicKeystone: mythicKeystone$.pipe(catchError(() => of(null))) // M+ profile might not exist
    }).pipe(
      map(({ profile, equipment, mythicKeystone }) => ({
        profile,
        equipment: equipment!,
        mythicKeystone: mythicKeystone!
      }))
    );
  }

  /**
   * Create a Character from Blizzard API data
   */
  createCharacterFromBlizzardData(
    blizzardData: BlizzardCharacterData,
    professions: any[] = []
  ): Character {
    const { profile, equipment } = blizzardData;

    return {
      id: crypto.randomUUID(),
      name: profile.name,
      race: this.mapBlizzardRaceToEnum(profile.race.name),
      faction: this.mapBlizzardFactionToEnum(profile.faction.name),
      characterClass: this.mapBlizzardClassToEnum(profile.character_class.name),
      specialization: profile.active_spec?.name || 'Unknown',
      professions: professions,
      server: profile.realm.name,
      itemLevel: equipment?.equipped_items ? this.calculateAverageItemLevel(equipment.equipped_items) : profile.equipped_item_level,
      rioScore: blizzardData.mythicKeystone?.current_mythic_rating?.rating || 0,
      lastApiUpdateAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Update existing character with fresh Blizzard API data
   */
  updateCharacterWithBlizzardData(
    existingCharacter: Character,
    blizzardData: BlizzardCharacterData
  ): Character {
    const { profile, equipment, mythicKeystone } = blizzardData;

    return {
      ...existingCharacter,
      itemLevel: equipment?.equipped_items ? this.calculateAverageItemLevel(equipment.equipped_items) : profile.equipped_item_level,
      rioScore: mythicKeystone?.current_mythic_rating?.rating || 0,
      specialization: profile.active_spec?.name || existingCharacter.specialization,
      lastApiUpdateAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Extract Mythic+ runs from Blizzard API data
   */
  extractMythicPlusRuns(mythicKeystoneProfile: BlizzardCharacterMythicKeystoneProfile): ActivityMythicPlusRun[] {
    if (!mythicKeystoneProfile?.current_period?.best_runs) {
      return [];
    }

    return mythicKeystoneProfile.current_period.best_runs
      .map((run: any) => ({
        keyLevel: run.keystone_level,
        dungeon: run.dungeon.name,
        inTime: run.is_completed_within_time,
        timestamp: new Date(run.completed_timestamp)
      }))
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Validate character exists on realm
   */
  validateCharacterExists(
    realmSlug: string,
    characterName: string
  ): Observable<boolean> {
    return this.blizzardApi.getCharacterProfile(realmSlug, characterName).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Search for characters by name
   */
  searchCharacters(characterName: string, realmSlug?: string): Observable<any[]> {
    return this.blizzardApi.searchCharacters(characterName, realmSlug).pipe(
      map(response => response.results || []),
      catchError(() => of([]))
    );
  }

  /**
   * Get available realms for region
   */
  getAvailableRealms(): Observable<any[]> {
    return this.blizzardApi.getRealms().pipe(
      map(response => response.realms || []),
      catchError(() => of([]))
    );
  }

  /**
   * Refresh character data and extract activity information
   */
  refreshCharacterData(character: Character): Observable<BlizzardRefreshResult> {
    const realmSlug = this.formatRealmSlug(character.server);

    return this.fetchCharacterData(realmSlug, character.name).pipe(
      map(blizzardData => {
        const updatedCharacter = this.updateCharacterWithBlizzardData(character, blizzardData);
        const mythicRuns = blizzardData.mythicKeystone
          ? this.extractMythicPlusRuns(blizzardData.mythicKeystone)
          : [];

        return {
          character: updatedCharacter,
          mythicRuns,
          success: true
        };
      }),
      catchError(error => of({
        character,
        mythicRuns: [],
        success: false,
        error: error.message || 'Failed to refresh character data'
      }))
    );
  }

  /**
   * Create character with validation from Blizzard API
   */
  createCharacterWithValidation(
    realmSlug: string,
    characterName: string,
    professions: any[] = []
  ): Observable<BlizzardRefreshResult> {
    return this.fetchCharacterData(realmSlug, characterName).pipe(
      map(blizzardData => {
        const character = this.createCharacterFromBlizzardData(blizzardData, professions);
        const mythicRuns = blizzardData.mythicKeystone
          ? this.extractMythicPlusRuns(blizzardData.mythicKeystone)
          : [];

        return {
          character,
          mythicRuns,
          success: true
        };
      }),
      catchError(error => {
        // Create a minimal character if API fails, but mark as unsuccessful
        const character: Character = {
          id: crypto.randomUUID(),
          name: characterName,
          race: Race.Human, // Default values
          faction: Faction.Alliance,
          characterClass: CharacterClass.Warrior,
          specialization: 'Unknown',
          professions,
          server: realmSlug,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        return of({
          character,
          mythicRuns: [],
          success: false,
          error: error.message || 'Failed to fetch character data from Blizzard API'
        });
      })
    );
  }

  /**
   * Check if Blizzard API is available and configured
   */
  isBlizzardApiAvailable(): boolean {
    return this.blizzardApi.isAuthenticated();
  }

  /**
   * Authenticate with Blizzard API
   */
  authenticateWithBlizzard(): Observable<boolean> {
    return this.blizzardApi.authenticate().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Private helper methods

  /**
   * Calculate average item level from equipped items
   */
  private calculateAverageItemLevel(equippedItems: any[]): number {
    if (!equippedItems || equippedItems.length === 0) {
      return 0;
    }

    const totalItemLevel = equippedItems
      .filter(item => item.item_level && item.item_level > 0)
      .reduce((sum, item) => sum + item.item_level, 0);

    return Math.round(totalItemLevel / equippedItems.length);
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
   * Map Blizzard race name to our Race enum
   */
  private mapBlizzardRaceToEnum(raceName: string): Race {
    const raceMapping: { [key: string]: Race } = {
      'Human': Race.Human,
      'Orc': Race.Orc,
      'Dwarf': Race.Dwarf,
      'Night Elf': Race.NightElf,
      'Undead': Race.Undead,
      'Tauren': Race.Tauren,
      'Gnome': Race.Gnome,
      'Troll': Race.Troll,
      'Goblin': Race.Goblin,
      'Blood Elf': Race.BloodElf,
      'Draenei': Race.Draenei,
      'Worgen': Race.Worgen,
      'Pandaren': Race.Pandaren,
      'Void Elf': Race.VoidElf,
      'Lightforged Draenei': Race.LightforgedDraenei,
      'Dark Iron Dwarf': Race.DarkIronDwarf,
      'Kul Tiran': Race.KulTiran,
      'Mechagnome': Race.Mechagnome,
      'Nightborne': Race.Nightborne,
      'Highmountain Tauren': Race.HighmountainTauren,
      "Mag'har Orc": Race.MagharOrc,
      'Zandalari Troll': Race.ZandalariTroll,
      'Vulpera': Race.Vulpera,
      'Dracthyr': Race.Dracthyr
    };

    return raceMapping[raceName] || Race.Human;
  }

  /**
   * Map Blizzard faction name to our Faction enum
   */
  private mapBlizzardFactionToEnum(factionName: string): Faction {
    const factionMapping: { [key: string]: Faction } = {
      'Alliance': Faction.Alliance,
      'Horde': Faction.Horde
    };

    return factionMapping[factionName] || Faction.Alliance;
  }

  /**
   * Map Blizzard class name to our CharacterClass enum
   */
  private mapBlizzardClassToEnum(className: string): CharacterClass {
    const classMapping: { [key: string]: CharacterClass } = {
      'Death Knight': CharacterClass.DeathKnight,
      'Demon Hunter': CharacterClass.DemonHunter,
      'Druid': CharacterClass.Druid,
      'Evoker': CharacterClass.Evoker,
      'Hunter': CharacterClass.Hunter,
      'Mage': CharacterClass.Mage,
      'Monk': CharacterClass.Monk,
      'Paladin': CharacterClass.Paladin,
      'Priest': CharacterClass.Priest,
      'Rogue': CharacterClass.Rogue,
      'Shaman': CharacterClass.Shaman,
      'Warlock': CharacterClass.Warlock,
      'Warrior': CharacterClass.Warrior
    };

    return classMapping[className] || CharacterClass.Warrior;
  }
}