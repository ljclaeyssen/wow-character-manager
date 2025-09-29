import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';

export interface BlizzardApiCredentials {
  clientId: string;
  clientSecret: string;
  savedAt?: Date;
}

export interface BlizzardApiConfig {
  region: 'us' | 'eu' | 'tw' | 'kr';
  locale: string;
}

@Injectable({
  providedIn: 'root'
})
export class BlizzardApiCredentialsService {
  private readonly storageService = inject(StorageService);
  private readonly STORAGE_KEY = 'blizzard-api-credentials';
  private readonly CONFIG_STORAGE_KEY = 'blizzard-api-config';

  private readonly credentialsSignal = signal<BlizzardApiCredentials | null>(null);

  constructor() {
    this.loadCredentialsFromStorage();
  }

  /**
   * Check if credentials are stored and available
   */
  hasCredentials(): boolean {
    const credentials = this.credentialsSignal();
    return !!(credentials?.clientId && credentials?.clientSecret);
  }

  /**
   * Get stored credentials
   */
  getCredentials(): BlizzardApiCredentials | null {
    return this.credentialsSignal();
  }

  /**
   * Save credentials to localStorage
   */
  saveCredentials(credentials: Omit<BlizzardApiCredentials, 'savedAt'>): boolean {
    try {
      if (!credentials.clientId?.trim() || !credentials.clientSecret?.trim()) {
        throw new Error('Client ID and Client Secret are required');
      }

      const credentialsWithTimestamp: BlizzardApiCredentials = {
        ...credentials,
        clientId: credentials.clientId.trim(),
        clientSecret: credentials.clientSecret.trim(),
        savedAt: new Date()
      };

      const success = this.storageService.set(this.STORAGE_KEY, credentialsWithTimestamp);

      if (success) {
        this.credentialsSignal.set(credentialsWithTimestamp);
        console.log('Blizzard API credentials saved successfully');
        return true;
      }

      throw new Error('Failed to save credentials to storage');
    } catch (error) {
      console.error('Error saving Blizzard API credentials:', error);
      return false;
    }
  }

  /**
   * Clear stored credentials
   */
  clearCredentials(): boolean {
    try {
      const success = this.storageService.remove(this.STORAGE_KEY);

      if (success) {
        this.credentialsSignal.set(null);
        console.log('Blizzard API credentials cleared');
        return true;
      }

      throw new Error('Failed to clear credentials from storage');
    } catch (error) {
      console.error('Error clearing Blizzard API credentials:', error);
      return false;
    }
  }

  /**
   * Validate credentials format
   */
  validateCredentials(credentials: Partial<BlizzardApiCredentials>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!credentials.clientId?.trim()) {
      errors.push('Client ID is required');
    } else if (credentials.clientId.length < 10) {
      errors.push('Client ID must be at least 10 characters');
    } else if (!/^[a-zA-Z0-9]+$/.test(credentials.clientId)) {
      errors.push('Client ID must contain only alphanumeric characters');
    }

    if (!credentials.clientSecret?.trim()) {
      errors.push('Client Secret is required');
    } else if (credentials.clientSecret.length < 10) {
      errors.push('Client Secret must be at least 10 characters');
    } else if (!/^[a-zA-Z0-9]+$/.test(credentials.clientSecret)) {
      errors.push('Client Secret must contain only alphanumeric characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get API configuration (region, locale)
   */
  getApiConfig(): BlizzardApiConfig {
    const stored = this.storageService.get(this.CONFIG_STORAGE_KEY) as BlizzardApiConfig;

    return {
      region: stored?.region || 'eu',
      locale: stored?.locale || 'en_US'
    };
  }

  /**
   * Save API configuration
   */
  saveApiConfig(config: BlizzardApiConfig): boolean {
    try {
      return this.storageService.set(this.CONFIG_STORAGE_KEY, config);
    } catch (error) {
      console.error('Error saving Blizzard API config:', error);
      return false;
    }
  }

  /**
   * Get credentials status information
   */
  getCredentialsStatus(): {
    hasCredentials: boolean;
    savedAt: Date | null;
    isExpired: boolean;
    daysOld: number;
  } {
    const credentials = this.credentialsSignal();

    if (!credentials?.savedAt) {
      return {
        hasCredentials: this.hasCredentials(),
        savedAt: null,
        isExpired: false,
        daysOld: 0
      };
    }

    const savedAt = new Date(credentials.savedAt);
    const now = new Date();
    const daysOld = Math.floor((now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysOld > 90; // Consider credentials old after 90 days

    return {
      hasCredentials: this.hasCredentials(),
      savedAt,
      isExpired,
      daysOld
    };
  }

  /**
   * Generate basic auth header for Blizzard API
   */
  getAuthorizationHeader(): string | null {
    const credentials = this.credentialsSignal();

    if (!credentials?.clientId || !credentials?.clientSecret) {
      return null;
    }

    // Create base64 encoded client_id:client_secret
    const auth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
    return `Basic ${auth}`;
  }

  /**
   * Check if credentials appear to be valid format
   */
  areCredentialsValidFormat(): boolean {
    const credentials = this.credentialsSignal();

    if (!credentials) {
      return false;
    }

    const validation = this.validateCredentials(credentials);
    return validation.isValid;
  }

  /**
   * Load credentials from storage on initialization
   */
  private loadCredentialsFromStorage(): void {
    try {
      const validator = (data: unknown): data is BlizzardApiCredentials => {
        return typeof data === 'object' && data !== null &&
               'clientId' in data && typeof (data as any).clientId === 'string' &&
               'clientSecret' in data && typeof (data as any).clientSecret === 'string';
      };

      const stored = this.storageService.getWithValidation(this.STORAGE_KEY, validator);

      if (stored) {
        // Convert savedAt string back to Date if it exists
        if (stored.savedAt) {
          stored.savedAt = new Date(stored.savedAt);
        }

        this.credentialsSignal.set(stored);
        console.log('Blizzard API credentials loaded from storage');
      }
    } catch (error) {
      console.error('Error loading Blizzard API credentials from storage:', error);
      // Clear potentially corrupted data
      this.storageService.remove(this.STORAGE_KEY);
    }
  }
}