import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ActivityTrackerComponent } from './activity-tracker.component';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { Activity } from '../../models/activity.model';
import { ActivityType } from '../../enums/activity-type.enum';
import { Faction } from '../../enums/faction.enum';
import { Race } from '../../enums/race.enum';
import { CharacterClass } from '../../enums/class.enum';

describe('ActivityTrackerComponent', () => {
  let component: ActivityTrackerComponent;
  let fixture: ComponentFixture<ActivityTrackerComponent>;
  let mockActivityStore: any;
  let mockActivityService: jasmine.SpyObj<ActivityService>;

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'TestCharacter',
    race: Race.Human,
    faction: Faction.Alliance,
    characterClass: CharacterClass.Warrior,
    specialization: 'Protection',
    professions: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      characterId: 'char-1',
      type: ActivityType.MythicPlusCompleted,
      description: 'Completed M+15 Mists',
      date: new Date('2023-01-05T10:00:00'),
      vaultSlot: { type: 'mythicPlus', index: 0 }
    },
    {
      id: 'activity-2',
      characterId: 'char-1',
      type: ActivityType.RaidBossKilled,
      description: 'Killed Heroic Eranog',
      date: new Date('2023-01-05T20:00:00'),
      vaultSlot: { type: 'raid', index: 0 }
    },
    {
      id: 'activity-3',
      characterId: 'char-1',
      type: ActivityType.PvPMatchCompleted,
      description: 'Won Rated Battleground',
      date: new Date('2023-01-06T15:00:00'),
      vaultSlot: { type: 'pvp', index: 0 }
    },
    {
      id: 'activity-4',
      characterId: 'char-2', // Different character
      type: ActivityType.MythicPlusCompleted,
      description: 'M+ for other character',
      date: new Date('2023-01-05T10:00:00'),
      vaultSlot: { type: 'mythicPlus', index: 0 }
    }
  ];

  beforeEach(async () => {
    const activityServiceSpy = jasmine.createSpyObj('ActivityService', [
      'getCurrentWeekActivities',
      'calculateVaultProgress',
      'getVaultProgressPercentage',
      'getProjectedVaultRewards',
      'getNextResetDate'
    ]);

    mockActivityStore = jasmine.createSpyObj('ActivityStore', [], {
      activities: signal(mockActivities),
      loading: signal(false),
      error: signal(null)
    });

    // Setup service method return values
    activityServiceSpy.getCurrentWeekActivities.and.returnValue(mockActivities.slice(0, 3));
    activityServiceSpy.calculateVaultProgress.and.returnValue({
      raid: 1,
      mythicPlus: 1,
      pvp: 0,
      total: 2
    });
    activityServiceSpy.getVaultProgressPercentage.and.returnValue(22);
    activityServiceSpy.getProjectedVaultRewards.and.returnValue([
      {
        slot: 1,
        source: 'raid',
        itemLevel: 476,
        quality: 'Heroic'
      },
      {
        slot: 2,
        source: 'mythicPlus',
        itemLevel: 489,
        quality: 'Mythic'
      }
    ]);
    activityServiceSpy.getNextResetDate.and.returnValue(new Date('2023-01-11T00:00:00'));

    await TestBed.configureTestingModule({
      imports: [ActivityTrackerComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivityStore, useValue: mockActivityStore },
        { provide: ActivityService, useValue: activityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityTrackerComponent);
    component = fixture.componentInstance;
    mockActivityService = TestBed.inject(ActivityService) as jasmine.SpyObj<ActivityService>;

    // Set the input
    fixture.componentRef.setInput('selectedCharacter', mockCharacter);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component inputs and computed values', () => {
    it('should display selected character information', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('TestCharacter - Weekly Progress');
    });

    it('should filter activities by selected character', () => {
      const characterActivities = (component as any).characterActivities();
      expect(characterActivities.length).toBe(3);
      expect(characterActivities.every((activity: Activity) => activity.characterId === 'char-1')).toBeTrue();
    });

    it('should call activity service for current week activities', () => {
      (component as any).currentWeekActivities();
      expect(mockActivityService.getCurrentWeekActivities).toHaveBeenCalled();
    });

    it('should calculate vault progress correctly', () => {
      const vaultProgress = (component as any).vaultProgress();
      expect(mockActivityService.calculateVaultProgress).toHaveBeenCalled();
      expect(vaultProgress.total).toBe(2);
    });

    it('should calculate activity statistics', () => {
      const stats = (component as any).activityStats();
      expect(stats.totalActivities).toBe(3);
      expect(stats.mythicPlusCompleted).toBe(1);
      expect(stats.raidsCompleted).toBe(1);
      expect(stats.pvpMatches).toBe(1);
    });

    it('should calculate weekly progress percentages', () => {
      const weeklyProgress = (component as any).weeklyProgress();
      expect(weeklyProgress.completedSlots).toBe(2);
      expect(weeklyProgress.maxSlots).toBe(9);
      expect(weeklyProgress.percentage).toBe(22);
    });

    it('should format time until reset correctly', () => {
      const mockCurrentDate = new Date('2023-01-09T10:00:00'); // Monday
      spyOn(Date, 'now').and.returnValue(mockCurrentDate.getTime());

      const timeUntilReset = (component as any).timeUntilReset();
      expect(timeUntilReset).toMatch(/\d+d \d+h/); // Should show days and hours
    });
  });

  describe('template rendering', () => {
    it('should display vault progress information', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.vault-progress-card')).toBeTruthy();
      expect(compiled.textContent).toContain('Great Vault Progress');
      expect(compiled.textContent).toContain('2/9');
    });

    it('should display vault sources with correct progress', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      const vaultSources = compiled.querySelectorAll('.vault-source');
      expect(vaultSources.length).toBe(3); // Raid, M+, PvP

      expect(compiled.textContent).toContain('Raid');
      expect(compiled.textContent).toContain('Mythic+');
      expect(compiled.textContent).toContain('PvP');
    });

    it('should display activity summary statistics', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.activity-summary-card')).toBeTruthy();
      expect(compiled.textContent).toContain('Weekly Activity Summary');
      expect(compiled.textContent).toContain('Total Activities');
    });

    it('should display projected vault rewards', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.rewards-card')).toBeTruthy();
      expect(compiled.textContent).toContain('Projected Vault Rewards');

      const rewardItems = compiled.querySelectorAll('.reward-item');
      expect(rewardItems.length).toBe(2);
    });

    it('should display recent activities list', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.recent-activities-card')).toBeTruthy();
      expect(compiled.textContent).toContain('This Week\'s Activities');

      const activityItems = compiled.querySelectorAll('.activity-item');
      expect(activityItems.length).toBe(3);
    });

    it('should show reset timer information', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.querySelector('.reset-info')).toBeTruthy();
      expect(compiled.textContent).toContain('Reset in:');
    });

    it('should have refresh button', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      const refreshButton = compiled.querySelector('p-button[icon="pi pi-refresh"]');
      expect(refreshButton).toBeTruthy();
    });
  });

  describe('empty states', () => {
    it('should display no character selected state when no character provided', () => {
      fixture.componentRef.setInput('selectedCharacter', null);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.no-character-selected')).toBeTruthy();
      expect(compiled.textContent).toContain('No Character Selected');
    });

    it('should display no activities state when character has no current week activities', () => {
      mockActivityService.getCurrentWeekActivities.and.returnValue([]);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.no-activities-card')).toBeTruthy();
      expect(compiled.textContent).toContain('No Activities This Week');
    });
  });

  describe('loading states', () => {
    it('should display loading overlay when loading', () => {
      mockActivityStore.loading.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-overlay')).toBeTruthy();
      expect(compiled.textContent).toContain('Loading activity data...');
    });

    it('should hide loading overlay when not loading', () => {
      mockActivityStore.loading.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-overlay')).toBeFalsy();
    });
  });

  describe('utility methods', () => {
    it('should return correct vault source icons', () => {
      expect((component as any).getVaultSourceIcon('raid')).toBe('pi pi-trophy');
      expect((component as any).getVaultSourceIcon('mythicPlus')).toBe('pi pi-compass');
      expect((component as any).getVaultSourceIcon('pvp')).toBe('pi pi-flag');
    });

    it('should return correct vault source labels', () => {
      expect((component as any).getVaultSourceLabel('raid')).toBe('Raid');
      expect((component as any).getVaultSourceLabel('mythicPlus')).toBe('Mythic+');
      expect((component as any).getVaultSourceLabel('pvp')).toBe('PvP');
    });

    it('should return correct quality severities', () => {
      expect((component as any).getQualitySeverity('Mythic')).toBe('warn');
      expect((component as any).getQualitySeverity('Heroic')).toBe('info');
    });

    it('should return correct progress severities based on percentage', () => {
      expect((component as any).getProgressSeverity(100)).toBe('success');
      expect((component as any).getProgressSeverity(80)).toBe('info');
      expect((component as any).getProgressSeverity(60)).toBe('warn');
      expect((component as any).getProgressSeverity(30)).toBe('danger');
    });

    it('should format dates correctly', () => {
      const testDate = new Date('2023-01-15T14:30:00');
      const formatted = (component as any).formatDate(testDate);

      expect(formatted).toMatch(/Sun.*Jan.*15.*2:30|Sun.*Jan.*15.*14:30/);
    });
  });

  describe('user interactions', () => {
    it('should handle refresh data action', () => {
      spyOn(console, 'log');

      (component as any).onRefreshData();

      expect(console.log).toHaveBeenCalledWith('Refreshing activity data...');
    });

    it('should trigger refresh when refresh button is clicked', () => {
      spyOn(component as any, 'onRefreshData');

      const compiled = fixture.nativeElement as HTMLElement;
      const refreshButton = compiled.querySelector('p-button[icon="pi pi-refresh"]') as HTMLElement;

      refreshButton.click();
      fixture.detectChanges();

      expect((component as any).onRefreshData).toHaveBeenCalled();
    });
  });

  describe('activity filtering and sorting', () => {
    it('should sort character activities by date (newest first)', () => {
      const characterActivities = (component as any).characterActivities();

      for (let i = 0; i < characterActivities.length - 1; i++) {
        const currentDate = new Date(characterActivities[i].date).getTime();
        const nextDate = new Date(characterActivities[i + 1].date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it('should only include activities for selected character', () => {
      const characterActivities = (component as any).characterActivities();

      characterActivities.forEach((activity: Activity) => {
        expect(activity.characterId).toBe(mockCharacter.id);
      });
    });

    it('should handle character change correctly', () => {
      const newCharacter: Character = {
        ...mockCharacter,
        id: 'char-2',
        name: 'SecondCharacter'
      };

      fixture.componentRef.setInput('selectedCharacter', newCharacter);
      fixture.detectChanges();

      const characterActivities = (component as any).characterActivities();
      expect(characterActivities.length).toBe(1);
      expect(characterActivities[0].characterId).toBe('char-2');
    });
  });

  describe('computed value updates', () => {
    it('should recalculate stats when activities change', () => {
      const newActivities = [...mockActivities, {
        id: 'new-activity',
        characterId: 'char-1',
        type: ActivityType.QuestCompleted,
        description: 'Completed weekly quest',
        date: new Date('2023-01-07T10:00:00')
      }];

      mockActivityStore.activities.set(newActivities);
      fixture.detectChanges();

      const stats = (component as any).activityStats();
      expect(stats.questsCompleted).toBe(1);
    });

    it('should update vault progress when activities change', () => {
      mockActivityService.calculateVaultProgress.and.returnValue({
        raid: 2,
        mythicPlus: 1,
        pvp: 1,
        total: 4
      });

      // Trigger recomputation
      (component as any).vaultProgress();

      const weeklyProgress = (component as any).weeklyProgress();
      expect(weeklyProgress.completedSlots).toBe(4);
    });
  });
});