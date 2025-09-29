import { TestBed } from '@angular/core/testing';
import { GreatVaultCalculationService } from './great-vault-calculation.service';
import { WeeklyResetService } from './weekly-reset.service';
import {
  oneDungeonPlus10,
  onePlus10FivePlus5,
  onePlus10LastWeek,
  mixedWeekRuns,
  eightDungeonsVariousLevels,
  noMythicPlusRuns
} from './test-data/mythic-plus-test-data';

describe('GreatVaultCalculationService - Mythic+ Scenarios', () => {
  let service: GreatVaultCalculationService;
  let mockWeeklyResetService: jasmine.SpyObj<WeeklyResetService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('WeeklyResetService', ['getCurrentWeeklyReset']);

    TestBed.configureTestingModule({
      providers: [
        GreatVaultCalculationService,
        { provide: WeeklyResetService, useValue: spy }
      ]
    });

    service = TestBed.inject(GreatVaultCalculationService);
    mockWeeklyResetService = TestBed.inject(WeeklyResetService) as jasmine.SpyObj<WeeklyResetService>;

    // Mock the current week start to a known date
    const mockWeekStart = new Date('2023-12-13T15:00:00.000Z'); // Wednesday 15:00 UTC
    mockWeeklyResetService.getCurrentWeeklyReset.and.returnValue({
      resetTime: mockWeekStart,
      nextReset: new Date(mockWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      daysUntilReset: 7,
      hoursUntilReset: 168
    });

    // Override the getCurrentWeekStart method for consistent testing
    spyOn<any>(service, 'getCurrentWeekStart').and.returnValue(mockWeekStart);
  });

  describe('Scenario: 1 dungeon +10', () => {
    it('should give 1 vault slot with +10 key level reward', () => {
      const result = service.calculateMythicPlusProgress(oneDungeonPlus10);

      expect(result.completedDungeons).toBe(1);
      expect(result.highestKeyLevel).toBe(10);

      // Should unlock slot 1 only
      expect(result.slot1.unlocked).toBe(true);
      expect(result.slot1.progress).toBe(1);
      expect(result.slot1.itemLevel).toBeGreaterThan(0); // Should have item level for +10

      // Slots 2 and 3 should not be unlocked
      expect(result.slot2.unlocked).toBe(false);
      expect(result.slot2.progress).toBeLessThan(1);
      expect(result.slot3.unlocked).toBe(false);
      expect(result.slot3.progress).toBeLessThan(1);
    });

    it('should calculate correct item level for +10 key', () => {
      const result = service.calculateMythicPlusProgress(oneDungeonPlus10);

      // +10 key should give Mythic track item level
      const expectedItemLevel = service['calculateMythicPlusItemLevel'](10);
      expect(result.slot1.itemLevel).toBe(expectedItemLevel);
      expect(result.slot1.itemLevel).toBeGreaterThanOrEqual(470); // Should be Mythic quality (470+)
    });
  });

  describe('Scenario: 1 +10 and 5 +5 dungeons', () => {
    it('should give 2 vault slots with correct key level rewards', () => {
      const result = service.calculateMythicPlusProgress(onePlus10FivePlus5);

      expect(result.completedDungeons).toBe(6);
      expect(result.highestKeyLevel).toBe(10);

      // Should unlock slots 1 and 2
      expect(result.slot1.unlocked).toBe(true);
      expect(result.slot1.progress).toBe(1);

      expect(result.slot2.unlocked).toBe(true);
      expect(result.slot2.progress).toBe(1);

      // Slot 3 should not be unlocked (need 8 dungeons)
      expect(result.slot3.unlocked).toBe(false);
      expect(result.slot3.progress).toBe(6/8); // 6 out of 8 needed
    });

    it('should give slot 1 reward based on highest key (+10) and slot 2 based on 4th highest (+5)', () => {
      const result = service.calculateMythicPlusProgress(onePlus10FivePlus5);

      // Slot 1 should be rewarded based on highest key level (+10)
      const slot1ItemLevel = service['calculateMythicPlusItemLevel'](10);
      expect(result.slot1.itemLevel).toBe(slot1ItemLevel);
      expect(result.slot1.itemLevel).toBeGreaterThanOrEqual(470); // Mythic quality

      // Slot 2 should be rewarded based on 4th highest key level (+5)
      const slot2ItemLevel = service['calculateMythicPlusItemLevel'](5);
      expect(result.slot2.itemLevel).toBe(slot2ItemLevel);
      expect(result.slot2.itemLevel).toBeLessThan(470); // Should be Heroic quality
    });
  });

  describe('Scenario: 1 +10 from last week', () => {
    it('should filter out last week runs and give no vault slots', () => {
      const result = service.calculateMythicPlusProgress(onePlus10LastWeek);

      expect(result.completedDungeons).toBe(0);
      expect(result.highestKeyLevel).toBe(0);

      // No slots should be unlocked
      expect(result.slot1.unlocked).toBe(false);
      expect(result.slot2.unlocked).toBe(false);
      expect(result.slot3.unlocked).toBe(false);
    });
  });

  describe('Scenario: Mixed current and last week runs', () => {
    it('should only count current week runs', () => {
      const result = service.calculateMythicPlusProgress(mixedWeekRuns);

      // Should only count the 2 current week runs (ignore the 2 last week runs)
      expect(result.completedDungeons).toBe(2);
      expect(result.highestKeyLevel).toBe(12); // Highest from current week, not last week

      // Should unlock slot 1 only (need 4 for slot 2)
      expect(result.slot1.unlocked).toBe(true);
      expect(result.slot2.unlocked).toBe(false);
      expect(result.slot3.unlocked).toBe(false);
    });

    it('should base rewards on current week runs only', () => {
      const result = service.calculateMythicPlusProgress(mixedWeekRuns);

      // Slot 1 should be based on highest current week run (+12), not last week (+15)
      const expectedItemLevel = service['calculateMythicPlusItemLevel'](12);
      expect(result.slot1.itemLevel).toBe(expectedItemLevel);
    });
  });

  describe('Scenario: 8+ dungeons for all vault slots', () => {
    it('should unlock all 3 vault slots with appropriate rewards', () => {
      const result = service.calculateMythicPlusProgress(eightDungeonsVariousLevels);

      expect(result.completedDungeons).toBe(8);
      expect(result.highestKeyLevel).toBe(15);

      // All slots should be unlocked
      expect(result.slot1.unlocked).toBe(true);
      expect(result.slot2.unlocked).toBe(true);
      expect(result.slot3.unlocked).toBe(true);

      // All progress should be 1 (100%)
      expect(result.slot1.progress).toBe(1);
      expect(result.slot2.progress).toBe(1);
      expect(result.slot3.progress).toBe(1);
    });

    it('should assign rewards based on 1st, 4th, and 8th highest key levels', () => {
      const result = service.calculateMythicPlusProgress(eightDungeonsVariousLevels);

      // Slot 1: based on 1st highest (+15)
      expect(result.slot1.itemLevel).toBe(service['calculateMythicPlusItemLevel'](15));

      // Slot 2: based on 4th highest (+10)
      expect(result.slot2.itemLevel).toBe(service['calculateMythicPlusItemLevel'](10));

      // Slot 3: based on 8th highest (+5)
      expect(result.slot3.itemLevel).toBe(service['calculateMythicPlusItemLevel'](5));

      // Verify the progression: slot1 >= slot2 >= slot3
      expect(result.slot1.itemLevel).toBeGreaterThanOrEqual(result.slot2.itemLevel);
      expect(result.slot2.itemLevel).toBeGreaterThanOrEqual(result.slot3.itemLevel);
    });
  });

  describe('Scenario: No Mythic+ runs', () => {
    it('should give no vault slots for no completed dungeons', () => {
      const result = service.calculateMythicPlusProgress(noMythicPlusRuns);

      expect(result.completedDungeons).toBe(0);
      expect(result.highestKeyLevel).toBe(0);

      // No slots should be unlocked
      expect(result.slot1.unlocked).toBe(false);
      expect(result.slot2.unlocked).toBe(false);
      expect(result.slot3.unlocked).toBe(false);

      // All progress should be 0
      expect(result.slot1.progress).toBe(0);
      expect(result.slot2.progress).toBe(0);
      expect(result.slot3.progress).toBe(0);
    });
  });

  describe('Weekly filtering', () => {
    it('should filter runs based on Wednesday 15:00 UTC reset', () => {
      // Create runs that span across reset
      const testRuns = [
        {
          ...oneDungeonPlus10[0],
          completed_timestamp: new Date('2023-12-13T16:00:00.000Z').getTime(), // After reset
        },
        {
          ...oneDungeonPlus10[0],
          keystone_level: 8,
          completed_timestamp: new Date('2023-12-13T14:00:00.000Z').getTime(), // Before reset
        }
      ];

      const result = service.calculateMythicPlusProgress(testRuns);

      // Should only count the run after reset
      expect(result.completedDungeons).toBe(1);
      expect(result.highestKeyLevel).toBe(10); // Only the post-reset run
    });
  });

  describe('Item level calculations', () => {
    it('should calculate correct item levels for different key levels', () => {
      // Test various key levels to ensure proper item level scaling
      const keyLevels = [2, 5, 7, 10, 12, 15];

      keyLevels.forEach(keyLevel => {
        const itemLevel = service['calculateMythicPlusItemLevel'](keyLevel);
        expect(itemLevel).toBeGreaterThan(0);
        expect(itemLevel).toBeLessThanOrEqual(500); // Reasonable upper bound
      });
    });

    it('should have higher item levels for higher key levels', () => {
      const itemLevel5 = service['calculateMythicPlusItemLevel'](5);
      const itemLevel10 = service['calculateMythicPlusItemLevel'](10);
      const itemLevel15 = service['calculateMythicPlusItemLevel'](15);

      expect(itemLevel10).toBeGreaterThan(itemLevel5);
      expect(itemLevel15).toBeGreaterThan(itemLevel10);
    });
  });
});