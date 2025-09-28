import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
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
import { CharacterFormGroup } from '../../forms/character-form-group';
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
export class CharacterFormComponent implements OnDestroy {
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
    this.characterForm = new CharacterFormGroup() as any;

    // Watch for faction changes to update signal
    this.characterForm.get('faction')?.valueChanges.subscribe((faction) => {
      this.factionValue.set(faction || null);
    });

    // Watch for race changes to update signal
    this.characterForm.get('race')?.valueChanges.subscribe((race) => {
      this.raceValue.set(race || null);
    });

    // Watch for class changes to update signal
    this.characterForm.get('characterClass')?.valueChanges.subscribe((characterClass) => {
      this.classValue.set(characterClass || null);
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

  ngOnDestroy(): void {
    // Component cleanup if needed
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
    (this.characterForm as unknown as CharacterFormGroup).markAllFieldsTouched();

    if ((this.characterForm as unknown as CharacterFormGroup).isReadyForSubmission()) {
      this.loading.set(true);

      const characterData = (this.characterForm as unknown as CharacterFormGroup).getCharacterData();
      const character: Character = {
        ...characterData,
        id: this.editCharacter()?.id || this.generateId(),
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
    return (this.characterForm as unknown as CharacterFormGroup).getFieldError(fieldName as any);
  }

  protected hasFieldError(fieldName: string): boolean {
    return (this.characterForm as unknown as CharacterFormGroup).hasFieldError(fieldName as any);
  }

  private loadCharacterData(character: Character): void {
    // Set flag to prevent cascading form updates
    this.isLoadingCharacterData = true;

    (this.characterForm as unknown as CharacterFormGroup).loadCharacter(character);

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

    (this.characterForm as unknown as CharacterFormGroup).resetForm();
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

}
