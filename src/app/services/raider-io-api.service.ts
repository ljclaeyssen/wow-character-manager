import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface RaiderIoCharacterProfile {
  name: string;
  race: string;
  class: string;
  active_spec_name: string;
  active_spec_role: string;
  gender: string;
  faction: string;
  achievement_points: number;
  honorable_kills: number;
  thumbnail_url: string;
  region: string;
  realm: string;
  last_crawled_at: string;
  profile_url: string;
  profile_banner: string;
  mythic_plus_scores_by_season?: MythicPlusScoresBySeason[];
  gear?: CharacterGear;
}

export interface MythicPlusScoresBySeason {
  season: string;
  scores: {
    all: number;
    dps: number;
    healer: number;
    tank: number;
    spec_0: number;
    spec_1: number;
    spec_2: number;
    spec_3: number;
  };
}

export interface CharacterGear {
  updated_at: string;
  item_level_equipped: number;
  item_level_total: number;
  artifact_traits: number;
  corruption?: {
    added: number;
    resisted: number;
    total: number;
  };
  items: {
    head?: GearItem;
    neck?: GearItem;
    shoulder?: GearItem;
    back?: GearItem;
    chest?: GearItem;
    shirt?: GearItem;
    tabard?: GearItem;
    wrist?: GearItem;
    hands?: GearItem;
    waist?: GearItem;
    legs?: GearItem;
    feet?: GearItem;
    finger1?: GearItem;
    finger2?: GearItem;
    trinket1?: GearItem;
    trinket2?: GearItem;
    mainhand?: GearItem;
    offhand?: GearItem;
  };
}

export interface GearItem {
  item_id: number;
  item_level: number;
  enchant?: number;
  icon: string;
  name: string;
  item_quality: number;
  is_legendary: boolean;
  is_azerite: boolean;
  azerite_powers?: number[];
  corruption?: {
    added: number;
    resisted: number;
    total: number;
  };
  domination_shards?: number[];
  gems?: number[];
  bonuses?: number[];
  tier?: string;
}

export interface RaiderIoApiError {
  error: string;
  message: string;
  statusCode: number;
}

@Injectable({
  providedIn: 'root'
})
export class RaiderIoApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://raider.io/api/v1';

  /**
   * Fetch character profile from Raider.io API
   */
  getCharacterProfile(
    region: string,
    realm: string,
    name: string,
    fields: string[] = ['mythic_plus_scores_by_season:current', 'gear']
  ): Observable<RaiderIoCharacterProfile> {
    const params = new HttpParams()
      .set('region', region.toLowerCase())
      .set('realm', realm.toLowerCase())
      .set('name', name.toLowerCase())
      .set('fields', fields.join(','));

    return this.http.get<RaiderIoCharacterProfile>(
      `${this.baseUrl}/characters/profile`,
      { params }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get character's current mythic plus score
   */
  getCurrentMythicPlusScore(profile: RaiderIoCharacterProfile): number {
    if (!profile.mythic_plus_scores_by_season || profile.mythic_plus_scores_by_season.length === 0) {
      return 0;
    }

    // Get the most recent season (should be current)
    const currentSeason = profile.mythic_plus_scores_by_season[0];
    return currentSeason.scores.all || 0;
  }

  /**
   * Get character's current item level
   */
  getCurrentItemLevel(profile: RaiderIoCharacterProfile): number {
    return profile.gear?.item_level_equipped || 0;
  }

  /**
   * Check if character data is recent (within 24 hours)
   */
  isDataRecent(profile: RaiderIoCharacterProfile): boolean {
    if (!profile.last_crawled_at) return false;

    const lastCrawled = new Date(profile.last_crawled_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return lastCrawled > oneDayAgo;
  }

  /**
   * Format realm name for API call (remove spaces, special characters)
   */
  formatRealmName(realm: string): string {
    return realm
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Format character name for API call
   */
  formatCharacterName(name: string): string {
    return name.toLowerCase().trim();
  }

  private handleError = (error: any): Observable<never> => {
    let errorMessage = 'An error occurred while fetching character data';

    if (error.status === 404) {
      errorMessage = 'Character not found';
    } else if (error.status === 400) {
      errorMessage = 'Invalid realm or character name';
    } else if (error.status === 0) {
      errorMessage = 'Network error - please check your connection';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Raider.io API Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}