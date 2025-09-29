import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Character } from '../models/character.model';
import { CharacterStore } from '../store/character.store';
import { RaiderIoApiService } from './raider-io-api.service';
import { RaiderIoMapperHelper } from './helpers/raider-io-mapper.helper';

export interface RefreshResult {
  total: number;
  successful: number;
  failed: number;
  details: Array<{
    characterName: string;
    success: boolean;
    error?: string;
    itemLevel?: number;
    rioScore?: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class CharacterRefreshService {
  private readonly characterStore = inject(CharacterStore);
  private readonly raiderIoApi = inject(RaiderIoApiService);
  private readonly raiderIoMapper = inject(RaiderIoMapperHelper);

  /**
   * Refresh progression data (item level & RIO score) for all characters
   */
  refreshAllCharacters(): Observable<RefreshResult> {
    const characters = this.characterStore.entities();

    if (characters.length === 0) {
      return of({
        total: 0,
        successful: 0,
        failed: 0,
        details: []
      });
    }

    console.log(`Starting refresh for ${characters.length} characters...`);

    // Create API requests for all characters
    const refreshRequests = characters.map((character: Character) =>
      this.refreshSingleCharacter(character)
    );

    // Execute all API requests in parallel
    return forkJoin(refreshRequests).pipe(
      map((results: Array<{ characterName: string; success: boolean; error?: string; itemLevel?: number; rioScore?: number }>) => {
        const successful = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        const summary: RefreshResult = {
          total: characters.length,
          successful,
          failed,
          details: results
        };

        console.log(`Refresh completed: ${successful} updated, ${failed} failed`);
        return summary;
      })
    );
  }

  /**
   * Refresh progression data for a single character
   */
  refreshSingleCharacter(character: Character): Observable<{ characterName: string; success: boolean; error?: string; itemLevel?: number; rioScore?: number }> {
    const formattedRealm = this.raiderIoApi.formatRealmName(character.server);
    const formattedName = this.raiderIoApi.formatCharacterName(character.name);
    const region = 'eu'; // Could be made configurable

    return this.raiderIoApi.getCharacterProfile(region, formattedRealm, formattedName).pipe(
      map(profile => {
        // Update character with fresh API data
        const updatedCharacter = this.raiderIoMapper.updateCharacterWithApiData(character, profile);
        this.characterStore.updateCharacter(character.id, updatedCharacter);

        console.log(`Updated ${character.name}:`, {
          itemLevel: updatedCharacter.itemLevel,
          rioScore: updatedCharacter.rioScore
        });

        return {
          characterName: character.name,
          success: true,
          itemLevel: updatedCharacter.itemLevel,
          rioScore: updatedCharacter.rioScore
        };
      }),
      catchError(error => {
        console.warn(`Failed to refresh character ${character.name}:`, error);
        return of({
          characterName: character.name,
          success: false,
          error: error.message || 'Unknown error'
        });
      })
    );
  }

  /**
   * Create a character with API validation and data enrichment
   */
  createCharacterWithApiData(
    name: string,
    server: string,
    professions: any[] = []
  ): Observable<Character> {
    const formattedRealm = this.raiderIoApi.formatRealmName(server);
    const formattedName = this.raiderIoApi.formatCharacterName(name);
    const region = 'eu'; // Could be made configurable

    return this.raiderIoApi.getCharacterProfile(region, formattedRealm, formattedName).pipe(
      map(profile => {
        // Create character with API data
        const character = this.raiderIoMapper.mapProfileToCharacter(
          profile,
          professions,
          {
            id: crypto.randomUUID(),
            server: server // Use user-provided server name
          }
        );

        console.log('Character created with Raider.io data:', {
          name: character.name,
          itemLevel: character.itemLevel,
          rioScore: character.rioScore
        });

        return character;
      })
    );
  }

  /**
   * Get character progression summary
   */
  getProgressionSummary(character: Character): {
    itemLevel: number;
    rioScore: number;
    hasData: boolean;
    dataFreshness?: string;
  } {
    const progression = this.raiderIoMapper.getCharacterProgression({
      gear: { item_level_equipped: character.itemLevel || 0 },
      mythic_plus_scores_by_season: character.rioScore ? [{
        season: 'current',
        scores: { all: character.rioScore, dps: 0, healer: 0, tank: 0, spec_0: 0, spec_1: 0, spec_2: 0, spec_3: 0 }
      }] : [],
      last_crawled_at: character.lastApiUpdateAt?.toISOString()
    } as any);

    return {
      itemLevel: progression.itemLevel,
      rioScore: progression.rioScore,
      hasData: progression.itemLevel > 0 || progression.rioScore > 0,
      dataFreshness: character.lastApiUpdateAt
        ? this.raiderIoMapper.getDataFreshnessDescription({
            last_crawled_at: character.lastApiUpdateAt.toISOString()
          } as any)
        : undefined
    };
  }
}