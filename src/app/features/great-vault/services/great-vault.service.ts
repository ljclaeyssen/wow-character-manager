import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { BlizzardApiService } from '../../../services/blizzard-api.service';
import { Character } from '../../../models/character.model';
import { GreatVaultProgress, GreatVaultSummary, RaidBossKill } from '../models/great-vault.model';
import { GreatVaultCalculationService } from './great-vault-calculation.service';
import { RaidEncounterParserService } from './raid-encounter-parser.service';
import { WeeklyResetService } from './weekly-reset.service';

export interface GreatVaultRefreshResult {
  success: boolean;
  progress: GreatVaultProgress | null;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GreatVaultService {
  private readonly blizzardApi = inject(BlizzardApiService);
  private readonly calculationService = inject(GreatVaultCalculationService);
  private readonly raidParserService = inject(RaidEncounterParserService);
  private readonly weeklyResetService = inject(WeeklyResetService);

  /**
   * Get Great Vault progress for a character
   */
  getCharacterGreatVaultProgress(character: Character): Observable<GreatVaultRefreshResult> {
    if (!this.blizzardApi.isAuthenticated()) {
      return of({
        success: false,
        progress: null,
        error: 'Blizzard API not authenticated'
      });
    }

    const realmSlug = this.formatRealmSlug(character.server);

    // Fetch all required data in parallel
    const mythicKeystone$ = this.blizzardApi.getCharacterMythicKeystoneProfile(realmSlug, character.name)
      .pipe(catchError(() => of(null)));

    const raidEncounters$ = this.blizzardApi.getCharacterRaidEncounters(realmSlug, character.name)
      .pipe(catchError(() => of(null)));

    return forkJoin({
      mythicKeystone: mythicKeystone$,
      raidEncounters: raidEncounters$
    }).pipe(
      map(({ mythicKeystone, raidEncounters }) => {
        try {
          // Parse Mythic+ runs from current period
          const mythicRuns = mythicKeystone?.current_period?.best_runs || [];

          // Parse raid encounters
          const raidBossKills = raidEncounters
            ? this.raidParserService.parseRaidEncounters(raidEncounters)
            : [];

          // Calculate Great Vault progress
          const progress = this.calculationService.calculateGreatVaultProgress(
            character.id,
            character.name,
            mythicRuns,
            raidBossKills,
            0, // PvP honor - not available via API yet
            0  // PvP rating - not available via API yet
          );

          return {
            success: true,
            progress,
            error: undefined
          };
        } catch (error) {
          console.error('Error calculating Great Vault progress:', error);
          return {
            success: false,
            progress: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }),
      catchError(error => of({
        success: false,
        progress: null,
        error: error.message || 'Failed to fetch character data'
      }))
    );
  }

  /**
   * Get Great Vault progress for multiple characters
   */
  getMultipleCharactersProgress(characters: Character[]): Observable<Map<string, GreatVaultProgress>> {
    if (characters.length === 0) {
      return of(new Map());
    }

    const progressRequests = characters.map(character =>
      this.getCharacterGreatVaultProgress(character).pipe(
        map(result => ({
          characterId: character.id,
          progress: result.progress
        }))
      )
    );

    return forkJoin(progressRequests).pipe(
      map(results => {
        const progressMap = new Map<string, GreatVaultProgress>();

        for (const result of results) {
          if (result.progress) {
            progressMap.set(result.characterId, result.progress);
          }
        }

        return progressMap;
      })
    );
  }

  /**
   * Create summary from progress
   */
  createSummary(progress: GreatVaultProgress): GreatVaultSummary {
    return this.calculationService.createSummary(progress);
  }

  /**
   * Get weekly reset information
   */
  getWeeklyResetInfo() {
    return this.weeklyResetService.getCurrentWeeklyReset();
  }

  /**
   * Format time until reset
   */
  formatTimeUntilReset() {
    const reset = this.weeklyResetService.getCurrentWeeklyReset();
    return this.weeklyResetService.formatTimeUntilReset(reset);
  }

  /**
   * Check if Great Vault tracking is available
   */
  isTrackingAvailable(): boolean {
    return this.blizzardApi.isAuthenticated();
  }

  /**
   * Authenticate with Blizzard API if needed
   */
  ensureAuthentication(): Observable<boolean> {
    if (this.blizzardApi.isAuthenticated()) {
      return of(true);
    }

    return this.blizzardApi.authenticate().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Validate character data requirements
   */
  validateCharacterData(character: Character): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    if (!character.name) missingFields.push('name');
    if (!character.server) missingFields.push('server');

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Get detailed raid progress information
   */
  getRaidProgressDetails(raidBossKills: RaidBossKill[]) {
    return this.raidParserService.getRaidProgressSummary(raidBossKills);
  }

  /**
   * Get unique boss kills from raid encounters
   */
  getUniqueBossKills(raidBossKills: RaidBossKill[]) {
    return this.raidParserService.getUniqueBossKills(raidBossKills);
  }

  // Private helper methods

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
   * Log debug information
   */
  private logDebug(message: string, data?: any) {
    if (console.debug) {
      console.debug(`[GreatVaultService] ${message}`, data);
    }
  }
}