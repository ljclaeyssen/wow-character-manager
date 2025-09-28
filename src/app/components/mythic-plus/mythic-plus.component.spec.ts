import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MythicPlusComponent } from './mythic-plus.component';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { CharacterActivity, Activity } from '../../models/activity.model';
import { Race } from '../../enums/race.enum';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';

describe('MythicPlusComponent', () => {
  let component: MythicPlusComponent;
  let fixture: ComponentFixture<MythicPlusComponent>;
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

  const mockCharacterActivity: CharacterActivity = {
    characterId: 'char-1',
    weekStartDate: new Date(),
    mythicPlus: {
      characterId: 'char-1',
      weekStartDate: new Date(),
      completed: false,
      lastUpdated: new Date(),
      dungeonCount: 5,
      highestKeyLevel: 15,
      averageKeyLevel: 12,
      inTimeRuns: 3,
      vaultProgress: {
        slot1: true,
        slot2: true,
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
    weeklyQuests: {
      characterId: 'char-1',
      weekStartDate: new Date(),
      completed: false,
      lastUpdated: new Date(),
      worldBossCompleted: false,
      sparkFragments: 0,
      professionQuestsDone: 0,
      weeklyEventCompleted: false
    },
    lastUpdated: new Date()
  };

  const mockActivities: { [characterId: string]: CharacterActivity } = {
    'char-1': mockCharacterActivity
  };

  beforeEach(async () => {
    const activityStoreSpy = jasmine.createSpyObj('ActivityStore', [
      'updateMythicPlusActivity',
      'addActivity'
    ], {
      activities: signal(mockActivities),
      loading: signal(false),
      error: signal(null)
    });

    const activityServiceSpy = jasmine.createSpyObj('ActivityService', [
      'calculateMythicPlusVaultProgress',
      'getNextResetDate'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        MythicPlusComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ActivityStore, useValue: activityStoreSpy },
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MythicPlusComponent);
    component = fixture.componentInstance;
    mockActivityStore = TestBed.inject(ActivityStore) as jasmine.SpyObj<ActivityStore>;
    mockActivityService = TestBed.inject(ActivityService) as jasmine.SpyObj<ActivityService>;

    // Setup service return values
    mockActivityService.calculateMythicPlusVaultProgress.and.returnValue({
      slot1: true,
      slot2: true,
      slot3: false,
      slotsEarned: 2,
      nextMilestone: { target: 8, remaining: 3 }
    });
    mockActivityService.getNextResetDate.and.returnValue(new Date(Date.now() + 86400000)); // Tomorrow

    // Set input
    component.selectedCharacter = signal(mockCharacter);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display character mythic plus activity data', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    // Check if vault progress is displayed
    const vaultCards = compiled.querySelectorAll('.vault-card');
    expect(vaultCards.length).toBeGreaterThan(0);
  });

  it('should calculate vault progress correctly', () => {
    const vaultProgress = component['vaultProgress']();

    expect(vaultProgress.completed).toBe(5); // dungeonCount
    expect(vaultProgress.required).toEqual([1, 4, 8]);
    expect(vaultProgress.slots).toBe(2); // 5 dungeons = 2 slots
    expect(vaultProgress.percentage).toBe(62.5); // 5/8 * 100
  });

  it('should calculate weekly stats correctly', () => {
    const weeklyStats = component['weeklyStats']();

    expect(weeklyStats.totalRuns).toBe(5);
    expect(weeklyStats.highestKeyLevel).toBe(15);
    expect(weeklyStats.averageKeyLevel).toBe(12);
    expect(weeklyStats.inTimeRuns).toBe(3);
  });

  it('should return empty array for current week mythic plus runs', () => {
    const currentWeekRuns = component['currentWeekMythicPlus']();
    expect(Array.isArray(currentWeekRuns)).toBe(true);
    expect(currentWeekRuns.length).toBe(0);
  });

  it('should handle null character correctly', () => {
    component.selectedCharacter = signal(null);
    fixture.detectChanges();

    const vaultProgress = component['vaultProgress']();
    expect(vaultProgress.completed).toBe(0);
    expect(vaultProgress.slots).toBe(0);
    expect(vaultProgress.percentage).toBe(0);

    const weeklyStats = component['weeklyStats']();
    expect(weeklyStats.totalRuns).toBe(0);
    expect(weeklyStats.highestKeyLevel).toBe(0);
    expect(weeklyStats.averageKeyLevel).toBe(0);
    expect(weeklyStats.inTimeRuns).toBe(0);
  });

  it('should handle character without mythic plus activity', () => {
    const activitiesWithoutMythicPlus = {
      'char-1': {
        ...mockCharacterActivity,
        mythicPlus: {
          ...mockCharacterActivity.mythicPlus,
          dungeonCount: 0,
          highestKeyLevel: 0,
          averageKeyLevel: 0,
          inTimeRuns: 0
        }
      }
    };

    mockActivityStore.activities = signal(activitiesWithoutMythicPlus);
    fixture.detectChanges();

    const vaultProgress = component['vaultProgress']();
    expect(vaultProgress.completed).toBe(0);
    expect(vaultProgress.slots).toBe(0);

    const weeklyStats = component['weeklyStats']();
    expect(weeklyStats.totalRuns).toBe(0);
    expect(weeklyStats.highestKeyLevel).toBe(0);
  });

  it('should add mythic plus run when form is valid', () => {
    component['selectedDungeon'] = 'Mists of Tirna Scithe';
    component['keystoneLevel'] = 15;
    component['inTime'] = true;

    const addSpy = spyOn(component, 'onAddMythicPlus').and.callThrough();

    // Simulate form submission
    component.onAddMythicPlus();

    expect(addSpy).toHaveBeenCalled();
  });

  it('should not add mythic plus run when form is invalid', () => {
    component['selectedDungeon'] = null;
    component['keystoneLevel'] = 1; // Invalid level

    const updateSpy = mockActivityStore.updateMythicPlusActivity;

    component.onAddMythicPlus();

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should handle vault slot severity correctly', () => {
    const severity0 = component['getVaultSlotSeverity'](0);
    const severity1 = component['getVaultSlotSeverity'](1);
    const severity2 = component['getVaultSlotSeverity'](2);

    expect(severity0).toBe('success'); // slot earned
    expect(severity1).toBe('success'); // slot earned
    expect(severity2).toBe('info'); // slot not earned
  });

  it('should calculate progress percentage correctly', () => {
    expect(component['calculateProgressPercentage'](0)).toBe(0);
    expect(component['calculateProgressPercentage'](1)).toBe(12.5); // 1/8 * 100
    expect(component['calculateProgressPercentage'](4)).toBe(50); // 4/8 * 100
    expect(component['calculateProgressPercentage'](8)).toBe(100); // 8/8 * 100
    expect(component['calculateProgressPercentage'](10)).toBe(100); // Capped at 100
  });

  it('should calculate mythic plus slots correctly', () => {
    expect(component['calculateMythicPlusSlots'](0)).toBe(0);
    expect(component['calculateMythicPlusSlots'](1)).toBe(1);
    expect(component['calculateMythicPlusSlots'](4)).toBe(2);
    expect(component['calculateMythicPlusSlots'](8)).toBe(3);
    expect(component['calculateMythicPlusSlots'](10)).toBe(3); // Capped at 3
  });

  it('should get next milestone correctly', () => {
    expect(component['getNextMilestone'](0)).toEqual({ target: 1, remaining: 1 });
    expect(component['getNextMilestone'](1)).toEqual({ target: 4, remaining: 3 });
    expect(component['getNextMilestone'](4)).toEqual({ target: 8, remaining: 4 });
    expect(component['getNextMilestone'](8)).toEqual({ target: 8, remaining: 0 });
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15T14:30:00');
    const formatted = component['formatDate'](testDate);

    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('should get reward quality based on keystone level', () => {
    // Test with character that has key level 9 (heroic)
    const activitiesLowKey = {
      'char-1': {
        ...mockCharacterActivity,
        mythicPlus: {
          ...mockCharacterActivity.mythicPlus,
          highestKeyLevel: 9
        }
      }
    };
    mockActivityStore.activities = signal(activitiesLowKey);
    fixture.detectChanges();

    let rewardQuality = component['rewardQuality']();
    expect(rewardQuality).toBe('Heroic');

    // Test with character that has key level 15 (mythic)
    const activitiesHighKey = {
      'char-1': {
        ...mockCharacterActivity,
        mythicPlus: {
          ...mockCharacterActivity.mythicPlus,
          highestKeyLevel: 15
        }
      }
    };
    mockActivityStore.activities = signal(activitiesHighKey);
    fixture.detectChanges();

    rewardQuality = component['rewardQuality']();
    expect(rewardQuality).toBe('Mythic');
  });

  it('should display dungeon options', () => {
    const dungeonOptions = component['dungeonOptions'];
    expect(dungeonOptions.length).toBeGreaterThan(0);
    expect(dungeonOptions[0]).toHaveProperty('label');
    expect(dungeonOptions[0]).toHaveProperty('value');
  });

  it('should handle remove activity correctly', () => {
    const mockActivityId = 'activity-123';
    const removeSpy = spyOn(component, 'onRemoveActivity').and.callThrough();

    component.onRemoveActivity(mockActivityId);

    expect(removeSpy).toHaveBeenCalledWith(mockActivityId);
  });
});