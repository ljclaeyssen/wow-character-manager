import { BlizzardMythicKeystoneRun } from '../../../../services/blizzard-api.service';

// Helper functions for generating test timestamps
export const getCurrentWeekTimestamp = (): number => {
  const now = new Date();
  return now.getTime();
};

export const getLastWeekTimestamp = (): number => {
  const now = new Date();
  // Go back 10 days to ensure we're in the previous week
  const lastWeek = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  return lastWeek.getTime();
};

// Test scenario: 1 dungeon +10 (should give 1 vault slot with +10 reward)
export const oneDungeonPlus10: BlizzardMythicKeystoneRun[] = [
  {
    completed_timestamp: getCurrentWeekTimestamp(),
    duration: 1800000, // 30 minutes
    keystone_level: 10,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/503?namespace=dynamic-eu" },
      name: "Ara-Kara, City of Echoes",
      id: 503
    },
    is_completed_within_time: true,
    mythic_rating: {
      color: { r: 255, g: 128, b: 0, a: 1.0 },
      rating: 350.0
    },
    map_rating: {
      color: { r: 255, g: 128, b: 0, a: 1.0 },
      rating: 350.0
    }
  }
];

// Test scenario: 1 +10 and 5 +5 dungeons (should give 2 vault slots, first with +10 reward, second with +5 reward)
export const onePlus10FivePlus5: BlizzardMythicKeystoneRun[] = [
  {
    completed_timestamp: getCurrentWeekTimestamp(),
    duration: 1800000,
    keystone_level: 10,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/503?namespace=dynamic-eu" },
      name: "Ara-Kara, City of Echoes",
      id: 503
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 350.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 350.0 }
  },
  {
    completed_timestamp: getCurrentWeekTimestamp() - 1000,
    duration: 1900000,
    keystone_level: 5,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/505?namespace=dynamic-eu" },
      name: "The Dawnbreaker",
      id: 505
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 }
  },
  {
    completed_timestamp: getCurrentWeekTimestamp() - 2000,
    duration: 1900000,
    keystone_level: 5,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/499?namespace=dynamic-eu" },
      name: "Priory of the Sacred Flame",
      id: 499
    },
    is_completed_within_time: false,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 180.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 180.0 }
  },
  {
    completed_timestamp: getCurrentWeekTimestamp() - 3000,
    duration: 2000000,
    keystone_level: 5,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/525?namespace=dynamic-eu" },
      name: "Operation: Floodgate",
      id: 525
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 }
  },
  {
    completed_timestamp: getCurrentWeekTimestamp() - 4000,
    duration: 2000000,
    keystone_level: 5,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/542?namespace=dynamic-eu" },
      name: "Eco-Dome Al'dani",
      id: 542
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 }
  },
  {
    completed_timestamp: getCurrentWeekTimestamp() - 5000,
    duration: 2100000,
    keystone_level: 5,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/378?namespace=dynamic-eu" },
      name: "Halls of Atonement",
      id: 378
    },
    is_completed_within_time: false,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 180.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 180.0 }
  }
];

// Test scenario: 1 +10 from last week (should be filtered out, no vault slots)
export const onePlus10LastWeek: BlizzardMythicKeystoneRun[] = [
  {
    completed_timestamp: getLastWeekTimestamp(),
    duration: 1800000,
    keystone_level: 10,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/503?namespace=dynamic-eu" },
      name: "Ara-Kara, City of Echoes",
      id: 503
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 350.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 350.0 }
  }
];

// Test scenario: Mixed current and last week runs (only current week should count)
export const mixedWeekRuns: BlizzardMythicKeystoneRun[] = [
  // Current week runs (should count)
  {
    completed_timestamp: getCurrentWeekTimestamp(),
    duration: 1800000,
    keystone_level: 12,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/503?namespace=dynamic-eu" },
      name: "Ara-Kara, City of Echoes",
      id: 503
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 380.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 380.0 }
  },
  {
    completed_timestamp: getCurrentWeekTimestamp() - 1000,
    duration: 2000000,
    keystone_level: 8,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/505?namespace=dynamic-eu" },
      name: "The Dawnbreaker",
      id: 505
    },
    is_completed_within_time: false,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 280.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 280.0 }
  },
  // Last week runs (should be filtered out)
  {
    completed_timestamp: getLastWeekTimestamp(),
    duration: 1700000,
    keystone_level: 15,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/499?namespace=dynamic-eu" },
      name: "Priory of the Sacred Flame",
      id: 499
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 450.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 450.0 }
  },
  {
    completed_timestamp: getLastWeekTimestamp() - 1000,
    duration: 1900000,
    keystone_level: 13,
    keystone_affixes: [
      {
        key: { href: "https://eu.api.blizzard.com/data/wow/keystone-affix/9?namespace=static-11.2.0_62213-eu" },
        name: "Tyrannical",
        id: 9
      }
    ],
    members: [],
    dungeon: {
      key: { href: "https://eu.api.blizzard.com/data/wow/mythic-keystone/dungeon/525?namespace=dynamic-eu" },
      name: "Operation: Floodgate",
      id: 525
    },
    is_completed_within_time: true,
    mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 400.0 },
    map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 400.0 }
  }
];

// Test scenario: 8+ dungeons for testing all 3 vault slots
export const eightDungeonsVariousLevels: BlizzardMythicKeystoneRun[] = [
  // High level runs for slot 1
  { completed_timestamp: getCurrentWeekTimestamp(), duration: 1800000, keystone_level: 15, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 1", id: 1 }, is_completed_within_time: true, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 450.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 450.0 } },
  { completed_timestamp: getCurrentWeekTimestamp() - 1000, duration: 1900000, keystone_level: 13, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 2", id: 2 }, is_completed_within_time: true, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 400.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 400.0 } },
  { completed_timestamp: getCurrentWeekTimestamp() - 2000, duration: 2000000, keystone_level: 12, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 3", id: 3 }, is_completed_within_time: true, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 380.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 380.0 } },
  // Medium level run for slot 2 (4th highest)
  { completed_timestamp: getCurrentWeekTimestamp() - 3000, duration: 2100000, keystone_level: 10, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 4", id: 4 }, is_completed_within_time: true, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 350.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 350.0 } },
  { completed_timestamp: getCurrentWeekTimestamp() - 4000, duration: 2200000, keystone_level: 9, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 5", id: 5 }, is_completed_within_time: false, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 320.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 320.0 } },
  { completed_timestamp: getCurrentWeekTimestamp() - 5000, duration: 2300000, keystone_level: 8, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 6", id: 6 }, is_completed_within_time: false, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 280.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 280.0 } },
  { completed_timestamp: getCurrentWeekTimestamp() - 6000, duration: 2400000, keystone_level: 7, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 7", id: 7 }, is_completed_within_time: false, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 250.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 250.0 } },
  // Low level run for slot 3 (8th highest)
  { completed_timestamp: getCurrentWeekTimestamp() - 7000, duration: 2500000, keystone_level: 5, keystone_affixes: [], members: [], dungeon: { key: { href: "" }, name: "Dungeon 8", id: 8 }, is_completed_within_time: false, mythic_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 }, map_rating: { color: { r: 255, g: 128, b: 0, a: 1.0 }, rating: 200.0 } }
];

// Test scenario: No M+ runs completed
export const noMythicPlusRuns: BlizzardMythicKeystoneRun[] = [];