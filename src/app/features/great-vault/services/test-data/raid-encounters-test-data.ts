/**
 * Test data extracted from real Blizzard API response
 * Contains only the "Current Season" expansion for testing Great Vault calculations
 */
export const mockRaidEncountersResponse = {
  character: {
    key: {
      href: "https://eu.api.blizzard.com/profile/wow/character/ysondre/demonolonjon?namespace=profile-eu"
    },
    name: "Demonolonjon",
    id: 171716578,
    realm: {
      key: {
        href: "https://eu.api.blizzard.com/data/wow/realm/1335?namespace=dynamic-eu"
      },
      name: "Ysondre",
      id: 1335,
      slug: "ysondre"
    }
  },
  expansions: [
    {
      expansion: {
        key: {
          href: "https://eu.api.blizzard.com/data/wow/journal-expansion/505?namespace=static-11.2.0_62213-eu"
        },
        name: "Current Season",
        id: 505
      },
      instances: [
        {
          instance: {
            key: {
              href: "https://eu.api.blizzard.com/data/wow/journal-instance/1302?namespace=static-11.2.0_62213-eu"
            },
            name: "Manaforge Omega",
            id: 1302
          },
          modes: [
            {
              difficulty: {
                type: "LFR",
                name: "Raid Finder"
              },
              status: {
                type: "IN_PROGRESS",
                name: "In Progress"
              },
              progress: {
                completed_count: 4,
                total_count: 8,
                encounters: [
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2684?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Plexus Sentinel",
                      id: 2684
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1756138239000
                  },
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2686?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Loom'ithar",
                      id: 2686
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1756138943000
                  },
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2688?namespace=static-11.2.0_62213-eu"
                      },
                      name: "The Soul Hunters",
                      id: 2688
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1756137028000
                  },
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2747?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Fractillus",
                      id: 2747
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1756137491000
                  }
                ]
              }
            },
            {
              difficulty: {
                type: "NORMAL",
                name: "Normal"
              },
              status: {
                type: "IN_PROGRESS",
                name: "In Progress"
              },
              progress: {
                completed_count: 7,
                total_count: 8,
                encounters: [
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2684?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Plexus Sentinel",
                      id: 2684
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1757257263000
                  },
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2686?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Loom'ithar",
                      id: 2686
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1757257868000
                  },
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2685?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Soulbinder Naazindhri",
                      id: 2685
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1757258496000
                  }
                ]
              }
            },
            {
              difficulty: {
                type: "HEROIC",
                name: "Heroic"
              },
              status: {
                type: "IN_PROGRESS",
                name: "In Progress"
              },
              progress: {
                completed_count: 7,
                total_count: 8,
                encounters: [
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2684?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Plexus Sentinel",
                      id: 2684
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1757530071000
                  },
                  {
                    encounter: {
                      key: {
                        href: "https://eu.api.blizzard.com/data/wow/journal-encounter/2686?namespace=static-11.2.0_62213-eu"
                      },
                      name: "Loom'ithar",
                      id: 2686
                    },
                    completed_count: 1,
                    last_kill_timestamp: 1757530640000
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
};

// Test data with no "Current Season" expansion
export const mockRaidEncountersResponseNoCurrentSeason = {
  character: {
    key: {
      href: "https://eu.api.blizzard.com/profile/wow/character/ysondre/testchar?namespace=profile-eu"
    },
    name: "TestChar",
    id: 123456,
    realm: {
      key: {
        href: "https://eu.api.blizzard.com/data/wow/realm/1335?namespace=dynamic-eu"
      },
      name: "TestRealm",
      id: 1335,
      slug: "test-realm"
    }
  },
  expansions: [
    {
      expansion: {
        key: {
          href: "https://eu.api.blizzard.com/data/wow/journal-expansion/514?namespace=static-11.2.0_62213-eu"
        },
        name: "The War Within",
        id: 514
      },
      instances: []
    }
  ]
};

// Test data with current week timestamps
export const getCurrentWeekTimestamp = (): number => {
  const now = new Date();
  return now.getTime();
};

// Test data with old timestamps (not current week)
export const getOldTimestamp = (): number => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return twoWeeksAgo.getTime();
};