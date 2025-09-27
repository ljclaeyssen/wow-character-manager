import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CharacterStore } from '../../store/character.store';
import { Character } from '../../models/character.model';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Race } from '../../enums/race.enum';
import {
  DropdownOption,
  RaceOption,
  SpecializationOption,
  ClassOption,
  FACTION_OPTIONS,
  RACE_OPTIONS,
  CLASS_OPTIONS,
  SPECIALIZATION_OPTIONS,
  PROFESSION_OPTIONS,
  PROFESSION_CONSTRAINTS
} from '../../constants/character-form.constants';

@Component({
  selector: 'wow-character-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './character-form.component.html',
  styleUrl: './character-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly characterStore = inject(CharacterStore);

  // Input signals
  readonly visible = input<boolean>(false);
  readonly editCharacter = input<Character | null>(null);

  // Output events
  readonly visibleChange = output<boolean>();
  readonly characterSaved = output<Character>();
  readonly formCancelled = output<void>();

  // Form state
  protected readonly loading = signal(false);
  protected readonly submitAttempted = signal(false);

  // Flag to prevent cascading form updates during data loading
  private isLoadingCharacterData = false;

  // Form group
  protected readonly characterForm: FormGroup;

  // Form options
  protected readonly factionOptions = FACTION_OPTIONS;

  protected readonly raceOptions = RACE_OPTIONS;

  protected readonly classOptions = CLASS_OPTIONS;

  protected readonly specializationOptions = SPECIALIZATION_OPTIONS;

  protected readonly professionOptions = PROFESSION_OPTIONS;

  // Form state signals for reactivity
  private readonly factionValue = signal<Faction | null>(null);
  private readonly raceValue = signal<Race | null>(null);
  private readonly classValue = signal<CharacterClass | null>(null);

  // Computed filtered options
  protected readonly filteredRaces = computed(() => {
    const faction = this.factionValue();
    if (!faction) return [];
    return RACE_OPTIONS.filter(race => race.faction === faction);
  });

  protected readonly filteredClasses = computed(() => {
    const selectedRace = this.raceValue();
    if (!selectedRace) return [];
    return CLASS_OPTIONS.filter(classOption =>
      classOption.availableRaces.includes(selectedRace)
    );
  });

  protected readonly filteredSpecializations = computed(() => {
    const characterClass = this.classValue();
    if (!characterClass) return [];
    return SPECIALIZATION_OPTIONS.filter(spec => spec.characterClass === characterClass);
  });

  // Form state computed
  protected readonly isEditMode = computed(() => !!this.editCharacter());
  protected readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Edit Character' : 'Add New Character'
  );

  constructor() {
    this.characterForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(12)]],
      faction: ['', Validators.required],
      race: ['', Validators.required],
      characterClass: ['', Validators.required],
      specialization: ['', Validators.required],
      professions: [[], [this.maxProfessionsValidator]]
    });

    // Watch for faction changes to reset race and update signal
    this.characterForm.get('faction')?.valueChanges.subscribe((faction) => {
      this.factionValue.set(faction);
      // Only reset dependent fields if this is a user-initiated change, not a programmatic one
      if (!this.isLoadingCharacterData) {
        this.characterForm.get('race')?.setValue('');
        this.raceValue.set(null);
        this.characterForm.get('characterClass')?.setValue('');
        this.classValue.set(null);
        this.characterForm.get('specialization')?.setValue('');
      }
    });

    // Watch for race changes to reset class and specialization and update signal
    this.characterForm.get('race')?.valueChanges.subscribe((race) => {
      this.raceValue.set(race);
      // Only reset dependent fields if this is a user-initiated change, not a programmatic one
      if (!this.isLoadingCharacterData) {
        this.characterForm.get('characterClass')?.setValue('');
        this.classValue.set(null);
        this.characterForm.get('specialization')?.setValue('');
      }
    });

    // Watch for class changes to reset specialization and update signal
    this.characterForm.get('characterClass')?.valueChanges.subscribe((characterClass) => {
      this.classValue.set(characterClass);
      // Only reset dependent fields if this is a user-initiated change, not a programmatic one
      if (!this.isLoadingCharacterData) {
        this.characterForm.get('specialization')?.setValue('');
      }
    });

    // Load character data when edit character changes
    effect(() => {
      const character = this.editCharacter();
      if (character) {
        this.loadCharacterData(character);
      } else {
        this.resetForm();
      }
    });
  }

  protected onHide(): void {
    this.visibleChange.emit(false);
    this.resetForm();
  }

  protected onCancel(): void {
    this.formCancelled.emit();
    this.onHide();
  }

  protected onSubmit(): void {
    this.submitAttempted.set(true);

    if (this.characterForm.valid) {
      this.loading.set(true);

      const formValue = this.characterForm.value;
      const character: Character = {
        id: this.editCharacter()?.id || this.generateId(),
        name: formValue.name,
        race: formValue.race,
        faction: formValue.faction,
        characterClass: formValue.characterClass,
        specialization: formValue.specialization,
        professions: formValue.professions || [],
        createdAt: this.editCharacter()?.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Simulate API call delay
      setTimeout(() => {
        if (this.isEditMode()) {
          this.characterStore.updateCharacter(character.id, character);
        } else {
          this.characterStore.addCharacter(character);
        }

        this.characterSaved.emit(character);
        this.loading.set(false);
        this.onHide();
      }, 500);
    }
  }

  protected getFieldError(fieldName: string): string | null {
    const field = this.characterForm.get(fieldName);
    if (!field || !field.errors || (!field.touched && !this.submitAttempted())) {
      return null;
    }

    const errors = field.errors;
    if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} must be no more than ${errors['maxlength'].requiredLength} characters`;
    if (errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['min'].min}`;
    if (errors['max']) return `${this.getFieldLabel(fieldName)} must be no more than ${errors['max'].max}`;
    if (errors['maxProfessions']) return `You can select a maximum of ${PROFESSION_CONSTRAINTS.MAX_PROFESSIONS} professions`;

    return 'Invalid value';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      name: 'Character Name',
      faction: 'Faction',
      race: 'Race',
      characterClass: 'Class',
      specialization: 'Specialization',
      professions: 'Professions'
    };
    return labels[fieldName] || fieldName;
  }

  private loadCharacterData(character: Character): void {
    // Set flag to prevent cascading form updates
    this.isLoadingCharacterData = true;

    this.characterForm.patchValue({
      name: character.name,
      faction: character.faction,
      race: character.race,
      characterClass: character.characterClass,
      specialization: character.specialization,
      professions: character.professions
    });

    // Update signals to match loaded character data
    this.factionValue.set(character.faction);
    this.raceValue.set(character.race);
    this.classValue.set(character.characterClass);

    // Clear flag after a short delay to allow form updates to complete
    setTimeout(() => {
      this.isLoadingCharacterData = false;
    }, 0);
  }

  private resetForm(): void {
    // Set flag to prevent cascading form updates
    this.isLoadingCharacterData = true;

    this.characterForm.reset({
      name: '',
      faction: '',
      race: '',
      characterClass: '',
      specialization: '',
      professions: []
    });
    this.submitAttempted.set(false);

    // Reset signals
    this.factionValue.set(null);
    this.raceValue.set(null);
    this.classValue.set(null);

    // Clear flag after a short delay to allow form updates to complete
    setTimeout(() => {
      this.isLoadingCharacterData = false;
    }, 0);
  }

  private generateId(): string {
    return `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private maxProfessionsValidator(control: any) {
    const professions = control.value;
    if (professions && professions.length > PROFESSION_CONSTRAINTS.MAX_PROFESSIONS) {
      return { maxProfessions: true };
    }
    return null;
  }
}
