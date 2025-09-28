import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CharacterDeleteComponent } from './character-delete.component';
import { CharacterStore } from '../../store/character.store';
import { Character } from '../../models/character.model';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Race } from '../../enums/race.enum';
import { Profession } from '../../enums/profession.enum';

describe('CharacterDeleteComponent', () => {
  let component: CharacterDeleteComponent;
  let fixture: ComponentFixture<CharacterDeleteComponent>;
  let mockCharacterStore: any;
  let mockConfirmationService: jasmine.SpyObj<ConfirmationService>;
  let mockMessageService: jasmine.SpyObj<MessageService>;

  const mockCharacter: Character = {
    id: 'test-char-delete',
    name: 'DeleteMe',
    race: Race.Human,
    faction: Faction.Alliance,
    characterClass: CharacterClass.Warrior,
    specialization: 'Protection',
    professions: [Profession.Mining, Profession.Blacksmithing],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  };

  beforeEach(async () => {
    // Create spies for all services
    const characterStoreSpy = jasmine.createSpyObj('CharacterStore', ['removeCharacter'], {
      entities: signal([mockCharacter]),
      loading: signal(false),
      error: signal(null)
    });

    const confirmationServiceSpy = jasmine.createSpyObj('ConfirmationService', ['confirm']);
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [
        CharacterDeleteComponent,
        NoopAnimationsModule
      ],
      providers: [
        { provide: CharacterStore, useValue: characterStoreSpy },
        { provide: ConfirmationService, useValue: confirmationServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterDeleteComponent);
    component = fixture.componentInstance;

    mockCharacterStore = TestBed.inject(CharacterStore);
    mockConfirmationService = TestBed.inject(ConfirmationService) as jasmine.SpyObj<ConfirmationService>;
    mockMessageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;

    // Set required input
    fixture.componentRef.setInput('character', mockCharacter);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required character input', () => {
    expect(component.character()).toEqual(mockCharacter);
  });

  describe('utility methods', () => {
    it('should return correct faction severity', () => {
      expect((component as any).getFactionSeverity(Faction.Alliance)).toBe('info');
      expect((component as any).getFactionSeverity(Faction.Horde)).toBe('warning');
    });

    it('should return correct class colors', () => {
      expect((component as any).getClassColor(CharacterClass.Warrior)).toBe('#C69B6D');
      expect((component as any).getClassColor(CharacterClass.Paladin)).toBe('#F48CBA');
      expect((component as any).getClassColor(CharacterClass.Mage)).toBe('#3FC7EB');
    });

    it('should return default color for invalid class', () => {
      const invalidClass = 'InvalidClass' as CharacterClass;
      expect((component as any).getClassColor(invalidClass)).toBe('#FFFFFF');
    });

    it('should format race display name correctly', () => {
      expect((component as any).getRaceDisplayName('NightElf')).toBe('Night Elf');
      expect((component as any).getRaceDisplayName('BloodElf')).toBe('Blood Elf');
      expect((component as any).getRaceDisplayName('Human')).toBe('Human');
      expect((component as any).getRaceDisplayName('DarkIronDwarf')).toBe('Dark Iron Dwarf');
    });

    it('should format professions correctly', () => {
      expect((component as any).formatProfessions([])).toBe('No professions');
      expect((component as any).formatProfessions(['Mining'])).toBe('Mining');
      expect((component as any).formatProfessions(['Mining', 'Blacksmithing'])).toBe('Mining & Blacksmithing');
    });

    it('should format created date correctly', () => {
      const testDate = new Date('2024-01-15');
      const formatted = (component as any).formatCreatedDate(testDate);

      expect(formatted).toMatch(/January \d+, 2024/);
    });
  });

  describe('component template integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render quick delete button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const deleteButton = compiled.querySelector('p-button[icon="pi pi-trash"]');

      expect(deleteButton).toBeTruthy();
    });

    it('should render confirmation dialog', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const confirmDialog = compiled.querySelector('p-confirmDialog');

      expect(confirmDialog).toBeTruthy();
    });

    it('should display character information in summary', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      expect(compiled.textContent).toContain(mockCharacter.name);
      expect(compiled.textContent).toContain(mockCharacter.faction);
    });
  });

  describe('component interaction', () => {
    it('should handle basic deletion flow', () => {
      spyOn(component.deleteConfirmed, 'emit');

      // Test private method directly
      (component as any).performDelete(mockCharacter);

      expect(mockCharacterStore.removeCharacter).toHaveBeenCalledWith(mockCharacter.id);
      expect(component.deleteConfirmed.emit).toHaveBeenCalledWith(mockCharacter);
      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Character Deleted'
      }));
    });

    it('should handle deletion errors gracefully', () => {
      mockCharacterStore.removeCharacter.and.throwError('Delete failed');
      spyOn(console, 'error');

      (component as any).performDelete(mockCharacter);

      expect(console.error).toHaveBeenCalled();
      expect(mockMessageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Delete Failed'
      }));
    });
  });
});