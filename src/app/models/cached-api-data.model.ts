export interface CachedApiData {
  characterId: string;
  mythicKeystoneProfile: any | null;
  raidEncounters: any | null;
  lastFetched: Date;
  cacheExpiry: Date; // When this cache expires
}

import { VaultRewards } from '../services/vault-rewards-calculator.service';

export interface CachedVaultRewards {
  characterId: string;
  vaultRewards: VaultRewards;
  lastCalculated: Date;
  cacheExpiry: Date;
}