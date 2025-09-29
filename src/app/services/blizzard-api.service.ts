import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, timer } from 'rxjs';
import { map, catchError, switchMap, tap, retry, shareReplay } from 'rxjs/operators';
import { BlizzardApiCredentialsService } from './blizzard-api-credentials.service';
import { NotificationService } from './notification.service';

// OAuth2 Token Response
export interface BlizzardOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// Character Profile Interfaces
export interface BlizzardCharacterProfile {
  id: number;
  name: string;
  gender: {
    type: string;
    name: string;
  };
  faction: {
    type: string;
    name: string;
  };
  race: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  character_class: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  active_spec?: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  realm: {
    key: {
      href: string;
    };
    name: string;
    id: number;
    slug: string;
  };
  guild?: {
    key: {
      href: string;
    };
    name: string;
    id: number;
    realm: {
      key: {
        href: string;
      };
      name: string;
      id: number;
      slug: string;
    };
  };
  level: number;
  experience: number;
  achievement_points: number;
  last_login_timestamp: number;
  average_item_level: number;
  equipped_item_level: number;
}

// Character Equipment Summary
export interface BlizzardCharacterEquipment {
  character: {
    key: {
      href: string;
    };
    name: string;
    id: number;
    realm: {
      key: {
        href: string;
      };
      name: string;
      id: number;
      slug: string;
    };
  };
  equipped_items: BlizzardEquippedItem[];
}

export interface BlizzardEquippedItem {
  item: {
    key: {
      href: string;
    };
    id: number;
  };
  slot: {
    type: string;
    name: string;
  };
  quantity: number;
  context: number;
  bonus_list?: number[];
  quality: {
    type: string;
    name: string;
  };
  name: string;
  item_class: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  item_subclass: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  inventory_type: {
    type: string;
    name: string;
  };
  binding: {
    type: string;
    name: string;
  };
  armor?: {
    value: number;
    display: {
      display_string: string;
      color: {
        r: number;
        g: number;
        b: number;
        a: number;
      };
    };
  };
  stats?: Array<{
    type: {
      type: string;
      name: string;
    };
    value: number;
    display: {
      display_string: string;
      color: {
        r: number;
        g: number;
        b: number;
        a: number;
      };
    };
  }>;
  level: number;
  item_level: number;
}

// Character Mythic+ Profile
export interface BlizzardCharacterMythicKeystoneProfile {
  character: {
    key: {
      href: string;
    };
    name: string;
    id: number;
    realm: {
      key: {
        href: string;
      };
      name: string;
      id: number;
      slug: string;
    };
  };
  current_mythic_rating: {
    rating: number;
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
  current_period: {
    period: {
      key: {
        href: string;
      };
      id: number;
    };
    best_runs: BlizzardMythicKeystoneRun[];
  };
  seasons: Array<{
    key: {
      href: string;
    };
    id: number;
  }>;
}

export interface BlizzardMythicKeystoneRun {
  completed_timestamp: number;
  duration: number;
  keystone_level: number;
  keystone_affixes: Array<{
    key: {
      href: string;
    };
    name: string;
    id: number;
  }>;
  members: Array<{
    character: {
      name: string;
      id: number;
      realm: {
        key: {
          href: string;
        };
        name: string;
        id: number;
        slug: string;
      };
    };
    specialization: {
      key: {
        href: string;
      };
      name: string;
      id: number;
    };
    race: {
      key: {
        href: string;
      };
      name: string;
      id: number;
    };
    equipped_item_level: number;
  }>;
  dungeon: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  is_completed_within_time: boolean;
  mythic_rating: {
    rating: number;
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
  map_rating: {
    rating: number;
    color: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
  };
}

// API Configuration
export interface BlizzardApiConfig {
  region: 'us' | 'eu' | 'tw' | 'kr';
  locale: string;
}

// Token Storage Interface
interface StoredToken {
  access_token: string;
  token_type: string;
  expires_at: number;
  scope?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlizzardApiService {
  private readonly http = inject(HttpClient);
  private readonly credentialsService = inject(BlizzardApiCredentialsService);
  private readonly notificationService = inject(NotificationService);

  private readonly tokenSubject = new BehaviorSubject<StoredToken | null>(null);
  private readonly isAuthenticatingSubject = new BehaviorSubject<boolean>(false);

  // API Configuration
  private readonly baseUrls = {
    oauth: 'https://oauth.battle.net',
    us: 'https://us.api.blizzard.com',
    eu: 'https://eu.api.blizzard.com',
    tw: 'https://tw.api.blizzard.com',
    kr: 'https://kr.api.blizzard.com'
  };

  private readonly namespaces = {
    static: 'static',
    dynamic: 'dynamic',
    profile: 'profile'
  };

  // Observables
  public readonly token$ = this.tokenSubject.asObservable();
  public readonly isAuthenticated$ = this.token$.pipe(
    map(token => this.isTokenValid(token))
  );
  public readonly isAuthenticating$ = this.isAuthenticatingSubject.asObservable();

  // Signals
  public readonly isAuthenticated = signal(false);
  public readonly lastError = signal<string | null>(null);

  constructor() {
    this.loadTokenFromStorage();
    this.setupTokenExpirationCheck();

    // Subscribe to token changes to update signals
    this.token$.subscribe(token => {
      this.isAuthenticated.set(this.isTokenValid(token));
    });
  }

  /**
   * Authenticate with Blizzard API using client credentials flow
   */
  authenticate(): Observable<BlizzardOAuthToken> {
    const credentials = this.credentialsService.getCredentials();

    if (!credentials) {
      const error = 'No API credentials configured. Please configure your Client ID and Secret in Settings.';
      this.lastError.set(error);
      return throwError(() => new Error(error));
    }

    this.isAuthenticatingSubject.next(true);
    this.lastError.set(null);

    const authHeader = this.credentialsService.getAuthorizationHeader();
    if (!authHeader) {
      const error = 'Failed to generate authorization header';
      this.lastError.set(error);
      this.isAuthenticatingSubject.next(false);
      return throwError(() => new Error(error));
    }

    const headers = new HttpHeaders({
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    const body = new HttpParams()
      .set('grant_type', 'client_credentials');

    return this.http.post<BlizzardOAuthToken>(
      `${this.baseUrls.oauth}/token`,
      body.toString(),
      { headers }
    ).pipe(
      tap(token => {
        this.storeToken(token);
        this.isAuthenticatingSubject.next(false);
        console.log('Blizzard API authentication successful');
      }),
      catchError(error => {
        this.handleAuthError(error);
        this.isAuthenticatingSubject.next(false);
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Get character profile
   */
  getCharacterProfile(
    realmSlug: string,
    characterName: string,
    config?: BlizzardApiConfig
  ): Observable<BlizzardCharacterProfile> {
    return this.makeAuthenticatedRequest<BlizzardCharacterProfile>(
      `/profile/wow/character/${realmSlug}/${characterName.toLowerCase()}`,
      this.namespaces.profile,
      config
    );
  }

  /**
   * Get character equipment
   */
  getCharacterEquipment(
    realmSlug: string,
    characterName: string,
    config?: BlizzardApiConfig
  ): Observable<BlizzardCharacterEquipment> {
    return this.makeAuthenticatedRequest<BlizzardCharacterEquipment>(
      `/profile/wow/character/${realmSlug}/${characterName.toLowerCase()}/equipment`,
      this.namespaces.profile,
      config
    );
  }

  /**
   * Get character mythic keystone profile
   */
  getCharacterMythicKeystoneProfile(
    realmSlug: string,
    characterName: string,
    config?: BlizzardApiConfig
  ): Observable<BlizzardCharacterMythicKeystoneProfile> {
    return this.makeAuthenticatedRequest<BlizzardCharacterMythicKeystoneProfile>(
      `/profile/wow/character/${realmSlug}/${characterName.toLowerCase()}/mythic-keystone-profile`,
      this.namespaces.profile,
      config
    );
  }

  /**
   * Search for characters
   */
  searchCharacters(
    characterName: string,
    realmSlug?: string,
    config?: BlizzardApiConfig
  ): Observable<any> {
    const searchParams = new HttpParams()
      .set('name.en_US', characterName)
      .set('orderby', 'name')
      .set('_page', '1');

    if (realmSlug) {
      searchParams.set('realm', realmSlug);
    }

    return this.makeAuthenticatedRequest<any>(
      `/data/wow/search/character`,
      this.namespaces.dynamic,
      config,
      searchParams
    );
  }

  /**
   * Get character raid encounters
   */
  getCharacterRaidEncounters(
    realmSlug: string,
    characterName: string,
    config?: BlizzardApiConfig
  ): Observable<any> {
    return this.makeAuthenticatedRequest<any>(
      `/profile/wow/character/${realmSlug}/${characterName.toLowerCase()}/encounters/raids`,
      this.namespaces.profile,
      config
    );
  }

  /**
   * Get realm list
   */
  getRealms(config?: BlizzardApiConfig): Observable<any> {
    return this.makeAuthenticatedRequest<any>(
      '/data/wow/realm/index',
      this.namespaces.dynamic,
      config
    );
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(token: StoredToken | null = null): boolean {
    const currentToken = token || this.tokenSubject.value;
    if (!currentToken) {
      return false;
    }

    return Date.now() < currentToken.expires_at;
  }

  /**
   * Force token refresh
   */
  refreshToken(): Observable<BlizzardOAuthToken> {
    this.clearToken();
    return this.authenticate();
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.tokenSubject.next(null);
    localStorage.removeItem('blizzard-api-token');
    this.isAuthenticated.set(false);
  }

  /**
   * Get current token
   */
  getCurrentToken(): StoredToken | null {
    return this.tokenSubject.value;
  }

  /**
   * Make authenticated API request
   */
  private makeAuthenticatedRequest<T>(
    endpoint: string,
    namespace: string,
    config?: BlizzardApiConfig,
    additionalParams?: HttpParams
  ): Observable<T> {
    return this.ensureAuthenticated().pipe(
      switchMap(token => {
        const apiConfig = config || this.credentialsService.getApiConfig();
        const baseUrl = this.baseUrls[apiConfig.region];

        const headers = new HttpHeaders({
          'Authorization': `${token.token_type} ${token.access_token}`,
          'Content-Type': 'application/json'
        });

        let params = new HttpParams()
          .set('namespace', `${namespace}-${apiConfig.region}`)
          .set('locale', apiConfig.locale);

        if (additionalParams) {
          additionalParams.keys().forEach(key => {
            const values = additionalParams.getAll(key);
            if (values) {
              values.forEach(value => {
                params = params.append(key, value);
              });
            }
          });
        }

        return this.http.get<T>(`${baseUrl}${endpoint}`, { headers, params }).pipe(
          retry({ count: 2, delay: 1000 }),
          catchError(error => {
            if (error.status === 401) {
              // Token expired, try to refresh
              return this.refreshToken().pipe(
                switchMap(() => this.makeAuthenticatedRequest<T>(endpoint, namespace, config, additionalParams))
              );
            }
            return this.handleApiError<T>(error);
          })
        );
      })
    );
  }

  /**
   * Ensure we have a valid token
   */
  private ensureAuthenticated(): Observable<StoredToken> {
    const currentToken = this.tokenSubject.value;

    if (this.isTokenValid(currentToken)) {
      return of(currentToken!);
    }

    return this.authenticate().pipe(
      map(() => {
        const newToken = this.tokenSubject.value;
        if (!newToken) {
          throw new Error('Authentication failed');
        }
        return newToken;
      })
    );
  }

  /**
   * Store token in memory and localStorage
   */
  private storeToken(token: BlizzardOAuthToken): void {
    const storedToken: StoredToken = {
      access_token: token.access_token,
      token_type: token.token_type,
      expires_at: Date.now() + (token.expires_in * 1000) - 60000, // Subtract 1 minute for safety
      scope: token.scope
    };

    this.tokenSubject.next(storedToken);
    localStorage.setItem('blizzard-api-token', JSON.stringify(storedToken));
  }

  /**
   * Load token from localStorage on initialization
   */
  private loadTokenFromStorage(): void {
    try {
      const stored = localStorage.getItem('blizzard-api-token');
      if (stored) {
        const token: StoredToken = JSON.parse(stored);
        if (this.isTokenValid(token)) {
          this.tokenSubject.next(token);
        } else {
          localStorage.removeItem('blizzard-api-token');
        }
      }
    } catch (error) {
      console.error('Failed to load token from storage:', error);
      localStorage.removeItem('blizzard-api-token');
    }
  }

  /**
   * Setup automatic token expiration checking
   */
  private setupTokenExpirationCheck(): void {
    // Check token expiration every 5 minutes
    timer(0, 5 * 60 * 1000).pipe(
      tap(() => {
        const token = this.tokenSubject.value;
        if (token && !this.isTokenValid(token)) {
          this.clearToken();
        }
      })
    ).subscribe();
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: HttpErrorResponse): void {
    let errorMessage = 'Authentication failed';

    if (error.status === 401) {
      errorMessage = 'Invalid client credentials. Please check your Client ID and Secret.';
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.error?.error_description) {
      errorMessage = error.error.error_description;
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.lastError.set(errorMessage);
    console.error('Blizzard API authentication error:', error);
  }

  /**
   * Handle API errors
   */
  private handleApiError<T>(error: HttpErrorResponse): Observable<T> {
    let errorMessage = 'API request failed';

    if (error.status === 404) {
      errorMessage = 'Character or resource not found';
    } else if (error.status === 403) {
      errorMessage = 'Access forbidden. Check your API permissions.';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.error?.detail) {
      errorMessage = error.error.detail;
    }

    this.lastError.set(errorMessage);
    console.error('Blizzard API error:', error);
    return throwError(() => new Error(errorMessage));
  }
}