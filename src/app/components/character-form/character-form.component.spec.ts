import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { CharacterFormComponent } from './character-form.component';
import { CharacterStore } from '../../store/character.store';
import { Character } from '../../models/character.model';
import { Faction } from '../../enums/faction.enum';
import { Race } from '../../enums/race.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';

describe('CharacterFormComponent', () => {
  let component: CharacterFormComponent;
  let fixture: ComponentFixture<CharacterFormComponent>;
  let mockCharacterStore: jasmine.SpyObj<CharacterStore>;

  const mockCharacter: Character = {
    id: 'char-1',
    name: 'Thrall',
    race: Race.Orc,
    faction: Faction.Horde,
    characterClass: CharacterClass.Shaman,
    specialization: 'Enhancement',
    professions: [Profession.Alchemy, Profession.Herbalism],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  beforeEach(async () => {
    mockCharacterStore = jasmine.createSpyObj('CharacterStore', ['addCharacter', 'updateCharacter'], {
      characters: signal([]),
      loading: signal(false),
      error: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [CharacterFormComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: CharacterStore, useValue: mockCharacterStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterFormComponent);
    component = fixture.componentInstance;

    // Set up component inputs
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('editCharacter', null);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.characterForm.get('name')?.value).toBe('');
    expect(component.characterForm.get('faction')?.value).toBe('');
    expect(component.characterForm.get('race')?.value).toBe('');
    expect(component.characterForm.get('characterClass')?.value).toBe('');
    expect(component.characterForm.get('specialization')?.value).toBe('');
    expect(component.characterForm.get('professions')?.value).toEqual([]);
  });

  it('should show create mode by default', () => {
    expect(component.isEditMode()).toBeFalse();
    expect(component.dialogTitle()).toBe('Add New Character');
  });

  it('should switch to edit mode when character provided', () => {
    fixture.componentRef.setInput('editCharacter', mockCharacter);
    fixture.detectChanges();

    expect(component.isEditMode()).toBeTrue();
    expect(component.dialogTitle()).toBe('Edit Character');
  });

  it('should load character data in edit mode', () => {
    fixture.componentRef.setInput('editCharacter', mockCharacter);
    fixture.detectChanges();

    expect(component.characterForm.get('name')?.value).toBe('Thrall');
    expect(component.characterForm.get('faction')?.value).toBe(Faction.Horde);
    expect(component.characterForm.get('race')?.value).toBe(Race.Orc);
    expect(component.characterForm.get('characterClass')?.value).toBe(CharacterClass.Shaman);
    expect(component.characterForm.get('specialization')?.value).toBe('Enhancement');
    expect(component.characterForm.get('professions')?.value).toEqual([Profession.Alchemy, Profession.Herbalism]);
  });

  it('should validate required fields', () => {
    component.characterForm.get('name')?.setValue('');
    component.characterForm.get('faction')?.setValue('');
    component.characterForm.get('race')?.setValue('');

    component.characterForm.markAllAsTouched();
    fixture.detectChanges();

    expect(component.getFieldError('name')).toBe('Character Name is required');
    expect(component.getFieldError('faction')).toBe('Faction is required');
    expect(component.getFieldError('race')).toBe('Race is required');
  });

  it('should validate character name length', () => {
    const nameControl = component.characterForm.get('name')!;

    nameControl.setValue('X');
    nameControl.markAsTouched();
    expect(component.getFieldError('name')).toBe('Character Name must be at least 2 characters');

    nameControl.setValue('VeryLongCharacterName');
    expect(component.getFieldError('name')).toBe('Character Name must be no more than 12 characters');

    nameControl.setValue('ValidName');
    expect(component.getFieldError('name')).toBeNull();
  });


  it('should validate profession limit', () => {
    const professionsControl = component.characterForm.get('professions')!;

    professionsControl.setValue([Profession.Alchemy, Profession.Herbalism, Profession.Mining]);
    professionsControl.markAsTouched();
    expect(component.getFieldError('professions')).toBe('You can select a maximum of 2 professions');

    professionsControl.setValue([Profession.Alchemy, Profession.Herbalism]);
    expect(component.getFieldError('professions')).toBeNull();
  });

  it('should filter races by faction', () => {
    component.characterForm.get('faction')?.setValue(Faction.Horde);
    fixture.detectChanges();

    const filteredRaces = component.filteredRaces();
    expect(filteredRaces.every(race => race.faction === Faction.Horde)).toBeTrue();
    expect(filteredRaces.some(race => race.value === Race.Orc)).toBeTrue();
    expect(filteredRaces.some(race => race.value === Race.Human)).toBeFalse();
  });

  it('should filter specializations by class', () => {
    component.characterForm.get('characterClass')?.setValue(CharacterClass.Shaman);
    fixture.detectChanges();

    const filteredSpecs = component.filteredSpecializations();
    expect(filteredSpecs.every(spec => spec.characterClass === CharacterClass.Shaman)).toBeTrue();
    expect(filteredSpecs.some(spec => spec.value === 'Enhancement')).toBeTrue();
    expect(filteredSpecs.some(spec => spec.value === 'Arcane')).toBeFalse();
  });

  it('should reset race when faction changes', () => {
    component.characterForm.get('race')?.setValue(Race.Human);
    component.characterForm.get('faction')?.setValue(Faction.Horde);

    expect(component.characterForm.get('race')?.value).toBe('');
  });

  it('should reset specialization when class changes', () => {
    component.characterForm.get('specialization')?.setValue('Enhancement');
    component.characterForm.get('characterClass')?.setValue(CharacterClass.Mage);

    expect(component.characterForm.get('specialization')?.value).toBe('');
  });

  it('should emit visibleChange on hide', () => {
    spyOn(component.visibleChange, 'emit');
    component.onHide();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should emit formCancelled on cancel', () => {
    spyOn(component.formCancelled, 'emit');
    spyOn(component.visibleChange, 'emit');

    component.onCancel();

    expect(component.formCancelled.emit).toHaveBeenCalled();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
  });

  it('should not submit invalid form', () => {
    component.characterForm.get('name')?.setValue('');
    component.onSubmit();

    expect(mockCharacterStore.addCharacter).not.toHaveBeenCalled();
    expect(component.submitAttempted()).toBeTrue();
  });

  it('should create new character on valid form submission', (done) => {
    component.characterForm.patchValue({
      name: 'TestChar',
      faction: Faction.Alliance,
      race: Race.Human,
      characterClass: CharacterClass.Warrior,
      specialization: 'Protection',
      professions: [Profession.Blacksmithing]
    });

    spyOn(component.characterSaved, 'emit');
    spyOn(component.visibleChange, 'emit');

    component.onSubmit();
    expect(component.loading()).toBeTrue();

    // Wait for simulated API delay
    setTimeout(() => {
      expect(mockCharacterStore.addCharacter).toHaveBeenCalled();
      expect(component.characterSaved.emit).toHaveBeenCalled();
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
      expect(component.loading()).toBeFalse();
      done();
    }, 600);
  });

  it('should update existing character on valid form submission', (done) => {
    fixture.componentRef.setInput('editCharacter', mockCharacter);
    fixture.detectChanges();

    component.characterForm.patchValue({
      name: 'UpdatedThrall',
    });

    spyOn(component.characterSaved, 'emit');

    component.onSubmit();

    setTimeout(() => {
      expect(mockCharacterStore.updateCharacter).toHaveBeenCalledWith('char-1', jasmine.any(Object));
      expect(component.characterSaved.emit).toHaveBeenCalled();
      done();
    }, 600);
  });

  it('should generate unique IDs for new characters', () => {
    const id1 = component['generateId']();
    const id2 = component['generateId']();

    expect(id1).toMatch(/^char-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^char-\d+-[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should return correct field labels', () => {
    expect(component['getFieldLabel']('name')).toBe('Character Name');
    expect(component['getFieldLabel']('characterClass')).toBe('Class');
    expect(component['getFieldLabel']('unknownField')).toBe('unknownField');
  });

  it('should reset form correctly', () => {
    component.characterForm.patchValue({
      name: 'TestChar',
      faction: Faction.Alliance,
      race: Race.Human
    });
    component.submitAttempted.set(true);

    component['resetForm']();

    expect(component.characterForm.get('name')?.value).toBe('');
    expect(component.characterForm.get('faction')?.value).toBe('');
    expect(component.characterForm.get('race')?.value).toBe('');
    expect(component.submitAttempted()).toBeFalse();
  });
});