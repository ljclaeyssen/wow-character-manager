import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BlizzardApiService } from './blizzard-api.service';
import { Character } from '../models/character.model';
import { RaidEncounterParserService } from '../features/great-vault/services/raid-encounter-parser.service';
import { WeeklyResetService } from '../features/great-vault/services/weekly-reset.service';

export interface WeeklyProgress {
  dungeons: number;
  bosses: number;
  success: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WeeklyProgressService {
  private readonly blizzardApi = inject(BlizzardApiService);
  private readonly raidParserService = inject(RaidEncounterParserService);
  private readonly weeklyResetService = inject(WeeklyResetService);

  /**
   * Get weekly progress for a character (dungeons done and bosses killed this week)
   */
  getWeeklyProgress(character: Character): Observable<WeeklyProgress> {
    if (!this.blizzardApi.isAuthenticated()) {
      return of({
        dungeons: 0,
        bosses: 0,
        success: false,
        error: 'Blizzard API not authenticated'
      });
    }

    const realmSlug = this.formatRealmSlug(character.server);

    // Fetch both M+ and raid data in parallel
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
          // Count dungeons done this week
          const dungeons = this.countWeeklyDungeons(mythicKeystone);

          // Count bosses killed this week
          const bosses = this.countWeeklyBosses(raidEncounters);

          return {
            dungeons,
            bosses,
            success: true
          };
        } catch (error) {
          console.error('Error calculating weekly progress:', error);
          return {
            dungeons: 0,
            bosses: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          };
        }
      }),
      catchError(error => of({
        dungeons: 0,
        bosses: 0,
        success: false,
        error: error.message || 'Failed to fetch character data'
      }))
    );
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
   * Format realm name to slug format
   */
  private formatRealmSlug(realmName: string): string {
    return realmName
      .toLowerCase()
      .replace(/'/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
}