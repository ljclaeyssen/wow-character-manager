import { TestBed } from '@angular/core/testing';
import { ActivityService } from './activity.service';
import { Activity } from '../models/activity.model';
import { ActivityType } from '../enums/activity-type.enum';

describe('ActivityService', () => {
  let service: ActivityService;

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      characterId: 'char-1',
      type: ActivityType.MythicPlusCompleted,
      description: 'Completed M+15 Mists of Tirna Scithe',
      date: new Date('2023-01-01T10:00:00'),
      vaultSlot: { type: 'mythicPlus', index: 0 }
    },
    {
      id: 'activity-2',
      characterId: 'char-1',
      type: ActivityType.MythicPlusCompleted,
      description: 'Completed M+12 Halls of Atonement',
      date: new Date('2023-01-01T11:00:00'),
      vaultSlot: { type: 'mythicPlus', index: 1 }
    },
    {
      id: 'activity-3',
      characterId: 'char-1',
      type: ActivityType.RaidBossKilled,
      description: 'Killed Mythic Eranog',
      date: new Date('2023-01-01T12:00:00'),
      vaultSlot: { type: 'raid', index: 0 }
    },
    {
      id: 'activity-4',
      characterId: 'char-1',
      type: ActivityType.RaidBossKilled,
      description: 'Killed Heroic Terros',
      date: new Date('2023-01-01T13:00:00'),
      vaultSlot: { type: 'raid', index: 1 }
    },
    {
      id: 'activity-5',
      characterId: 'char-1',
      type: ActivityType.PvPMatchCompleted,
      description: 'Won Rated Battleground',
      date: new Date('2023-01-01T14:00:00'),
      vaultSlot: { type: 'pvp', index: 0 }
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateVaultProgress', () => {
    it('should calculate correct vault progress with mixed activities', () => {
      const progress = service.calculateVaultProgress(mockActivities);

      expect(progress.raid).toBe(1); // 2 bosses = 1 slot
      expect(progress.mythicPlus).toBe(1); // 2 dungeons = 1 slot
      expect(progress.pvp).toBe(0); // 1 win = 0 slots (need 5+)
      expect(progress.total).toBe(2);
    });

    it('should calculate raid vault slots correctly', () => {
      const raidActivities: Activity[] = [
        { ...mockActivities[0], type: ActivityType.RaidBossKilled },
        { ...mockActivities[1], type: ActivityType.RaidBossKilled },
        { ...mockActivities[2], type: ActivityType.RaidBossKilled },
        { ...mockActivities[3], type: ActivityType.RaidBossKilled },
        { ...mockActivities[4], type: ActivityType.RaidBossKilled },
        { ...mockActivities[0], id: 'extra-1', type: ActivityType.RaidBossKilled }
      ];

      const progress = service.calculateVaultProgress(raidActivities);
      expect(progress.raid).toBe(3); // 6 bosses = 3 slots
      expect(progress.mythicPlus).toBe(0);
      expect(progress.pvp).toBe(0);
    });

    it('should calculate M+ vault slots correctly', () => {
      const mythicPlusActivities: Activity[] = Array(8).fill(null).map((_, i) => ({
        id: `m-plus-${i}`,
        characterId: 'char-1',
        type: ActivityType.MythicPlusCompleted,
        description: `Completed M+${10 + i}`,
        date: new Date(),
        vaultSlot: { type: 'mythicPlus', index: i }
      }));

      const progress = service.calculateVaultProgress(mythicPlusActivities);
      expect(progress.mythicPlus).toBe(3); // 8 dungeons = 3 slots
    });

    it('should calculate PvP vault slots correctly', () => {
      const pvpActivities: Activity[] = Array(15).fill(null).map((_, i) => ({
        id: `pvp-${i}`,
        characterId: 'char-1',
        type: ActivityType.PvPMatchCompleted,
        description: `Won PvP Match ${i + 1}`,
        date: new Date(),
        vaultSlot: { type: 'pvp', index: i }
      }));

      const progress = service.calculateVaultProgress(pvpActivities);
      expect(progress.pvp).toBe(3); // 15 wins = 3 slots
    });

    it('should handle empty activities array', () => {
      const progress = service.calculateVaultProgress([]);
      expect(progress.raid).toBe(0);
      expect(progress.mythicPlus).toBe(0);
      expect(progress.pvp).toBe(0);
      expect(progress.total).toBe(0);
    });
  });

  describe('getProjectedVaultRewards', () => {
    it('should return correct rewards for mixed activities', () => {
      const rewards = service.getProjectedVaultRewards(mockActivities);

      expect(rewards.length).toBe(2);
      expect(rewards[0].source).toBe('raid');
      expect(rewards[0].slot).toBe(1);
      expect(rewards[1].source).toBe('mythicPlus');
      expect(rewards[1].slot).toBe(2);
    });

    it('should determine correct item quality for M+ based on keystone level', () => {
      const highKeyActivities: Activity[] = [
        {
          id: 'high-key',
          characterId: 'char-1',
          type: ActivityType.MythicPlusCompleted,
          description: 'Completed M+15 Brackenhide Hollow',
          date: new Date(),
          vaultSlot: { type: 'mythicPlus', index: 0 }
        }
      ];

      const rewards = service.getProjectedVaultRewards(highKeyActivities);
      expect(rewards[0].quality).toBe('Mythic');
    });

    it('should determine correct item quality for raids based on difficulty', () => {
      const mythicRaidActivities: Activity[] = [
        {
          id: 'mythic-boss',
          characterId: 'char-1',
          type: ActivityType.RaidBossKilled,
          description: 'Killed Mythic Raszageth',
          date: new Date(),
          vaultSlot: { type: 'raid', index: 0 }
        },
        {
          id: 'mythic-boss-2',
          characterId: 'char-1',
          type: ActivityType.RaidBossKilled,
          description: 'Killed Mythic Kurog Grimtotem',
          date: new Date(),
          vaultSlot: { type: 'raid', index: 1 }
        }
      ];

      const rewards = service.getProjectedVaultRewards(mythicRaidActivities);
      expect(rewards[0].quality).toBe('Mythic');
    });

    it('should limit rewards to maximum 9 slots', () => {
      const maxActivities: Activity[] = [
        ...Array(6).fill(null).map((_, i) => ({
          id: `raid-${i}`,
          characterId: 'char-1',
          type: ActivityType.RaidBossKilled,
          description: `Killed Boss ${i + 1}`,
          date: new Date(),
          vaultSlot: { type: 'raid', index: i }
        })),
        ...Array(8).fill(null).map((_, i) => ({
          id: `mplus-${i}`,
          characterId: 'char-1',
          type: ActivityType.MythicPlusCompleted,
          description: `Completed M+${10 + i}`,
          date: new Date(),
          vaultSlot: { type: 'mythicPlus', index: i }
        })),
        ...Array(15).fill(null).map((_, i) => ({
          id: `pvp-${i}`,
          characterId: 'char-1',
          type: ActivityType.PvPMatchCompleted,
          description: `Won PvP Match ${i + 1}`,
          date: new Date(),
          vaultSlot: { type: 'pvp', index: i }
        }))
      ];

      const rewards = service.getProjectedVaultRewards(maxActivities);
      expect(rewards.length).toBe(9);
    });
  });

  describe('validateActivity', () => {
    it('should validate complete activity successfully', () => {
      const validActivity = {
        type: ActivityType.MythicPlusCompleted,
        description: 'Completed M+15 Mists',
        date: new Date(),
        characterId: 'char-1'
      };

      const validation = service.validateActivity(validActivity);
      expect(validation.isValid).toBeTrue();
      expect(validation.errors.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const invalidActivity = {};

      const validation = service.validateActivity(invalidActivity);
      expect(validation.isValid).toBeFalse();
      expect(validation.errors).toContain('Activity type is required');
      expect(validation.errors).toContain('Activity description is required');
      expect(validation.errors).toContain('Activity date is required');
      expect(validation.errors).toContain('Character ID is required');
    });

    it('should validate M+ keystone level format', () => {
      const invalidMPlusActivity = {
        type: ActivityType.MythicPlusCompleted,
        description: 'Completed Mists without keystone level',
        date: new Date(),
        characterId: 'char-1'
      };

      const validation = service.validateActivity(invalidMPlusActivity);
      expect(validation.isValid).toBeFalse();
      expect(validation.errors).toContain('Mythic+ activities must include keystone level (e.g., "+15")');
    });

    it('should validate raid difficulty specification', () => {
      const invalidRaidActivity = {
        type: ActivityType.RaidBossKilled,
        description: 'Killed boss without difficulty',
        date: new Date(),
        characterId: 'char-1'
      };

      const validation = service.validateActivity(invalidRaidActivity);
      expect(validation.isValid).toBeFalse();
      expect(validation.errors).toContain('Raid activities should specify difficulty (Normal, Heroic, or Mythic)');
    });

    it('should accept valid raid difficulty formats', () => {
      const validDifficulties = ['Normal', 'Heroic', 'Mythic'];

      validDifficulties.forEach(difficulty => {
        const validRaidActivity = {
          type: ActivityType.RaidBossKilled,
          description: `Killed ${difficulty} Eranog`,
          date: new Date(),
          characterId: 'char-1'
        };

        const validation = service.validateActivity(validRaidActivity);
        expect(validation.isValid).toBeTrue();
      });
    });
  });

  describe('weekly reset functionality', () => {
    it('should correctly identify current week activities', () => {
      // Mock current date to Wednesday (reset day)
      const mockWednesday = new Date('2023-01-04T00:00:00'); // Wednesday
      spyOn(Date, 'now').and.returnValue(mockWednesday.getTime());

      const currentWeekActivity: Activity = {
        id: 'current-week',
        characterId: 'char-1',
        type: ActivityType.MythicPlusCompleted,
        description: 'Current week M+',
        date: new Date('2023-01-05T10:00:00'), // Thursday same week
        vaultSlot: { type: 'mythicPlus', index: 0 }
      };

      const lastWeekActivity: Activity = {
        id: 'last-week',
        characterId: 'char-1',
        type: ActivityType.MythicPlusCompleted,
        description: 'Last week M+',
        date: new Date('2023-01-02T10:00:00'), // Monday previous week
        vaultSlot: { type: 'mythicPlus', index: 0 }
      };

      expect(service.isCurrentWeek(currentWeekActivity.date)).toBeTrue();
      expect(service.isCurrentWeek(lastWeekActivity.date)).toBeFalse();
    });

    it('should filter current week activities correctly', () => {
      const mockWednesday = new Date('2023-01-04T00:00:00');
      spyOn(Date, 'now').and.returnValue(mockWednesday.getTime());

      const mixedActivities: Activity[] = [
        {
          id: 'current-1',
          characterId: 'char-1',
          type: ActivityType.MythicPlusCompleted,
          description: 'Current week M+',
          date: new Date('2023-01-05T10:00:00'),
          vaultSlot: { type: 'mythicPlus', index: 0 }
        },
        {
          id: 'last-week',
          characterId: 'char-1',
          type: ActivityType.MythicPlusCompleted,
          description: 'Last week M+',
          date: new Date('2022-12-30T10:00:00'),
          vaultSlot: { type: 'mythicPlus', index: 0 }
        },
        {
          id: 'current-2',
          characterId: 'char-1',
          type: ActivityType.RaidBossKilled,
          description: 'Current week raid',
          date: new Date('2023-01-07T20:00:00'),
          vaultSlot: { type: 'raid', index: 0 }
        }
      ];

      const currentWeekActivities = service.getCurrentWeekActivities(mixedActivities);
      expect(currentWeekActivities.length).toBe(2);
      expect(currentWeekActivities.every(a => a.id.startsWith('current'))).toBeTrue();
    });

    it('should calculate next reset date correctly', () => {
      // Test from different days of the week
      const testCases = [
        { current: new Date('2023-01-02T10:00:00'), expected: new Date('2023-01-04T00:00:00') }, // Monday -> Wednesday
        { current: new Date('2023-01-04T10:00:00'), expected: new Date('2023-01-11T00:00:00') }, // Wednesday -> Next Wednesday
        { current: new Date('2023-01-07T10:00:00'), expected: new Date('2023-01-11T00:00:00') }, // Saturday -> Wednesday
      ];

      testCases.forEach(({ current, expected }) => {
        spyOn(Date, 'now').and.returnValue(current.getTime());
        const nextReset = service.getNextResetDate();
        expect(nextReset.getTime()).toBe(expected.getTime());
      });
    });
  });

  describe('vault progress percentage', () => {
    it('should calculate correct percentage based on total slots', () => {
      const threeSlotActivities: Activity[] = [
        ...Array(2).fill(null).map((_, i) => ({
          id: `raid-${i}`,
          characterId: 'char-1',
          type: ActivityType.RaidBossKilled,
          description: `Killed Boss ${i + 1}`,
          date: new Date(),
          vaultSlot: { type: 'raid', index: i }
        })),
        {
          id: 'mplus-1',
          characterId: 'char-1',
          type: ActivityType.MythicPlusCompleted,
          description: 'Completed M+10',
          date: new Date(),
          vaultSlot: { type: 'mythicPlus', index: 0 }
        }
      ];

      const percentage = service.getVaultProgressPercentage(threeSlotActivities);
      expect(percentage).toBe(22); // 2/9 * 100 = 22.22 -> 22
    });

    it('should return 100% for full vault completion', () => {
      const fullVaultActivities: Activity[] = [
        ...Array(6).fill(null).map((_, i) => ({
          id: `raid-${i}`,
          characterId: 'char-1',
          type: ActivityType.RaidBossKilled,
          description: `Killed Boss ${i + 1}`,
          date: new Date(),
          vaultSlot: { type: 'raid', index: i }
        })),
        ...Array(8).fill(null).map((_, i) => ({
          id: `mplus-${i}`,
          characterId: 'char-1',
          type: ActivityType.MythicPlusCompleted,
          description: `Completed M+${10 + i}`,
          date: new Date(),
          vaultSlot: { type: 'mythicPlus', index: i }
        })),
        ...Array(15).fill(null).map((_, i) => ({
          id: `pvp-${i}`,
          characterId: 'char-1',
          type: ActivityType.PvPMatchCompleted,
          description: `Won PvP Match ${i + 1}`,
          date: new Date(),
          vaultSlot: { type: 'pvp', index: i }
        }))
      ];

      const percentage = service.getVaultProgressPercentage(fullVaultActivities);
      expect(percentage).toBe(100);
    });
  });
});