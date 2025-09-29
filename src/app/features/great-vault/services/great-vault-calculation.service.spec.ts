import { TestBed } from '@angular/core/testing';
import { GreatVaultCalculationService } from './great-vault-calculation.service';
import { RaidDifficulty } from '../models/great-vault.model';
import {
  twoNormalBossKills,
  twoMythicThreeNormalBossKills,
  sameBossMultipleDifficulties,
  fourBossKills,
  sixBossKills,
  noBossKills,
  oneBossKill
} from './test-data/vault-calculation-test-data';

describe('GreatVaultCalculationService', () => {
  let service: GreatVaultCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GreatVaultCalculationService]
    });
    service = TestBed.inject(GreatVaultCalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateRaidProgress', () => {
    it('should calculate 1 vault slot for 2 Normal boss kills with Normal reward quality', () => {
      // Act
      const result = service.calculateRaidProgress(twoNormalBossKills);

      // Assert
      expect(result.slotsEarned).toBe(1);
      expect(result.uniqueBossCount).toBe(2);
      expect(result.slot1Reward?.difficulty).toBe(RaidDifficulty.Normal);
      expect(result.slot1Reward?.itemLevel).toBe(441); // Normal item level for Season 1
      expect(result.slot2Reward).toBeNull();
      expect(result.slot3Reward).toBeNull();
    });

    it('should calculate 3 vault slots for 2 Mythic + 3 Normal (5 total) with proper reward placement', () => {
      // Act
      const result = service.calculateRaidProgress(twoMythicThreeNormalBossKills);

      // Assert
      expect(result.slotsEarned).toBe(3);
      expect(result.uniqueBossCount).toBe(5);

      // First slot (2nd boss killed) should be from highest difficulty available
      expect(result.slot1Reward?.difficulty).toBe(RaidDifficulty.Mythic);
      expect(result.slot1Reward?.itemLevel).toBe(454); // Mythic item level

      // Second slot (4th boss killed) should be from available difficulties
      expect(result.slot2Reward?.difficulty).toBe(RaidDifficulty.Mythic);
      expect(result.slot2Reward?.itemLevel).toBe(454);

      // Third slot (6th boss killed) - but we only have 5 bosses, so uses 5th boss
      expect(result.slot3Reward?.difficulty).toBe(RaidDifficulty.Normal);
      expect(result.slot3Reward?.itemLevel).toBe(441);
    });

    it('should handle same boss killed on multiple difficulties as 1 unique boss', () => {
      // Act
      const result = service.calculateRaidProgress(sameBossMultipleDifficulties);

      // Assert
      expect(result.uniqueBossCount).toBe(1);
      expect(result.slotsEarned).toBe(0); // 1 boss < 2 required for first slot
      expect(result.slot1Reward).toBeNull();
      expect(result.slot2Reward).toBeNull();
      expect(result.slot3Reward).toBeNull();
    });

    it('should calculate 2 vault slots for 4 boss kills', () => {
      // Act
      const result = service.calculateRaidProgress(fourBossKills);

      // Assert
      expect(result.slotsEarned).toBe(2);
      expect(result.uniqueBossCount).toBe(4);
      expect(result.slot1Reward).not.toBeNull();
      expect(result.slot2Reward).not.toBeNull();
      expect(result.slot3Reward).toBeNull();
    });

    it('should calculate maximum 3 vault slots for 6+ boss kills', () => {
      // Act
      const result = service.calculateRaidProgress(sixBossKills);

      // Assert
      expect(result.slotsEarned).toBe(3);
      expect(result.uniqueBossCount).toBe(6);
      expect(result.slot1Reward).not.toBeNull();
      expect(result.slot2Reward).not.toBeNull();
      expect(result.slot3Reward).not.toBeNull();
    });

    it('should return 0 slots for no boss kills', () => {
      // Act
      const result = service.calculateRaidProgress(noBossKills);

      // Assert
      expect(result.slotsEarned).toBe(0);
      expect(result.uniqueBossCount).toBe(0);
      expect(result.slot1Reward).toBeNull();
      expect(result.slot2Reward).toBeNull();
      expect(result.slot3Reward).toBeNull();
    });

    it('should return 0 slots for 1 boss kill (insufficient)', () => {
      // Act
      const result = service.calculateRaidProgress(oneBossKill);

      // Assert
      expect(result.slotsEarned).toBe(0);
      expect(result.uniqueBossCount).toBe(1);
      expect(result.slot1Reward).toBeNull();
      expect(result.slot2Reward).toBeNull();
      expect(result.slot3Reward).toBeNull();
    });

    it('should prioritize highest difficulty for vault slot rewards', () => {
      // Arrange - Create test data with mixed difficulties
      const mixedDifficultyKills = [
        ...twoMythicThreeNormalBossKills.slice(0, 2), // 2 Mythic
        ...fourBossKills.slice(2, 4) // 2 Heroic (different bosses)
      ];

      // Act
      const result = service.calculateRaidProgress(mixedDifficultyKills);

      // Assert
      expect(result.slotsEarned).toBe(2);
      expect(result.slot1Reward?.difficulty).toBe(RaidDifficulty.Mythic);
      expect(result.slot2Reward?.difficulty).toBe(RaidDifficulty.Mythic);
    });
  });

  describe('unique boss counting', () => {
    it('should count unique bosses correctly through calculateRaidProgress', () => {
      // Act
      const result = service.calculateRaidProgress(sameBossMultipleDifficulties);

      // Assert
      expect(result.uniqueBossCount).toBe(1);
    });

    it('should count different bosses correctly through calculateRaidProgress', () => {
      // Act
      const result = service.calculateRaidProgress(twoNormalBossKills);

      // Assert
      expect(result.uniqueBossCount).toBe(2);
    });
  });

  describe('vault slot requirements', () => {
    it('should follow 2/4/6 boss requirements for 1/2/3 slots', () => {
      // Test 2 bosses = 1 slot
      expect(service.calculateRaidProgress(twoNormalBossKills).slotsEarned).toBe(1);

      // Test 4 bosses = 2 slots
      expect(service.calculateRaidProgress(fourBossKills).slotsEarned).toBe(2);

      // Test 6 bosses = 3 slots
      expect(service.calculateRaidProgress(sixBossKills).slotsEarned).toBe(3);
    });

    it('should handle edge cases around thresholds', () => {
      // 1 boss = 0 slots
      expect(service.calculateRaidProgress(oneBossKill).slotsEarned).toBe(0);

      // 3 bosses = 1 slot
      const threeBosses = twoNormalBossKills.concat([{
        bossId: 9999,
        bossName: "Test Boss",
        instanceId: 1302,
        instanceName: "Test Instance",
        difficulty: RaidDifficulty.Normal,
        killedAt: new Date(),
        lootEligible: true
      }]);
      expect(service.calculateRaidProgress(threeBosses).slotsEarned).toBe(1);

      // 5 bosses = 2 slots
      const fiveBosses = fourBossKills.concat([{
        bossId: 9998,
        bossName: "Test Boss 2",
        instanceId: 1302,
        instanceName: "Test Instance",
        difficulty: RaidDifficulty.Normal,
        killedAt: new Date(),
        lootEligible: true
      }]);
      expect(service.calculateRaidProgress(fiveBosses).slotsEarned).toBe(2);
    });
  });

  describe('item level calculations', () => {
    it('should assign correct item levels based on difficulty', () => {
      // Act
      const result = service.calculateRaidProgress(twoMythicThreeNormalBossKills);

      // Assert
      expect(result.slot1Reward?.itemLevel).toBe(454); // Mythic
      expect(result.slot2Reward?.itemLevel).toBe(454); // Mythic
      expect(result.slot3Reward?.itemLevel).toBe(441); // Normal
    });
  });
});