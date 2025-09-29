export interface GreatVaultProgress {
  characterId: string;
  characterName: string;
  weekStartDate: Date;
  lastUpdated: Date;
  mythicPlus: GreatVaultMythicPlusProgress;
  raids: GreatVaultRaidProgress;
  pvp: GreatVaultPvpProgress;
  totalSlots: number;
}

export interface GreatVaultMythicPlusProgress {
  slot1: GreatVaultSlot; // 1 dungeon (level 2+)
  slot2: GreatVaultSlot; // 4 dungeons (level 2+)
  slot3: GreatVaultSlot; // 8 dungeons (level 2+)
  completedDungeons: number;
  highestKeyLevel: number;
  itemLevel: number;
}

export interface GreatVaultRaidProgress {
  slot1: GreatVaultSlot; // 2 bosses
  slot2: GreatVaultSlot; // 4 bosses
  slot3: GreatVaultSlot; // 6 bosses
  killedBosses: RaidBossKill[];
  uniqueBossCount: number;
  highestDifficulty: RaidDifficulty;
  itemLevel: number;
}

export interface GreatVaultPvpProgress {
  slot1: GreatVaultSlot; // 1250+ Honor
  slot2: GreatVaultSlot; // 2500+ Honor
  slot3: GreatVaultSlot; // 6250+ Honor
  honorEarned: number;
  rating: number;
  itemLevel: number;
}

export interface GreatVaultSlot {
  unlocked: boolean;
  progress: number; // 0-1 (percentage completed)
  requirement: string;
  itemLevel: number;
  rewardType: GreatVaultRewardType;
}

export interface RaidBossKill {
  bossId: number;
  bossName: string;
  instanceId: number;
  instanceName: string;
  difficulty: RaidDifficulty;
  killedAt: Date;
  lootEligible: boolean;
}

export enum RaidDifficulty {
  LFR = 'lfr',
  Normal = 'normal',
  Heroic = 'heroic',
  Mythic = 'mythic'
}

export enum GreatVaultRewardType {
  MythicPlus = 'mythic_plus',
  Raid = 'raid',
  PvP = 'pvp'
}

export interface WeeklyReset {
  previousWeekStart: Date;
  currentWeekStart: Date;
  nextWeekStart: Date;
  daysUntilReset: number;
  hoursUntilReset: number;
}

export interface GreatVaultSummary {
  characterId: string;
  totalUnlockedSlots: number;
  mythicPlusSlots: number;
  raidSlots: number;
  pvpSlots: number;
  highestItemLevel: number;
  weeklyProgress: number; // 0-1 (overall completion percentage)
  lastUpdated: Date;
}

// Blizzard API Response Interfaces
export interface BlizzardRaidEncounter {
  encounter: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  completed_count: number;
  last_kill_timestamp: number;
}

export interface BlizzardRaidInstance {
  instance: {
    key: {
      href: string;
    };
    name: string;
    id: number;
  };
  modes: BlizzardRaidMode[];
}

export interface BlizzardRaidMode {
  difficulty: {
    type: string;
    name: string;
  };
  status: {
    type: string;
    name: string;
  };
  progress: {
    completed_count: number;
    total_count: number;
    encounters: BlizzardRaidEncounter[];
  };
}

export interface BlizzardCharacterRaidsResponse {
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
  expansions: Array<{
    expansion: {
      key: {
        href: string;
      };
      name: string;
      id: number;
    };
    instances: BlizzardRaidInstance[];
  }>;
}