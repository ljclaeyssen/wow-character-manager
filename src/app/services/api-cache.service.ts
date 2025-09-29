import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { CachedApiData, CachedVaultRewards } from '../models/cached-api-data.model';

@Injectable({
  providedIn: 'root'
})
export class ApiCacheService {
  private readonly storageService = inject(StorageService);
  private readonly API_CACHE_KEY = 'wow-api-cache';
  private readonly VAULT_CACHE_KEY = 'wow-vault-cache';

  // Cache duration: 4 hours
  private readonly CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

  /**
   * Get cached API data for a character
   */
  getCachedApiData(characterId: string): CachedApiData | null {
    const cache = this.getApiCache();
    const cachedData = cache[characterId];

    if (!cachedData) {
      return null;
    }

    // Check if cache is expired
    const now = new Date();
    if (now > new Date(cachedData.cacheExpiry)) {
      // Remove expired cache
      delete cache[characterId];
      this.saveApiCache(cache);
      return null;
    }

    return {
      ...cachedData,
      lastFetched: new Date(cachedData.lastFetched),
      cacheExpiry: new Date(cachedData.cacheExpiry)
    };
  }

  /**
   * Save API data to cache
   */
  setCachedApiData(characterId: string, mythicKeystoneProfile: any, raidEncounters: any): void {
    const cache = this.getApiCache();
    const now = new Date();

    cache[characterId] = {
      characterId,
      mythicKeystoneProfile,
      raidEncounters,
      lastFetched: now,
      cacheExpiry: new Date(now.getTime() + this.CACHE_DURATION_MS)
    };

    this.saveApiCache(cache);
  }

  /**
   * Get cached vault rewards for a character
   */
  getCachedVaultRewards(characterId: string): CachedVaultRewards | null {
    const cache = this.getVaultCache();
    const cachedData = cache[characterId];

    if (!cachedData) {
      return null;
    }

    // Check if cache is expired
    const now = new Date();
    if (now > new Date(cachedData.cacheExpiry)) {
      // Remove expired cache
      delete cache[characterId];
      this.saveVaultCache(cache);
      return null;
    }

    return {
      ...cachedData,
      lastCalculated: new Date(cachedData.lastCalculated),
      cacheExpiry: new Date(cachedData.cacheExpiry)
    };
  }

  /**
   * Save vault rewards to cache
   */
  setCachedVaultRewards(characterId: string, vaultRewards: any): void {
    const cache = this.getVaultCache();
    const now = new Date();

    cache[characterId] = {
      characterId,
      vaultRewards,
      lastCalculated: now,
      cacheExpiry: new Date(now.getTime() + this.CACHE_DURATION_MS)
    };

    this.saveVaultCache(cache);
  }

  /**
   * Invalidate cache for a specific character
   */
  invalidateCharacterCache(characterId: string): void {
    const apiCache = this.getApiCache();
    const vaultCache = this.getVaultCache();

    delete apiCache[characterId];
    delete vaultCache[characterId];

    this.saveApiCache(apiCache);
    this.saveVaultCache(vaultCache);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.storageService.remove(this.API_CACHE_KEY);
    this.storageService.remove(this.VAULT_CACHE_KEY);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { apiCacheSize: number; vaultCacheSize: number; totalExpiredEntries: number } {
    const apiCache = this.getApiCache();
    const vaultCache = this.getVaultCache();
    const now = new Date();

    let expiredEntries = 0;

    // Count expired API cache entries
    Object.values(apiCache).forEach(entry => {
      if (now > new Date(entry.cacheExpiry)) {
        expiredEntries++;
      }
    });

    // Count expired vault cache entries
    Object.values(vaultCache).forEach(entry => {
      if (now > new Date(entry.cacheExpiry)) {
        expiredEntries++;
      }
    });

    return {
      apiCacheSize: Object.keys(apiCache).length,
      vaultCacheSize: Object.keys(vaultCache).length,
      totalExpiredEntries: expiredEntries
    };
  }

  /**
   * Get last update time for a character
   */
  getLastUpdateTime(characterId: string): Date | null {
    const cachedData = this.getCachedApiData(characterId);
    return cachedData?.lastFetched || null;
  }

  /**
   * Check if cache exists and is valid for a character
   */
  hasValidCache(characterId: string): boolean {
    return this.getCachedApiData(characterId) !== null;
  }

  // Private helper methods
  private getApiCache(): Record<string, CachedApiData> {
    const validator = (data: unknown): data is Record<string, CachedApiData> => {
      return typeof data === 'object' && data !== null;
    };

    return this.storageService.getWithValidation(this.API_CACHE_KEY, validator) || {};
  }

  private saveApiCache(cache: Record<string, CachedApiData>): void {
    this.storageService.set(this.API_CACHE_KEY, cache);
  }

  private getVaultCache(): Record<string, CachedVaultRewards> {
    const validator = (data: unknown): data is Record<string, CachedVaultRewards> => {
      return typeof data === 'object' && data !== null;
    };

    return this.storageService.getWithValidation(this.VAULT_CACHE_KEY, validator) || {};
  }

  private saveVaultCache(cache: Record<string, CachedVaultRewards>): void {
    this.storageService.set(this.VAULT_CACHE_KEY, cache);
  }
}