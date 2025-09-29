import { RaidBossKill, RaidDifficulty } from '../../models/great-vault.model';

// Helper functions for generating test timestamps
export const getCurrentWeekTimestamp = (): Date => {
  const now = new Date();
  return now;
};

export const getLastWeekTimestamp = (): Date => {
  const now = new Date();
  // Go back 10 days to ensure we're in the previous week
  const lastWeek = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  return lastWeek;
};

// Test scenario: 2 Normal bosses killed - should give 1 vault slot (Normal reward)
export const twoNormalBossKills: RaidBossKill[] = [
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2686,
    bossName: "Loom'ithar",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  }
];

// Test scenario: 2 Mythic + 3 Normal = 5 total unique bosses
// Should give 3 vault slots with Mythic reward quality
export const twoMythicThreeNormalBossKills: RaidBossKill[] = [
  // Mythic kills
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2686,
    bossName: "Loom'ithar",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: new Date(),
    lootEligible: true
  },
  // Normal kills (different bosses)
  {
    bossId: 2685,
    bossName: "Soulbinder Naazindhri",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2687,
    bossName: "Forgeweaver Araz",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2688,
    bossName: "The Soul Hunters",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  }
];

// Test scenario: Same boss killed on multiple difficulties - should count as 1 unique boss
export const sameBossMultipleDifficulties: RaidBossKill[] = [
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.LFR,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: new Date(),
    lootEligible: true
  }
];

// Test scenario: 4 bosses killed (should give 2 vault slots)
export const fourBossKills: RaidBossKill[] = [
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2686,
    bossName: "Loom'ithar",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2685,
    bossName: "Soulbinder Naazindhri",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2687,
    bossName: "Forgeweaver Araz",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  }
];

// Test scenario: 6 bosses killed (should give 3 vault slots - maximum)
export const sixBossKills: RaidBossKill[] = [
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2686,
    bossName: "Loom'ithar",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2685,
    bossName: "Soulbinder Naazindhri",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2687,
    bossName: "Forgeweaver Araz",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2688,
    bossName: "The Soul Hunters",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  },
  {
    bossId: 2747,
    bossName: "Fractillus",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: new Date(),
    lootEligible: true
  }
];

// Test scenario: No boss kills
export const noBossKills: RaidBossKill[] = [];

// Test scenario: 1 boss kill (not enough for vault slot)
export const oneBossKill: RaidBossKill[] = [
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: new Date(),
    lootEligible: true
  }
];

// Test scenario: Boss kills from last week (should be filtered out)
// Wednesday reset means we need kills from before the most recent Wednesday
export const lastWeekBossKills: RaidBossKill[] = [
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: getLastWeekTimestamp(),
    lootEligible: true
  },
  {
    bossId: 2686,
    bossName: "Loom'ithar",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: getLastWeekTimestamp(),
    lootEligible: true
  },
  {
    bossId: 2685,
    bossName: "Soulbinder Naazindhri",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: getLastWeekTimestamp(),
    lootEligible: true
  }
];

// Test scenario: Mixed current week and last week kills
export const mixedWeekBossKills: RaidBossKill[] = [
  // Current week kills (should count)
  {
    bossId: 2684,
    bossName: "Plexus Sentinel",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Mythic,
    killedAt: getCurrentWeekTimestamp(),
    lootEligible: true
  },
  {
    bossId: 2686,
    bossName: "Loom'ithar",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Normal,
    killedAt: getCurrentWeekTimestamp(),
    lootEligible: true
  },
  // Last week kills (should be filtered out)
  {
    bossId: 2685,
    bossName: "Soulbinder Naazindhri",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: getLastWeekTimestamp(),
    lootEligible: true
  },
  {
    bossId: 2687,
    bossName: "Forgeweaver Araz",
    instanceId: 1302,
    instanceName: "Manaforge Omega",
    difficulty: RaidDifficulty.Heroic,
    killedAt: getLastWeekTimestamp(),
    lootEligible: true
  }
];