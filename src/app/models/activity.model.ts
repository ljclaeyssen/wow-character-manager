// Base interface for weekly activities
export interface WeeklyActivity {
  characterId: string;
  weekStartDate: Date;
  completed: boolean;
  lastUpdated: Date;
}

// Individual M+ run tracking
export interface MythicPlusRun {
  keyLevel: number;
  dungeon?: string;
  inTime?: boolean;
  timestamp: Date;
}

// Mythic Plus activity tracking
export interface MythicPlusActivity extends WeeklyActivity {
  dungeonCount: number; // Number of M+ dungeons completed
  highestKeyLevel: number; // Highest key level completed this week
  averageKeyLevel?: number; // Average key level this week
  inTimeRuns?: number; // Number of runs completed in time
  runs: MythicPlusRun[]; // Individual runs for vault calculation
  vaultProgress: {
    slot1: boolean; // 1 dungeon completed
    slot2: boolean; // 4 dungeons completed
    slot3: boolean; // 8 dungeons completed
  };
}

// Raid activity tracking
export interface RaidActivity extends WeeklyActivity {
  lfrBossesKilled: number;
  normalBossesKilled: number;
  heroicBossesKilled: number;
  mythicBossesKilled: number;
  vaultProgress: {
    slot1: boolean; // 2 bosses killed
    slot2: boolean; // 4 bosses killed
    slot3: boolean; // 6 bosses killed
  };
}

// Weekly quest tracking
export interface WeeklyQuest extends WeeklyActivity {
  worldBossCompleted: boolean; // 0 or 1
  sparkFragments: number; // 0, 1, or 2 (accumulates to full spark every 2 weeks)
  professionQuestsDone: number; // 0-2 based on character's professions
  weeklyEventCompleted: boolean; // Timewalking, M+ bonus, etc.
}

// Combined activity tracking per character
export interface CharacterActivity {
  characterId: string;
  weekStartDate: Date;
  mythicPlus: MythicPlusActivity;
  raid: RaidActivity;
  weeklyQuests: WeeklyQuest;
  lastUpdated: Date;
}

// Individual activity entries for history tracking
export interface VaultSlot {
  type: 'raid' | 'mythicPlus' | 'pvp';
  index: number; // 0-2 for each type
}

export interface Activity {
  id: string;
  characterId: string;
  type: string; // ActivityType (using string to avoid circular imports)
  description: string;
  date: Date;
  vaultSlot?: VaultSlot;
  metadata?: Record<string, any>;
}