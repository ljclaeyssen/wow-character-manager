import { TestBed } from '@angular/core/testing';
import { RaidEncounterParserService } from './raid-encounter-parser.service';
import { WeeklyResetService } from './weekly-reset.service';
import { RaidDifficulty } from '../models/great-vault.model';
import {
  mockRaidEncountersResponse,
  mockRaidEncountersResponseNoCurrentSeason,
  getCurrentWeekTimestamp,
  getOldTimestamp
} from './test-data/raid-encounters-test-data';
import {
  lastWeekBossKills,
  mixedWeekBossKills
} from './test-data/vault-calculation-test-data';

describe('RaidEncounterParserService', () => {
  let service: RaidEncounterParserService;
  let weeklyResetService: jasmine.SpyObj<WeeklyResetService>;

  beforeEach(() => {
    const weeklyResetSpy = jasmine.createSpyObj('WeeklyResetService', ['isDateInCurrentWeek']);

    TestBed.configureTestingModule({
      providers: [
        RaidEncounterParserService,
        { provide: WeeklyResetService, useValue: weeklyResetSpy }
      ]
    });

    service = TestBed.inject(RaidEncounterParserService);
    weeklyResetService = TestBed.inject(WeeklyResetService) as jasmine.SpyObj<WeeklyResetService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseRaidEncounters', () => {
    it('should find and process Current Season expansion', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);

      // Act
      const result = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no Current Season expansion found', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);

      // Act
      const result = service.parseRaidEncounters(mockRaidEncountersResponseNoCurrentSeason);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when no expansions provided', () => {
      // Arrange
      const emptyResponse = {
        character: mockRaidEncountersResponse.character,
        expansions: []
      };

      // Act
      const result = service.parseRaidEncounters(emptyResponse);

      // Assert
      expect(result).toEqual([]);
    });

    it('should filter out boss kills not from current week', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(false);

      // Act
      const result = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Assert
      expect(result).toEqual([]);
    });

    it('should include boss kills from current week', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);

      // Act
      const result = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(kill => kill.killedAt instanceof Date)).toBe(true);
      expect(result.every(kill => kill.bossName.length > 0)).toBe(true);
      expect(result.every(kill => kill.instanceName === 'Manaforge Omega')).toBe(true);
    });

    it('should correctly map difficulty types', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);

      // Act
      const result = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Assert
      const difficulties = result.map(kill => kill.difficulty);
      expect(difficulties).toContain(RaidDifficulty.LFR);
      expect(difficulties).toContain(RaidDifficulty.Normal);
      expect(difficulties).toContain(RaidDifficulty.Heroic);
    });

    it('should parse encounter timestamps correctly', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);

      // Act
      const result = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      result.forEach(kill => {
        expect(kill.killedAt).toBeInstanceOf(Date);
        expect(kill.killedAt.getTime()).toBeGreaterThan(0);
      });
    });
  });

  describe('getUniqueBossKills', () => {
    it('should return unique boss kills (same boss different difficulties = 1 kill)', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);
      const allKills = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Act
      const uniqueKills = service.getUniqueBossKills(allKills);

      // Assert
      expect(uniqueKills.length).toBeLessThanOrEqual(allKills.length);

      // Check that each boss appears only once
      const bossIds = uniqueKills.map(kill => kill.bossId);
      const uniqueBossIds = [...new Set(bossIds)];
      expect(bossIds.length).toBe(uniqueBossIds.length);
    });

    it('should prioritize higher difficulty kills', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.returnValue(true);
      const allKills = service.parseRaidEncounters(mockRaidEncountersResponse);

      // Act
      const uniqueKills = service.getUniqueBossKills(allKills);

      // Assert
      // Find bosses that were killed on multiple difficulties
      const bossesWithMultipleKills = allKills.reduce((acc, kill) => {
        acc[kill.bossId] = acc[kill.bossId] || [];
        acc[kill.bossId].push(kill);
        return acc;
      }, {} as Record<number, any[]>);

      Object.entries(bossesWithMultipleKills).forEach(([bossId, kills]) => {
        if (kills.length > 1) {
          const uniqueKill = uniqueKills.find(k => k.bossId === parseInt(bossId));
          expect(uniqueKill).toBeDefined();

          // Check that the highest difficulty was selected
          const difficulties = kills.map(k => k.difficulty);
          if (difficulties.includes(RaidDifficulty.Heroic)) {
            expect(uniqueKill!.difficulty).toBe(RaidDifficulty.Heroic);
          } else if (difficulties.includes(RaidDifficulty.Normal)) {
            expect(uniqueKill!.difficulty).toBe(RaidDifficulty.Normal);
          }
        }
      });
    });

    it('should handle empty array input', () => {
      // Act
      const result = service.getUniqueBossKills([]);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('difficulty mapping', () => {
    it('should map LFR difficulty correctly', () => {
      // Act
      const result = (service as any).mapDifficultyFromBlizzard('LFR');

      // Assert
      expect(result).toBe(RaidDifficulty.LFR);
    });

    it('should map NORMAL difficulty correctly', () => {
      // Act
      const result = (service as any).mapDifficultyFromBlizzard('NORMAL');

      // Assert
      expect(result).toBe(RaidDifficulty.Normal);
    });

    it('should map HEROIC difficulty correctly', () => {
      // Act
      const result = (service as any).mapDifficultyFromBlizzard('HEROIC');

      // Assert
      expect(result).toBe(RaidDifficulty.Heroic);
    });

    it('should map MYTHIC difficulty correctly', () => {
      // Act
      const result = (service as any).mapDifficultyFromBlizzard('MYTHIC');

      // Assert
      expect(result).toBe(RaidDifficulty.Mythic);
    });

    it('should default to Normal for unknown difficulty', () => {
      // Act
      const result = (service as any).mapDifficultyFromBlizzard('UNKNOWN');

      // Assert
      expect(result).toBe(RaidDifficulty.Normal);
    });
  });

  describe('weekly filtering (Wednesday reset)', () => {
    it('should filter out boss kills from last week', () => {
      // Arrange
      // Mock the weekly reset service to simulate current week vs last week
      weeklyResetService.isDateInCurrentWeek.and.callFake((date: Date) => {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        return date > tenDaysAgo; // Only dates from last 10 days are "current week"
      });

      // Create a mock response with last week timestamps
      const lastWeekResponse = {
        ...mockRaidEncountersResponse,
        expansions: [
          {
            ...mockRaidEncountersResponse.expansions[0],
            instances: [
              {
                ...mockRaidEncountersResponse.expansions[0].instances[0],
                modes: [
                  {
                    ...mockRaidEncountersResponse.expansions[0].instances[0].modes[0],
                    progress: {
                      ...mockRaidEncountersResponse.expansions[0].instances[0].modes[0].progress,
                      encounters: [
                        {
                          encounter: {
                            key: { href: "test" },
                            name: "Test Boss",
                            id: 9999
                          },
                          completed_count: 1,
                          last_kill_timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000 // 15 days ago
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

      // Act
      const result = service.parseRaidEncounters(lastWeekResponse);

      // Assert
      expect(result).toEqual([]);
      expect(weeklyResetService.isDateInCurrentWeek).toHaveBeenCalled();
    });

    it('should include boss kills from current week only', () => {
      // Arrange
      weeklyResetService.isDateInCurrentWeek.and.callFake((date: Date) => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        return date > threeDaysAgo; // Only very recent dates are "current week"
      });

      // Create a mock response with mixed timestamps
      const mixedWeekResponse = {
        ...mockRaidEncountersResponse,
        expansions: [
          {
            ...mockRaidEncountersResponse.expansions[0],
            instances: [
              {
                ...mockRaidEncountersResponse.expansions[0].instances[0],
                modes: [
                  {
                    ...mockRaidEncountersResponse.expansions[0].instances[0].modes[0],
                    progress: {
                      ...mockRaidEncountersResponse.expansions[0].instances[0].modes[0].progress,
                      encounters: [
                        {
                          encounter: {
                            key: { href: "test" },
                            name: "Current Week Boss",
                            id: 8888
                          },
                          completed_count: 1,
                          last_kill_timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago
                        },
                        {
                          encounter: {
                            key: { href: "test" },
                            name: "Last Week Boss",
                            id: 9999
                          },
                          completed_count: 1,
                          last_kill_timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
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

      // Act
      const result = service.parseRaidEncounters(mixedWeekResponse);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].bossName).toBe("Current Week Boss");
      expect(result[0].bossId).toBe(8888);
    });

    it('should respect Wednesday reset timing', () => {
      // Arrange
      const wednesdayMorning = new Date('2025-01-01T10:00:00Z'); // Wednesday morning
      const tuesdayEvening = new Date('2024-12-31T22:00:00Z'); // Tuesday evening (day before)

      weeklyResetService.isDateInCurrentWeek.and.callFake((date: Date) => {
        // Simulate Wednesday reset logic - Tuesday evening should be "last week"
        return date >= wednesdayMorning;
      });

      const wednesdayResponse = {
        ...mockRaidEncountersResponse,
        expansions: [
          {
            ...mockRaidEncountersResponse.expansions[0],
            instances: [
              {
                ...mockRaidEncountersResponse.expansions[0].instances[0],
                modes: [
                  {
                    ...mockRaidEncountersResponse.expansions[0].instances[0].modes[0],
                    progress: {
                      ...mockRaidEncountersResponse.expansions[0].instances[0].modes[0].progress,
                      encounters: [
                        {
                          encounter: {
                            key: { href: "test" },
                            name: "Wednesday Boss",
                            id: 7777
                          },
                          completed_count: 1,
                          last_kill_timestamp: wednesdayMorning.getTime()
                        },
                        {
                          encounter: {
                            key: { href: "test" },
                            name: "Tuesday Boss",
                            id: 6666
                          },
                          completed_count: 1,
                          last_kill_timestamp: tuesdayEvening.getTime()
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

      // Act
      const result = service.parseRaidEncounters(wednesdayResponse);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].bossName).toBe("Wednesday Boss");
      expect(result[0].bossId).toBe(7777);
    });
  });
});