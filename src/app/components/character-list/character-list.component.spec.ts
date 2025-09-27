import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { CharacterListComponent } from './character-list.component';
import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { Character } from '../../models/character.model';
import { Activity } from '../../models/activity.model';
import { Faction } from '../../enums/faction.enum';
import { Race } from '../../enums/race.enum';
import { CharacterClass } from '../../enums/class.enum';
import { ActivityType } from '../../enums/activity-type.enum';

describe('CharacterListComponent', () => {
  let component: CharacterListComponent;
  let fixture: ComponentFixture<CharacterListComponent>;
  let mockCharacterStore: jasmine.SpyObj<CharacterStore>;
  let mockActivityStore: jasmine.SpyObj<ActivityStore>;

  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      name: 'Thrall',
      race: Race.Orc,
      faction: Faction.Horde,
      characterClass: CharacterClass.Shaman,
      specialization: 'Enhancement',
      professions: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    },
    {
      id: 'char-2',
      name: 'Jaina',
      race: Race.Human,
      faction: Faction.Alliance,
      characterClass: CharacterClass.Mage,
      specialization: 'Frost',
      professions: [],
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    }
  ];

  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      characterId: 'char-1',
      type: ActivityType.MythicPlusCompleted,
      description: 'Completed M+15',
      date: new Date('2023-01-01'),
      vaultSlot: { type: 'mythicPlus', index: 0 }
    },
    {
      id: 'activity-2',
      characterId: 'char-1',
      type: ActivityType.RaidBossKilled,
      description: 'Killed raid boss',
      date: new Date('2023-01-01'),
      vaultSlot: { type: 'raid', index: 0 }
    }
  ];

  beforeEach(async () => {
    mockCharacterStore = jasmine.createSpyObj('CharacterStore', ['removeCharacter'], {
      characters: signal(mockCharacters),
      loading: signal(false),
      error: signal(null)
    });

    mockActivityStore = jasmine.createSpyObj('ActivityStore', [], {
      activities: signal(mockActivities),
      loading: signal(false),
      error: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [CharacterListComponent, NoopAnimationsModule],
      providers: [
        { provide: CharacterStore, useValue: mockCharacterStore },
        { provide: ActivityStore, useValue: mockActivityStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display characters in table', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.character-table')).toBeTruthy();
    expect(compiled.textContent).toContain('Thrall');
    expect(compiled.textContent).toContain('Jaina');
  });

  it('should show empty state when no characters', () => {
    mockCharacterStore.characters.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.empty-state')).toBeTruthy();
    expect(compiled.textContent).toContain('No Characters Found');
  });

  it('should show loading state', () => {
    mockCharacterStore.loading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading-container')).toBeTruthy();
    expect(compiled.textContent).toContain('Loading characters...');
  });

  it('should calculate vault progress correctly', () => {
    const enhancedCharacters = component.enhancedCharacters();
    const thrall = enhancedCharacters.find(c => c.name === 'Thrall');

    expect(thrall?.vaultProgress.mythicPlus).toBe(1);
    expect(thrall?.vaultProgress.raid).toBe(1);
    expect(thrall?.vaultProgress.pvp).toBe(0);
    expect(thrall?.vaultProgress.total).toBe(2);
    expect(thrall?.vaultPercentage).toBeCloseTo(22.22, 2);
  });

  it('should filter characters globally', () => {
    component.onGlobalFilter({ target: { value: 'Thrall' } } as any);
    fixture.detectChanges();

    expect(component.globalFilterValue()).toBe('Thrall');
  });

  it('should emit add character event', () => {
    spyOn(component.addCharacter, 'emit');
    component.onAddCharacter();
    expect(component.addCharacter.emit).toHaveBeenCalled();
  });

  it('should emit edit character event', () => {
    spyOn(component.editCharacter, 'emit');
    component.onEditCharacter(mockCharacters[0]);
    expect(component.editCharacter.emit).toHaveBeenCalledWith(mockCharacters[0]);
  });

  it('should emit character selected event', () => {
    spyOn(component.characterSelected, 'emit');
    component.onCharacterSelect(mockCharacters[0]);
    expect(component.characterSelected.emit).toHaveBeenCalledWith(mockCharacters[0]);
  });

  it('should call store to delete character', () => {
    component.onDeleteCharacter(mockCharacters[0]);
    expect(mockCharacterStore.removeCharacter).toHaveBeenCalledWith('char-1');
  });

  it('should return correct class colors', () => {
    expect(component.getClassColor(CharacterClass.Shaman)).toBe('#0070DE');
    expect(component.getClassColor(CharacterClass.Mage)).toBe('#69CCF0');
    expect(component.getClassColor(CharacterClass.Warrior)).toBe('#C79C6E');
  });

  it('should return correct faction severity', () => {
    expect(component.getFactionSeverity(Faction.Alliance)).toBe('info');
    expect(component.getFactionSeverity(Faction.Horde)).toBe('danger');
  });

  it('should format race display names correctly', () => {
    expect(component.getRaceDisplayName(Race.NightElf)).toBe('Night Elf');
    expect(component.getRaceDisplayName(Race.BloodElf)).toBe('Blood Elf');
    expect(component.getRaceDisplayName(Race.Orc)).toBe('Orc');
  });

  it('should handle pagination correctly', () => {
    expect(component.rows()).toBe(10);
    expect(component.first()).toBe(0);

    component.onPageChange({ first: 10, rows: 20 });
    expect(component.first()).toBe(10);
    expect(component.rows()).toBe(20);
  });

  it('should check if list is empty correctly', () => {
    expect(component.isEmpty()).toBeFalse();

    mockCharacterStore.characters.set([]);
    fixture.detectChanges();
    expect(component.isEmpty()).toBeTrue();
  });
});