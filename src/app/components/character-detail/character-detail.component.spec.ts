import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { CharacterDetailComponent } from './character-detail.component';
import { ActivityStore } from '../../store/activity.store';
import { Character } from '../../models/character.model';
import { Activity } from '../../models/activity.model';
import { Faction } from '../../enums/faction.enum';
import { Race } from '../../enums/race.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';
import { ActivityType } from '../../enums/activity-type.enum';

describe('CharacterDetailComponent', () => {
  let component: CharacterDetailComponent;
  let fixture: ComponentFixture<CharacterDetailComponent>;
  let mockActivityStore: jasmine.SpyObj<ActivityStore>;

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Thrall',
    race: Race.Orc,
    faction: Faction.Horde,
    characterClass: CharacterClass.Shaman,
    specialization: 'Enhancement',
    professions: [Profession.Alchemy, Profession.Herbalism],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02')
  };

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      characterId: 'char-1',
      type: ActivityType.MythicPlusCompleted,
      description: 'Completed Mythic+ dungeon',
      date: new Date('2023-01-01T10:00:00'),
      vaultSlot: { type: 'mythicPlus', index: 0 }
    },
    {
      id: 'activity-2',
      characterId: 'char-1',
      type: ActivityType.RaidBossKilled,
      description: 'Killed raid boss',
      date: new Date('2023-01-01T11:00:00'),
      vaultSlot: { type: 'raid', index: 0 }
    },
    {
      id: 'activity-3',
      characterId: 'char-1',
      type: ActivityType.PvPMatchCompleted,
      description: 'Won PvP match',
      date: new Date('2023-01-01T12:00:00'),
      vaultSlot: { type: 'pvp', index: 0 }
    },
    {
      id: 'activity-4',
      characterId: 'char-2',
      type: ActivityType.QuestCompleted,
      description: 'Completed quest',
      date: new Date('2023-01-01T13:00:00')
    }
  ];

  beforeEach(async () => {
    mockActivityStore = jasmine.createSpyObj('ActivityStore', [], {
      activities: signal(mockActivities),
      loading: signal(false),
      error: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [CharacterDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: ActivityStore, useValue: mockActivityStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterDetailComponent);
    component = fixture.componentInstance;

    // Set the required character input
    fixture.componentRef.setInput('character', mockCharacter);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display character information', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('Thrall');
    expect(compiled.textContent).toContain('80');
    expect(compiled.textContent).toContain('Orc');
    expect(compiled.textContent).toContain('Shaman');
    expect(compiled.textContent).toContain('Enhancement');
    expect(compiled.textContent).toContain('Horde');
  });

  it('should display character professions', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.textContent).toContain('Alchemy');
    expect(compiled.textContent).toContain('Herbalism');
  });

  it('should filter activities by character ID', () => {
    const characterActivities = component.characterActivities();

    expect(characterActivities.length).toBe(3);
    expect(characterActivities.every(activity => activity.characterId === 'char-1')).toBeTrue();
  });

  it('should sort activities by date (newest first)', () => {
    const characterActivities = component.characterActivities();

    expect(characterActivities[0].id).toBe('activity-3'); // Latest activity
    expect(characterActivities[1].id).toBe('activity-2');
    expect(characterActivities[2].id).toBe('activity-1'); // Earliest activity
  });

  it('should calculate vault progress correctly', () => {
    const vaultProgress = component.vaultProgress();

    expect(vaultProgress.raid).toBe(1);
    expect(vaultProgress.mythicPlus).toBe(1);
    expect(vaultProgress.pvp).toBe(1);
    expect(vaultProgress.total).toBe(3);
  });

  it('should calculate vault percentage correctly', () => {
    const vaultPercentage = component.vaultPercentage();

    expect(vaultPercentage).toBeCloseTo(33, 0); // 3/9 * 100 ≈ 33%
  });

  it('should show recent activities (max 5)', () => {
    const recentActivities = component.recentActivities();

    expect(recentActivities.length).toBe(3); // We only have 3 activities for this character
    expect(recentActivities[0].id).toBe('activity-3'); // Most recent first
  });

  it('should calculate activity statistics correctly', () => {
    const stats = component.activityStats();

    expect(stats.totalActivities).toBe(3);
    expect(stats.mythicPlusCompleted).toBe(1);
    expect(stats.raidsCompleted).toBe(1);
    expect(stats.pvpMatches).toBe(1);
  });

  it('should calculate weekly activities correctly', () => {
    // Mock current date to be within a week of the activities
    const originalDate = Date;
    const mockDate = new Date('2023-01-02T00:00:00');
    spyOn(window, 'Date').and.returnValue(mockDate);
    Object.setPrototypeOf(mockDate, originalDate.prototype);

    const stats = component.activityStats();
    expect(stats.weeklyCompleted).toBe(3); // All activities are within the week
  });

  it('should emit editCharacter event', () => {
    spyOn(component.editCharacter, 'emit');

    component.onEditCharacter();

    expect(component.editCharacter.emit).toHaveBeenCalledWith(mockCharacter);
  });

  it('should emit deleteCharacter event', () => {
    spyOn(component.deleteCharacter, 'emit');

    component.onDeleteCharacter();

    expect(component.deleteCharacter.emit).toHaveBeenCalledWith(mockCharacter);
  });

  it('should emit closeDetail event', () => {
    spyOn(component.closeDetail, 'emit');

    component.onClose();

    expect(component.closeDetail.emit).toHaveBeenCalled();
  });

  it('should return correct class colors', () => {
    expect(component.getClassColor(CharacterClass.Shaman)).toBe('#0070DE');
    expect(component.getClassColor(CharacterClass.Mage)).toBe('#69CCF0');
    expect(component.getClassColor(CharacterClass.Warrior)).toBe('#C79C6E');
  });

  it('should return correct faction colors', () => {
    expect(component.getFactionColor(Faction.Alliance)).toBe('#0078D4');
    expect(component.getFactionColor(Faction.Horde)).toBe('#C42128');
  });

  it('should return correct faction icons', () => {
    expect(component.getFactionIcon(Faction.Alliance)).toBe('pi pi-shield');
    expect(component.getFactionIcon(Faction.Horde)).toBe('pi pi-bolt');
  });

  it('should format race display names correctly', () => {
    expect(component.getRaceDisplayName('NightElf')).toBe('Night Elf');
    expect(component.getRaceDisplayName('BloodElf')).toBe('Blood Elf');
    expect(component.getRaceDisplayName('Orc')).toBe('Orc');
  });

  it('should return correct activity icons', () => {
    expect(component.getActivityIcon(ActivityType.MythicPlusCompleted)).toBe('pi pi-compass');
    expect(component.getActivityIcon(ActivityType.RaidBossKilled)).toBe('pi pi-trophy');
    expect(component.getActivityIcon(ActivityType.PvPMatchCompleted)).toBe('pi pi-flag');
    expect(component.getActivityIcon(ActivityType.QuestCompleted)).toBe('pi pi-check-circle');
    expect(component.getActivityIcon(ActivityType.AchievementEarned)).toBe('pi pi-star');
    expect(component.getActivityIcon(ActivityType.ItemObtained)).toBe('pi pi-gift');
  });

  it('should return correct activity severities', () => {
    expect(component.getActivitySeverity(ActivityType.MythicPlusCompleted)).toBe('info');
    expect(component.getActivitySeverity(ActivityType.RaidBossKilled)).toBe('success');
    expect(component.getActivitySeverity(ActivityType.PvPMatchCompleted)).toBe('danger');
    expect(component.getActivitySeverity(ActivityType.QuestCompleted)).toBe('secondary');
    expect(component.getActivitySeverity(ActivityType.AchievementEarned)).toBe('warning');
    expect(component.getActivitySeverity(ActivityType.ItemObtained)).toBe('contrast');
  });

  it('should format dates correctly', () => {
    const testDate = new Date('2023-01-15T14:30:00');
    const formatted = component.formatDate(testDate);

    expect(formatted).toMatch(/Jan 15.*2:30 PM|Jan 15.*14:30/); // Handles 12h/24h formats
  });

  it('should format relative time correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    spyOn(window, 'Date').and.returnValue(now);

    expect(component.formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    expect(component.formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    expect(component.formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should handle character with no activities', () => {
    // Set activities to empty array
    mockActivityStore.activities.set([]);
    fixture.detectChanges();

    const vaultProgress = component.vaultProgress();
    const stats = component.activityStats();
    const recentActivities = component.recentActivities();

    expect(vaultProgress.total).toBe(0);
    expect(stats.totalActivities).toBe(0);
    expect(recentActivities.length).toBe(0);
  });

  it('should handle character with no professions', () => {
    const characterWithoutProfessions: Character = {
      ...mockCharacter,
      professions: []
    };

    fixture.componentRef.setInput('character', characterWithoutProfessions);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    // Should not display professions section when empty
    expect(compiled.querySelector('.character-professions')).toBeFalsy();
  });

  it('should handle vault slots correctly for multiple activities of same type', () => {
    const activitiesWithMultipleSlots: Activity[] = [
      {
        id: 'activity-1',
        characterId: 'char-1',
        type: ActivityType.MythicPlusCompleted,
        description: 'M+ 1',
        date: new Date('2023-01-01'),
        vaultSlot: { type: 'mythicPlus', index: 0 }
      },
      {
        id: 'activity-2',
        characterId: 'char-1',
        type: ActivityType.MythicPlusCompleted,
        description: 'M+ 2',
        date: new Date('2023-01-01'),
        vaultSlot: { type: 'mythicPlus', index: 1 }
      },
      {
        id: 'activity-3',
        characterId: 'char-1',
        type: ActivityType.MythicPlusCompleted,
        description: 'M+ 3',
        date: new Date('2023-01-01'),
        vaultSlot: { type: 'mythicPlus', index: 2 }
      }
    ];

    mockActivityStore.activities.set(activitiesWithMultipleSlots);
    fixture.detectChanges();

    const vaultProgress = component.vaultProgress();
    expect(vaultProgress.mythicPlus).toBe(3);
    expect(vaultProgress.total).toBe(3);
  });

  it('should display vault progress UI elements', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.vault-progress-section')).toBeTruthy();
    expect(compiled.querySelector('.vault-breakdown')).toBeTruthy();
    expect(compiled.querySelectorAll('.vault-source').length).toBe(3); // Raid, M+, PvP
    expect(compiled.textContent).toContain('Great Vault Progress');
  });

  it('should display activity statistics in UI', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.activity-stats-card')).toBeTruthy();
    expect(compiled.querySelector('.activity-stats-grid')).toBeTruthy();
    expect(compiled.textContent).toContain('Activity Statistics');
    expect(compiled.textContent).toContain('Total Activities');
  });

  it('should display recent activities in UI', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.recent-activities-card')).toBeTruthy();
    expect(compiled.textContent).toContain('Recent Activities');
    expect(compiled.querySelectorAll('.activity-item').length).toBe(3);
  });

  it('should display character information in UI', () => {
    const compiled = fixture.nativeElement;

    expect(compiled.querySelector('.character-info-card')).toBeTruthy();
    expect(compiled.textContent).toContain('Character Information');
    expect(compiled.textContent).toContain('Created:');
    expect(compiled.textContent).toContain('Last Updated:');
    expect(compiled.textContent).toContain('Character ID:');
  });
});