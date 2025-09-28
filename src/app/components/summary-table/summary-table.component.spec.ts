import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SummaryTableComponent } from './summary-table.component';
import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { CharacterActivity } from '../../models/activity.model';
import { Race } from '../../enums/race.enum';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';

describe('SummaryTableComponent', () => {
  let component: SummaryTableComponent;
  let fixture: ComponentFixture<SummaryTableComponent>;
  let mockCharacterStore: jasmine.SpyObj<CharacterStore>;
  let mockActivityStore: jasmine.SpyObj<ActivityStore>;
  let mockActivityService: jasmine.SpyObj<ActivityService>;

  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      name: 'Testchar',
      race: Race.Human,
      faction: Faction.Alliance,
      characterClass: CharacterClass.Warrior,
      specialization: 'Protection',
      professions: [Profession.Mining, Profession.Blacksmithing],
      level: 80,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'char-2',
      name: 'Altchar',
      race: Race.Orc,
      faction: Faction.Horde,
      characterClass: CharacterClass.Mage,
      specialization: 'Frost',
      professions: [Profession.Enchanting, Profession.Tailoring],
      level: 80,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'char-3',
      name: 'Inactivechar',
      race: Race.NightElf,
      faction: Faction.Alliance,
      characterClass: CharacterClass.Hunter,
      specialization: 'Beast Mastery',
      professions: [Profession.Skinning, Profession.Leatherworking],
      level: 75,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-05')
    }
  ];

  const mockActivities: { [characterId: string]: CharacterActivity } = {
    'char-1': {
      characterId: 'char-1',
      weekStartDate: new Date(),
      mythicPlus: {
        characterId: 'char-1',
        weekStartDate: new Date(),
        completed: false,
        lastUpdated: new Date(),
        dungeonCount: 8,
        highestKeyLevel: 15,
        averageKeyLevel: 12,
        inTimeRuns: 6,
        vaultProgress: {
          slot1: true,
          slot2: true,
          slot3: true
        }
      },
      raid: {
        characterId: 'char-1',
        weekStartDate: new Date(),
        completed: false,
        lastUpdated: new Date(),
        lfrBossesKilled: 0,
        normalBossesKilled: 4,
        heroicBossesKilled: 6,
        mythicBossesKilled: 2,
        vaultProgress: {
          slot1: true,
          slot2: true,
          slot3: true
        }
      },
      weeklyQuests: {
        characterId: 'char-1',
        weekStartDate: new Date(),
        completed: false,
        lastUpdated: new Date(),
        worldBossCompleted: true,
        sparkFragments: 2,
        professionQuestsDone: 2,
        weeklyEventCompleted: true
      },
      lastUpdated: new Date()
    },
    'char-2': {
      characterId: 'char-2',
      weekStartDate: new Date(),
      mythicPlus: {
        characterId: 'char-2',
        weekStartDate: new Date(),
        completed: false,
        lastUpdated: new Date(),
        dungeonCount: 4,
        highestKeyLevel: 10,
        averageKeyLevel: 8,
        inTimeRuns: 2,
        vaultProgress: {
          slot1: true,
          slot2: true,
          slot3: false
        }
      },
      raid: {
        characterId: 'char-2',
        weekStartDate: new Date(),
        completed: false,
        lastUpdated: new Date(),
        lfrBossesKilled: 2,
        normalBossesKilled: 2,
        heroicBossesKilled: 0,
        mythicBossesKilled: 0,
        vaultProgress: {
          slot1: true,
          slot2: true,
          slot3: false
        }
      },
      weeklyQuests: {
        characterId: 'char-2',
        weekStartDate: new Date(),
        completed: false,
        lastUpdated: new Date(),
        worldBossCompleted: false,
        sparkFragments: 1,
        professionQuestsDone: 1,
        weeklyEventCompleted: false
      },
      lastUpdated: new Date()
    }
    // char-3 has no activities (inactive character)
  };

  beforeEach(async () => {
    const characterStoreSpy = jasmine.createSpyObj('CharacterStore', [
      'addCharacter',
      'updateCharacter',
      'removeCharacter'
    ], {
      entities: signal(mockCharacters),
      loading: signal(false),
      error: signal(null)
    });

    const activityStoreSpy = jasmine.createSpyObj('ActivityStore', [
      'updateMythicPlusActivity',
      'updateRaidActivity',
      'updateWeeklyQuestActivity'
    ], {
      activities: signal(mockActivities),
      loading: signal(false),
      error: signal(null)
    });

    const activityServiceSpy = jasmine.createSpyObj('ActivityService', [
      'getNextResetDate',
      'isResetDue'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        SummaryTableComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CharacterStore, useValue: characterStoreSpy },
        { provide: ActivityStore, useValue: activityStoreSpy },
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryTableComponent);
    component = fixture.componentInstance;
    mockCharacterStore = TestBed.inject(CharacterStore) as jasmine.SpyObj<CharacterStore>;
    mockActivityStore = TestBed.inject(ActivityStore) as jasmine.SpyObj<ActivityStore>;
    mockActivityService = TestBed.inject(ActivityService) as jasmine.SpyObj<ActivityService>;

    // Setup service return values
    mockActivityService.getNextResetDate.and.returnValue(new Date(Date.now() + 86400000)); // Tomorrow
    mockActivityService.isResetDue.and.returnValue(false);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display summary statistics correctly', () => {
    const tableStats = component['tableStats']();

    expect(tableStats.totalCharacters).toBe(3);
    expect(tableStats.averageCompletion).toBeGreaterThanOrEqual(0);
    expect(tableStats.averageCompletion).toBeLessThanOrEqual(100);
    expect(tableStats.totalVaultSlots).toBeGreaterThanOrEqual(0);
    expect(tableStats.activeCharacters).toBeGreaterThanOrEqual(0);
    expect(tableStats.goalsMetCount).toBeGreaterThanOrEqual(0);
  });

  it('should generate character summaries correctly', () => {
    const characterSummaries = component['characterSummaries']();

    expect(characterSummaries.length).toBe(3);

    const char1 = characterSummaries.find(c => c.id === 'char-1');
    const char2 = characterSummaries.find(c => c.id === 'char-2');
    const char3 = characterSummaries.find(c => c.id === 'char-3');

    expect(char1).toBeTruthy();
    expect(char2).toBeTruthy();
    expect(char3).toBeTruthy();

    if (char1) {
      expect(char1.mythicPlusProgress.dungeonCount).toBe(8);
      expect(char1.mythicPlusProgress.vaultSlots).toBe(3);
      expect(char1.raidProgress.totalBosses).toBe(12); // 0+4+6+2
      expect(char1.raidProgress.vaultSlots).toBe(3);
      expect(char1.weeklyQuestProgress.completed).toBe(6); // All quests completed
      expect(char1.isActive).toBe(true);
      expect(char1.weeklyGoalMet).toBe(true); // Should be high completion
    }

    if (char3) {
      // Inactive character with no activities
      expect(char3.mythicPlusProgress.dungeonCount).toBe(0);
      expect(char3.raidProgress.totalBosses).toBe(0);
      expect(char3.weeklyQuestProgress.completed).toBe(0);
      expect(char3.isActive).toBe(false);
      expect(char3.overallCompletion).toBe(0);
    }
  });

  it('should calculate mythic plus progress correctly', () => {
    const characterSummaries = component['characterSummaries']();
    const char1 = characterSummaries.find(c => c.id === 'char-1');

    if (char1) {
      expect(char1.mythicPlusProgress.dungeonCount).toBe(8);
      expect(char1.mythicPlusProgress.highestKey).toBe(15);
      expect(char1.mythicPlusProgress.vaultSlots).toBe(3); // 8 dungeons = 3 slots
      expect(char1.mythicPlusProgress.percentage).toBe(100); // 8/8 * 100
    }
  });

  it('should calculate raid progress correctly', () => {
    const characterSummaries = component['characterSummaries']();
    const char1 = characterSummaries.find(c => c.id === 'char-1');

    if (char1) {
      expect(char1.raidProgress.totalBosses).toBe(12);
      expect(char1.raidProgress.highestDifficulty).toBe('Mythic');
      expect(char1.raidProgress.vaultSlots).toBe(3); // 12 bosses = 3 slots
      expect(char1.raidProgress.percentage).toBe(60); // 12/20 * 100 (assuming 20 max)
    }
  });

  it('should calculate weekly quest progress correctly', () => {
    const characterSummaries = component['characterSummaries']();
    const char1 = characterSummaries.find(c => c.id === 'char-1');

    if (char1) {
      // World boss (1) + Spark (1) + Profession quests (2) + Weekly event (1) + Weekly boss (1) = 6
      expect(char1.weeklyQuestProgress.completed).toBe(6);
      expect(char1.weeklyQuestProgress.total).toBe(5); // Total possible
      expect(char1.weeklyQuestProgress.percentage).toBe(100); // All completed
    }
  });

  it('should calculate overall completion correctly', () => {
    const characterSummaries = component['characterSummaries']();
    const char1 = characterSummaries.find(c => c.id === 'char-1');

    if (char1) {
      // Weighted average: M+ 40%, Raids 40%, Quests 20%
      // M+: 100%, Raids: 60%, Quests: 100%
      // (100 * 0.4) + (60 * 0.4) + (100 * 0.2) = 40 + 24 + 20 = 84%
      expect(char1.overallCompletion).toBe(84);
      expect(char1.weeklyGoalMet).toBe(true); // >= 80%
    }
  });

  it('should determine character activity status correctly', () => {
    const characterSummaries = component['characterSummaries']();

    const activeChar = characterSummaries.find(c => c.id === 'char-1');
    const inactiveChar = characterSummaries.find(c => c.id === 'char-3');

    expect(activeChar?.isActive).toBe(true);
    expect(inactiveChar?.isActive).toBe(false);
  });

  it('should handle global filtering correctly', () => {
    // Test initial state
    let filteredCharacters = component['filteredCharacters']();
    expect(filteredCharacters.length).toBe(3);

    // Test filtering by name
    component['globalFilterValue'].set('Test');
    filteredCharacters = component['filteredCharacters']();
    expect(filteredCharacters.length).toBe(1);
    expect(filteredCharacters[0].name).toBe('Testchar');

    // Test filtering by class
    component['globalFilterValue'].set('Warrior');
    filteredCharacters = component['filteredCharacters']();
    expect(filteredCharacters.length).toBe(1);
    expect(filteredCharacters[0].characterClass).toBe(CharacterClass.Warrior);

    // Test no matches
    component['globalFilterValue'].set('NonExistent');
    filteredCharacters = component['filteredCharacters']();
    expect(filteredCharacters.length).toBe(0);

    // Test empty filter
    component['globalFilterValue'].set('');
    filteredCharacters = component['filteredCharacters']();
    expect(filteredCharacters.length).toBe(3);
  });

  it('should handle global filter input event', () => {
    const mockEvent = {
      target: { value: 'Mage' }
    } as any;

    component['onGlobalFilter'](mockEvent);

    expect(component['globalFilterValue']()).toBe('Mage');
  });

  it('should handle row selection and deselection', () => {
    const mockCharacter = component['characterSummaries']()[0];
    const selectEvent = { data: mockCharacter };
    const unselectEvent = { data: mockCharacter };

    const selectSpy = spyOn(console, 'log');
    const unselectSpy = spyOn(console, 'log');

    component['onRowSelect'](selectEvent);
    component['onRowUnselect'](unselectEvent);

    expect(selectSpy).toHaveBeenCalledWith('Selected character:', mockCharacter);
    expect(unselectSpy).toHaveBeenCalledWith('Unselected character:', mockCharacter);
  });

  it('should export CSV correctly', () => {
    const downloadSpy = spyOn(component as any, 'downloadCSV');

    component['exportCSV']();

    expect(downloadSpy).toHaveBeenCalledWith(jasmine.any(String), 'character-summary.csv');
  });

  it('should export selected characters when available', () => {
    const characterSummaries = component['characterSummaries']();
    component['selectedCharacters'].set([characterSummaries[0]]);

    const downloadSpy = spyOn(component as any, 'downloadCSV');

    component['exportSelected']();

    expect(downloadSpy).toHaveBeenCalledWith(jasmine.any(String), 'selected-characters.csv');
  });

  it('should not export when no characters selected', () => {
    component['selectedCharacters'].set([]);

    const downloadSpy = spyOn(component as any, 'downloadCSV');

    component['exportSelected']();

    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it('should handle refresh data action', (done) => {
    expect(component['loading']()).toBe(false);

    component['refreshData']();

    expect(component['loading']()).toBe(true);

    // Wait for timeout to complete
    setTimeout(() => {
      expect(component['loading']()).toBe(false);
      done();
    }, 1100);
  });

  it('should get faction severity correctly', () => {
    expect(component['getFactionSeverity'](Faction.Alliance)).toBe('info');
    expect(component['getFactionSeverity'](Faction.Horde)).toBe('warn');
  });

  it('should get class color correctly', () => {
    expect(component['getClassColor'](CharacterClass.Warrior)).toBe('#C69B6D');
    expect(component['getClassColor'](CharacterClass.Mage)).toBe('#3FC7EB');
  });

  it('should get progress severity correctly', () => {
    expect(component['getProgressSeverity'](95)).toBe('success');
    expect(component['getProgressSeverity'](80)).toBe('info');
    expect(component['getProgressSeverity'](50)).toBe('warn');
    expect(component['getProgressSeverity'](20)).toBe('danger');
  });

  it('should get vault slot severity correctly', () => {
    expect(component['getVaultSlotSeverity'](6)).toBe('success');
    expect(component['getVaultSlotSeverity'](4)).toBe('info');
    expect(component['getVaultSlotSeverity'](2)).toBe('warn');
    expect(component['getVaultSlotSeverity'](0)).toBe('danger');
  });

  it('should format class name correctly', () => {
    expect(component['formatClassName'](CharacterClass.DeathKnight)).toBe('Death Knight');
    expect(component['formatClassName'](CharacterClass.DemonHunter)).toBe('Demon Hunter');
    expect(component['formatClassName'](CharacterClass.Warrior)).toBe('Warrior');
  });

  it('should format race name correctly', () => {
    expect(component['formatRaceName'](Race.NightElf)).toBe('Night Elf');
    expect(component['formatRaceName'](Race.Human)).toBe('Human');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15T14:30:00');
    const formatted = component['formatDate'](testDate);

    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('should format null date correctly', () => {
    const formatted = component['formatDate'](null);
    expect(formatted).toBe('Never');
  });

  it('should format relative time correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const hourFormat = component['formatRelativeTime'](oneHourAgo);
    const dayFormat = component['formatRelativeTime'](oneDayAgo);
    const nullFormat = component['formatRelativeTime'](null);

    expect(hourFormat).toContain('hour');
    expect(dayFormat).toContain('day');
    expect(nullFormat).toBe('Never');
  });

  it('should convert data to CSV format correctly', () => {
    const characterSummaries = component['characterSummaries']();
    const csvData = (component as any).convertToCSV(characterSummaries);

    expect(csvData).toContain('Name,Race,Faction,Class');
    expect(csvData).toContain('Testchar');
    expect(csvData).toContain('Altchar');
    expect(csvData).toContain('Inactivechar');
  });

  it('should handle empty character list correctly', () => {
    mockCharacterStore.entities = signal([]);
    fixture.detectChanges();

    const tableStats = component['tableStats']();
    expect(tableStats.totalCharacters).toBe(0);
    expect(tableStats.averageCompletion).toBe(0);
    expect(tableStats.totalVaultSlots).toBe(0);
    expect(tableStats.activeCharacters).toBe(0);
    expect(tableStats.goalsMetCount).toBe(0);

    const characterSummaries = component['characterSummaries']();
    expect(characterSummaries.length).toBe(0);
  });

  it('should handle loading states correctly', () => {
    mockCharacterStore.loading = signal(true);
    mockActivityStore.loading = signal(true);
    fixture.detectChanges();

    expect(component['charactersLoading']()).toBe(true);
    expect(component['activitiesLoading']()).toBe(true);
  });

  it('should handle characters without activities correctly', () => {
    mockActivityStore.activities = signal({});
    fixture.detectChanges();

    const characterSummaries = component['characterSummaries']();
    expect(characterSummaries.length).toBe(3);

    characterSummaries.forEach(char => {
      expect(char.mythicPlusProgress.dungeonCount).toBe(0);
      expect(char.raidProgress.totalBosses).toBe(0);
      expect(char.weeklyQuestProgress.completed).toBe(0);
      expect(char.overallCompletion).toBe(0);
      expect(char.vaultSlotsTotal).toBe(0);
      expect(char.isActive).toBe(false);
      expect(char.weeklyGoalMet).toBe(false);
    });
  });

  it('should calculate statistics correctly with mixed data', () => {
    const tableStats = component['tableStats']();

    // With our test data: 2 active, 1 inactive character
    expect(tableStats.totalCharacters).toBe(3);
    expect(tableStats.activeCharacters).toBe(2);
    expect(tableStats.averageCompletion).toBeGreaterThan(0);
    expect(tableStats.totalVaultSlots).toBeGreaterThan(0);
    expect(tableStats.goalsMetCount).toBeGreaterThan(0);
  });

  it('should display filter options correctly', () => {
    expect(component['factionOptions'].length).toBe(2);
    expect(component['classOptions'].length).toBeGreaterThan(0);
    expect(component['raceOptions'].length).toBeGreaterThan(0);
    expect(component['difficultyOptions'].length).toBe(4);
  });
});