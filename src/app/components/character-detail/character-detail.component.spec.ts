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
  let mockActivityStore: any;

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
    const characterActivities = (component as any).characterActivities();

    expect(characterActivities.length).toBe(3);
    expect(characterActivities.every((activity: any) => activity.characterId === 'char-1')).toBeTrue();
  });

  it('should sort activities by date (newest first)', () => {
    const characterActivities = (component as any).characterActivities();

    expect(characterActivities[0].id).toBe('activity-3'); // Latest activity
    expect(characterActivities[1].id).toBe('activity-2');
    expect(characterActivities[2].id).toBe('activity-1'); // Earliest activity
  });

  it('should calculate vault progress correctly', () => {
    const vaultProgress = (component as any).vaultProgress();

    expect(vaultProgress.raid).toBe(1);
    expect(vaultProgress.mythicPlus).toBe(1);
    expect(vaultProgress.pvp).toBe(1);
    expect(vaultProgress.total).toBe(3);
  });

  it('should calculate vault percentage correctly', () => {
    const vaultPercentage = (component as any).vaultPercentage();

    expect(vaultPercentage).toBeCloseTo(33, 0); // 3/9 * 100 ≈ 33%
  });

  it('should show recent activities (max 5)', () => {
    const recentActivities = (component as any).recentActivities();

    expect(recentActivities.length).toBe(3); // We only have 3 activities for this character
    expect(recentActivities[0].id).toBe('activity-3'); // Most recent first
  });

  it('should calculate activity statistics correctly', () => {
    const stats = (component as any).activityStats();

    expect(stats.totalActivities).toBe(3);
    expect(stats.mythicPlusCompleted).toBe(1);
    expect(stats.raidsCompleted).toBe(1);
    expect(stats.pvpMatches).toBe(1);
  });

  it('should calculate weekly activities correctly', () => {
    // Mock current date to be within a week of the activities
    const mockDate = new Date('2023-01-02T00:00:00');
    spyOn(Date, 'now').and.returnValue(mockDate.getTime());

    const stats = (component as any).activityStats();
    expect(stats.weeklyCompleted).toBe(3); // All activities are within the week
  });

  it('should emit editCharacter event', () => {
    spyOn(component.editCharacter, 'emit');

    (component as any).onEditCharacter();

    expect(component.editCharacter.emit).toHaveBeenCalledWith(mockCharacter);
  });

  it('should emit deleteCharacter event', () => {
    spyOn(component.deleteCharacter, 'emit');

    (component as any).onDeleteCharacter();

    expect(component.deleteCharacter.emit).toHaveBeenCalledWith(mockCharacter);
  });

  it('should emit closeDetail event', () => {
    spyOn(component.closeDetail, 'emit');

    (component as any).onClose();

    expect(component.closeDetail.emit).toHaveBeenCalled();
  });

  it('should return correct class colors', () => {
    expect((component as any).getClassColor(CharacterClass.Shaman)).toBe('#0070DD');
    expect((component as any).getClassColor(CharacterClass.Mage)).toBe('#3FC7EB');
    expect((component as any).getClassColor(CharacterClass.Warrior)).toBe('#C69B6D');
  });

  it('should return correct faction colors', () => {
    expect((component as any).getFactionColor(Faction.Alliance)).toBeDefined();
    expect((component as any).getFactionColor(Faction.Horde)).toBeDefined();
  });

  it('should return correct faction icons', () => {
    expect((component as any).getFactionIcon(Faction.Alliance)).toBeDefined();
    expect((component as any).getFactionIcon(Faction.Horde)).toBeDefined();
  });

  it('should format race display names correctly', () => {
    expect((component as any).getRaceDisplayName('NightElf')).toBe('Night Elf');
    expect((component as any).getRaceDisplayName('BloodElf')).toBe('Blood Elf');
    expect((component as any).getRaceDisplayName('Orc')).toBe('Orc');
  });

  it('should return correct activity icons', () => {
    expect((component as any).getActivityIcon(ActivityType.MythicPlusCompleted)).toBeDefined();
    expect((component as any).getActivityIcon(ActivityType.RaidBossKilled)).toBeDefined();
    expect((component as any).getActivityIcon(ActivityType.PvPMatchCompleted)).toBeDefined();
    expect((component as any).getActivityIcon(ActivityType.QuestCompleted)).toBeDefined();
    expect((component as any).getActivityIcon(ActivityType.AchievementEarned)).toBeDefined();
    expect((component as any).getActivityIcon(ActivityType.ItemObtained)).toBeDefined();
  });

  it('should return correct activity severities', () => {
    expect((component as any).getActivitySeverity(ActivityType.MythicPlusCompleted)).toBeDefined();
    expect((component as any).getActivitySeverity(ActivityType.RaidBossKilled)).toBeDefined();
    expect((component as any).getActivitySeverity(ActivityType.PvPMatchCompleted)).toBeDefined();
    expect((component as any).getActivitySeverity(ActivityType.QuestCompleted)).toBeDefined();
    expect((component as any).getActivitySeverity(ActivityType.AchievementEarned)).toBeDefined();
    expect((component as any).getActivitySeverity(ActivityType.ItemObtained)).toBeDefined();
  });

  it('should format dates correctly', () => {
    const testDate = new Date('2023-01-15T14:30:00');
    const formatted = (component as any).formatDate(testDate);

    expect(formatted).toMatch(/Jan 15.*2:30 PM|Jan 15.*14:30/); // Handles 12h/24h formats
  });

  it('should format relative time correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    spyOn(Date, 'now').and.returnValue(now.getTime());

    expect((component as any).formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    expect((component as any).formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    expect((component as any).formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should handle character with no activities', () => {
    // Set activities to empty array
    mockActivityStore.activities.set([]);
    fixture.detectChanges();

    const vaultProgress = (component as any).vaultProgress();
    const stats = (component as any).activityStats();
    const recentActivities = (component as any).recentActivities();

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

    const vaultProgress = (component as any).vaultProgress();
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