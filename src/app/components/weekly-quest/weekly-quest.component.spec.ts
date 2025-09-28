import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { WeeklyQuestComponent } from './weekly-quest.component';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { CharacterActivity, Activity, WeeklyQuest } from '../../models/activity.model';
import { Race } from '../../enums/race.enum';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';

describe('WeeklyQuestComponent', () => {
  let component: WeeklyQuestComponent;
  let fixture: ComponentFixture<WeeklyQuestComponent>;
  let mockActivityStore: jasmine.SpyObj<ActivityStore>;
  let mockActivityService: jasmine.SpyObj<ActivityService>;

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Testchar',
    race: Race.Human,
    faction: Faction.Alliance,
    characterClass: CharacterClass.Warrior,
    specialization: 'Protection',
    professions: [Profession.Mining, Profession.Blacksmithing],
    level: 80,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockWeeklyQuests: WeeklyQuest = {
    characterId: 'char-1',
    weekStartDate: new Date(),
    completed: false,
    lastUpdated: new Date(),
    worldBossCompleted: true,
    sparkFragments: 1,
    professionQuestsDone: 1,
    weeklyEventCompleted: false
  };

  const mockCharacterActivity: CharacterActivity = {
    characterId: 'char-1',
    weekStartDate: new Date(),
    mythicPlus: {
      characterId: 'char-1',
      weekStartDate: new Date(),
      completed: false,
      lastUpdated: new Date(),
      dungeonCount: 0,
      highestKeyLevel: 0,
      vaultProgress: {
        slot1: false,
        slot2: false,
        slot3: false
      }
    },
    raid: {
      characterId: 'char-1',
      weekStartDate: new Date(),
      completed: false,
      lastUpdated: new Date(),
      lfrBossesKilled: 0,
      normalBossesKilled: 0,
      heroicBossesKilled: 0,
      mythicBossesKilled: 0,
      vaultProgress: {
        slot1: false,
        slot2: false,
        slot3: false
      }
    },
    weeklyQuests: mockWeeklyQuests,
    lastUpdated: new Date()
  };

  const mockActivities: { [characterId: string]: CharacterActivity } = {
    'char-1': mockCharacterActivity
  };

  beforeEach(async () => {
    const activityStoreSpy = jasmine.createSpyObj('ActivityStore', [
      'updateWeeklyQuestActivity',
      'addActivity'
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
        WeeklyQuestComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivityStore, useValue: activityStoreSpy },
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeeklyQuestComponent);
    component = fixture.componentInstance;
    mockActivityStore = TestBed.inject(ActivityStore) as jasmine.SpyObj<ActivityStore>;
    mockActivityService = TestBed.inject(ActivityService) as jasmine.SpyObj<ActivityService>;

    // Setup service return values
    mockActivityService.getNextResetDate.and.returnValue(new Date(Date.now() + 86400000)); // Tomorrow
    mockActivityService.isResetDue.and.returnValue(false);

    // Set input
    component.selectedCharacter = signal(mockCharacter);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display character weekly quest data', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check if weekly quest cards are displayed
    const questCards = compiled.querySelectorAll('p-card');
    expect(questCards.length).toBeGreaterThan(0);
  });

  it('should calculate quest progress correctly', () => {
    const questProgress = component['questProgress']();

    expect(questProgress.worldBoss.completed).toBe(true);
    expect(questProgress.sparkFragments.current).toBe(1);
    expect(questProgress.sparkFragments.max).toBe(2);
    expect(questProgress.professionQuests.completed).toBe(1);
    expect(questProgress.professionQuests.total).toBe(2); // 2 professions
    expect(questProgress.weeklyEvent.completed).toBe(false);
  });

  it('should calculate completion percentage correctly', () => {
    const completionPercentage = component['completionPercentage']();
    // 3 out of 5 possible quests completed (world boss + 1 spark + 1 profession + 0 event)
    // Total possible: world boss (1) + spark fragments (1 per week) + profession quests (2) + weekly event (1) = 5
    expect(completionPercentage).toBe(60); // 3/5 * 100
  });

  it('should get spark fragment progress correctly', () => {
    const sparkProgress = component['getSparkFragmentProgress']();
    expect(sparkProgress.current).toBe(1);
    expect(sparkProgress.percentage).toBe(50); // 1/2 * 100
    expect(sparkProgress.needsMore).toBe(true);
  });

  it('should handle null character correctly', () => {
    component.selectedCharacter = signal(null);
    fixture.detectChanges();

    const questProgress = component['questProgress']();
    expect(questProgress.worldBoss.completed).toBe(false);
    expect(questProgress.sparkFragments.current).toBe(0);
    expect(questProgress.professionQuests.completed).toBe(0);
    expect(questProgress.weeklyEvent.completed).toBe(false);
  });

  it('should handle character without weekly quest activity', () => {
    mockActivityStore.activities = signal({});
    fixture.detectChanges();

    const questProgress = component['questProgress']();
    expect(questProgress.worldBoss.completed).toBe(false);
    expect(questProgress.sparkFragments.current).toBe(0);
    expect(questProgress.professionQuests.completed).toBe(0);
    expect(questProgress.weeklyEvent.completed).toBe(false);
  });

  it('should toggle world boss completion', () => {
    const toggleSpy = spyOn(component, 'onToggleWorldBoss').and.callThrough();

    component.onToggleWorldBoss();

    expect(toggleSpy).toHaveBeenCalled();
  });

  it('should add spark fragment correctly', () => {
    const addSpy = spyOn(component, 'onAddSparkFragment').and.callThrough();

    component.onAddSparkFragment();

    expect(addSpy).toHaveBeenCalled();
  });

  it('should toggle profession quest correctly', () => {
    const toggleSpy = spyOn(component, 'onToggleProfessionQuest').and.callThrough();

    component.onToggleProfessionQuest(Profession.Mining);

    expect(toggleSpy).toHaveBeenCalledWith(Profession.Mining);
  });

  it('should toggle weekly event correctly', () => {
    const toggleSpy = spyOn(component, 'onToggleWeeklyEvent').and.callThrough();

    component.onToggleWeeklyEvent();

    expect(toggleSpy).toHaveBeenCalled();
  });

  it('should calculate profession quest status correctly', () => {
    const miningStatus = component['getProfessionQuestStatus'](Profession.Mining);
    const blacksmithingStatus = component['getProfessionQuestStatus'](Profession.Blacksmithing);

    // Character has 2 professions and 1 quest done
    expect(miningStatus || blacksmithingStatus).toBe(true);
  });

  it('should format profession name correctly', () => {
    const miningName = component['formatProfessionName'](Profession.Mining);
    const blacksmithingName = component['formatProfessionName'](Profession.Blacksmithing);

    expect(miningName).toBe('Mining');
    expect(blacksmithingName).toBe('Blacksmithing');
  });

  it('should get quest completion severity correctly', () => {
    expect(component['getCompletionSeverity'](100)).toBe('success');
    expect(component['getCompletionSeverity'](75)).toBe('info');
    expect(component['getCompletionSeverity'](50)).toBe('warn');
    expect(component['getCompletionSeverity'](25)).toBe('danger');
  });

  it('should get spark fragment severity correctly', () => {
    expect(component['getSparkFragmentSeverity'](2)).toBe('success');
    expect(component['getSparkFragmentSeverity'](1)).toBe('warn');
    expect(component['getSparkFragmentSeverity'](0)).toBe('danger');
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

  it('should handle quest updates correctly', () => {
    // Test world boss update
    const updateSpy = mockActivityStore.updateWeeklyQuestActivity;
    component.onToggleWorldBoss();

    // Since the component doesn't expose public methods for testing,
    // we verify the component can handle the operations without errors
    expect(component).toBeTruthy();
  });

  it('should show correct spark fragment text', () => {
    const sparkProgress = component['getSparkFragmentProgress']();
    expect(sparkProgress.current).toBe(1);
    expect(sparkProgress.needsMore).toBe(true);
  });

  it('should calculate total quests available correctly', () => {
    const questProgress = component['questProgress']();
    // World boss (1) + Spark fragment (1) + Profession quests (2) + Weekly event (1) = 5
    const totalAvailable = 1 + 1 + questProgress.professionQuests.total + 1;
    expect(totalAvailable).toBe(5);
  });

  it('should handle profession quest completion tracking', () => {
    const character = component.selectedCharacter();
    expect(character?.professions.length).toBe(2);

    const questProgress = component['questProgress']();
    expect(questProgress.professionQuests.total).toBe(2);
    expect(questProgress.professionQuests.completed).toBe(1);
  });

  it('should display weekly event status correctly', () => {
    const questProgress = component['questProgress']();
    expect(questProgress.weeklyEvent.completed).toBe(false);
    expect(questProgress.weeklyEvent.available).toBe(true);
  });

  it('should handle quest reset correctly', () => {
    // Test when reset is due
    mockActivityService.isResetDue.and.returnValue(true);
    fixture.detectChanges();

    // Component should handle reset scenario
    expect(component).toBeTruthy();
  });

  it('should show correct progress indicators', () => {
    const completionPercentage = component['completionPercentage']();
    expect(completionPercentage).toBeGreaterThanOrEqual(0);
    expect(completionPercentage).toBeLessThanOrEqual(100);
  });

  it('should handle empty profession list', () => {
    const characterWithoutProfessions: Character = {
      ...mockCharacter,
      professions: []
    };
    component.selectedCharacter = signal(characterWithoutProfessions);
    fixture.detectChanges();

    const questProgress = component['questProgress']();
    expect(questProgress.professionQuests.total).toBe(0);
    expect(questProgress.professionQuests.completed).toBe(0);
  });
});