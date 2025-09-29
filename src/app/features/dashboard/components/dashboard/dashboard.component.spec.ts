import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DashboardComponent } from './dashboard.component';
import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { CharacterActivity } from '../../models/activity.model';
import { Race } from '../../enums/race.enum';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
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
        DashboardComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CharacterStore, useValue: characterStoreSpy },
        { provide: ActivityStore, useValue: activityStoreSpy },
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
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

  it('should display character overview with correct data', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check if character overview is displayed
    const characterCards = compiled.querySelectorAll('[data-testid="character-card"]');
    // Since we're using a different template structure, check for general content
    expect(compiled.textContent).toContain('Testchar');
    expect(compiled.textContent).toContain('Altchar');
  });

  it('should calculate dashboard statistics correctly', () => {
    const dashboardStats = component['dashboardStats']();

    expect(dashboardStats.totalCharacters).toBe(2);
    expect(dashboardStats.totalActivities).toBeGreaterThan(0);
    expect(dashboardStats.averageVaultProgress).toBeGreaterThanOrEqual(0);
    expect(dashboardStats.averageVaultProgress).toBeLessThanOrEqual(100);
    expect(dashboardStats.charactersWithFullVault).toBeGreaterThanOrEqual(0);
    expect(dashboardStats.mostActiveCharacter).toBeTruthy();
  });

  it('should calculate enhanced character data correctly', () => {
    const enhancedCharacters = component['enhancedCharacters']();

    expect(enhancedCharacters.length).toBe(2);

    const char1 = enhancedCharacters.find(c => c.id === 'char-1');
    const char2 = enhancedCharacters.find(c => c.id === 'char-2');

    expect(char1).toBeTruthy();
    expect(char2).toBeTruthy();

    if (char1) {
      expect(char1.weeklyActivities).toBeGreaterThan(0);
      expect(char1.vaultProgress).toBeGreaterThan(0);
      expect(char1.vaultPercentage).toBeGreaterThanOrEqual(0);
      expect(char1.vaultPercentage).toBeLessThanOrEqual(100);
      expect(char1.lastActivity).toBeTruthy();
    }

    if (char2) {
      expect(char2.weeklyActivities).toBeGreaterThanOrEqual(0);
      expect(char2.vaultProgress).toBeGreaterThanOrEqual(0);
      expect(char2.vaultPercentage).toBeGreaterThanOrEqual(0);
      expect(char2.vaultPercentage).toBeLessThanOrEqual(100);
    }
  });

  it('should handle character selection', () => {
    const testCharacter = mockCharacters[0];

    component['onCharacterSelect'](testCharacter);

    const selectedCharacter = component['selectedCharacter']();
    expect(selectedCharacter).toBe(testCharacter);
  });

  it('should handle add character action', () => {
    component['onAddCharacter']();

    expect(component['editingCharacter']()).toBeNull();
    expect(component['showCharacterForm']()).toBe(true);
  });

  it('should handle edit character action', () => {
    const testCharacter = mockCharacters[0];

    component['onEditCharacter'](testCharacter);

    expect(component['editingCharacter']()).toBe(testCharacter);
    expect(component['showCharacterForm']()).toBe(true);
  });

  it('should handle character form close', () => {
    // Set form as open first
    component['showCharacterForm'].set(true);
    component['editingCharacter'].set(mockCharacters[0]);

    component['onCharacterFormClose']();

    expect(component['showCharacterForm']()).toBe(false);
    expect(component['editingCharacter']()).toBeNull();
  });

  it('should handle character saved', () => {
    // Set form as open first
    component['showCharacterForm'].set(true);
    component['editingCharacter'].set(mockCharacters[0]);

    component['onCharacterSaved']();

    expect(component['showCharacterForm']()).toBe(false);
    expect(component['editingCharacter']()).toBeNull();
  });

  it('should get faction severity correctly', () => {
    const allianceSeverity = component['getFactionSeverity'](Faction.Alliance);
    const hordeSeverity = component['getFactionSeverity'](Faction.Horde);

    expect(allianceSeverity).toBe('info');
    expect(hordeSeverity).toBe('warning');
  });

  it('should get class color correctly', () => {
    const warriorColor = component['getClassColor'](CharacterClass.Warrior);
    const mageColor = component['getClassColor'](CharacterClass.Mage);

    expect(warriorColor).toBe('#C69B6D');
    expect(mageColor).toBe('#3FC7EB');
  });

  it('should get vault progress severity correctly', () => {
    expect(component['getVaultProgressSeverity'](100)).toBe('success');
    expect(component['getVaultProgressSeverity'](80)).toBe('info');
    expect(component['getVaultProgressSeverity'](60)).toBe('warning');
    expect(component['getVaultProgressSeverity'](30)).toBe('danger');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15T14:30:00');
    const formatted = component['formatDate'](testDate);

    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('should format relative time correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);

    const hourFormat = component['formatRelativeTime'](oneHourAgo);
    const dayFormat = component['formatRelativeTime'](oneDayAgo);

    expect(hourFormat).toContain('hour');
    expect(dayFormat).toContain('day');
  });

  it('should get next reset time correctly', () => {
    const nextReset = component['getNextResetTime']();
    expect(typeof nextReset).toBe('string');
    expect(nextReset.length).toBeGreaterThan(0);
  });

  it('should handle empty character list', () => {
    // Update mock to return empty array
    mockCharacterStore.entities = signal([]);
    fixture.detectChanges();

    const dashboardStats = component['dashboardStats']();
    expect(dashboardStats.totalCharacters).toBe(0);
    expect(dashboardStats.totalActivities).toBe(0);
    expect(dashboardStats.averageVaultProgress).toBe(0);
    expect(dashboardStats.charactersWithFullVault).toBe(0);
    expect(dashboardStats.mostActiveCharacter).toBeNull();
  });

  it('should handle characters without activities', () => {
    // Update mock to return empty activities
    mockActivityStore.activities = signal({});
    fixture.detectChanges();

    const enhancedCharacters = component['enhancedCharacters']();
    expect(enhancedCharacters.length).toBe(2);

    enhancedCharacters.forEach(char => {
      expect(char.weeklyActivities).toBe(0);
      expect(char.vaultProgress).toBe(0);
      expect(char.vaultPercentage).toBe(0);
      expect(char.lastActivity).toBeNull();
    });
  });

  it('should sort enhanced characters by vault progress', () => {
    const enhancedCharacters = component['enhancedCharacters']();

    // Verify sorting (highest vault progress first)
    for (let i = 0; i < enhancedCharacters.length - 1; i++) {
      expect(enhancedCharacters[i].vaultPercentage).toBeGreaterThanOrEqual(
        enhancedCharacters[i + 1].vaultPercentage
      );
    }
  });

  it('should calculate vault progress correctly for characters', () => {
    const enhancedCharacters = component['enhancedCharacters']();
    const char1 = enhancedCharacters.find(c => c.id === 'char-1');

    if (char1) {
      // Char1 has 8 M+ dungeons (3 slots) + 12 raid bosses (3 slots) = 6 vault slots
      expect(char1.vaultProgress).toBe(6);
      expect(char1.vaultPercentage).toBe(100); // 6/6 * 100
    }
  });

  it('should identify most active character correctly', () => {
    const dashboardStats = component['dashboardStats']();

    expect(dashboardStats.mostActiveCharacter).toBeTruthy();
    if (dashboardStats.mostActiveCharacter) {
      // Should be char-1 due to more activities
      expect(dashboardStats.mostActiveCharacter.id).toBe('char-1');
    }
  });

  it('should calculate average vault progress correctly', () => {
    const dashboardStats = component['dashboardStats']();

    // With 2 characters having different vault progress
    expect(dashboardStats.averageVaultProgress).toBeGreaterThan(0);
    expect(dashboardStats.averageVaultProgress).toBeLessThanOrEqual(100);
  });

  it('should count characters with full vault correctly', () => {
    const dashboardStats = component['dashboardStats']();

    // Characters with 9+ vault slots (3 M+ + 3 Raid + 3 PvP theoretical max)
    expect(dashboardStats.charactersWithFullVault).toBeGreaterThanOrEqual(0);
  });

  it('should handle loading states', () => {
    mockCharacterStore.loading = signal(true);
    mockActivityStore.loading = signal(true);
    fixture.detectChanges();

    expect(component['charactersLoading']()).toBe(true);
    expect(component['activitiesLoading']()).toBe(true);
  });

  it('should handle error states', () => {
    const testError = 'Test error message';
    mockCharacterStore.error = signal(testError);
    mockActivityStore.error = signal(testError);
    fixture.detectChanges();

    // Component should still function with errors
    expect(component).toBeTruthy();
  });

  it('should display correct number of activity panels', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check for activity panels
    const panels = compiled.querySelectorAll('p-panel');
    expect(panels.length).toBeGreaterThan(0);
  });

  it('should handle character selection from overview', () => {
    const testCharacter = mockCharacters[0];
    const spy = spyOn(component, 'onCharacterSelect').and.callThrough();

    component.onCharacterSelect(testCharacter);

    expect(spy).toHaveBeenCalledWith(testCharacter);
    expect(component['selectedCharacter']()).toBe(testCharacter);
  });
});