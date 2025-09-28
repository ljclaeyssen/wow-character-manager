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
import { RaiderIoApiService } from '../../services/raider-io-api.service';
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
  private readonly raiderIoService = inject(RaiderIoApiService);


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
  protected readonly apiValidationError = signal<string | null>(null);

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

    // Watch for faction changes to update signal (only when not loading data)
    this.characterForm.get('faction')?.valueChanges.subscribe((faction) => {
      if (!this.isLoadingCharacterData) {
        this.factionValue.set(faction || null);
      }
    });

    // Watch for race changes to update signal (only when not loading data)
    this.characterForm.get('race')?.valueChanges.subscribe((race) => {
      if (!this.isLoadingCharacterData) {
        this.raceValue.set(race || null);
      }
    });

    // Watch for class changes to update signal (only when not loading data)
    this.characterForm.get('characterClass')?.valueChanges.subscribe((characterClass) => {
      if (!this.isLoadingCharacterData) {
        this.classValue.set(characterClass || null);
      }
    });

    // Load character data when edit character changes
    effect(() => {
      const character = this.editCharacter();
      const isVisible = this.visible();

      // Only react when dialog becomes visible
      if (isVisible) {
        if (character) {
          this.loadCharacterData(character);
        } else {
          this.resetForm();
        }
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
    this.apiValidationError.set(null);
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

      // For new characters, validate with Raider.io API first
      if (!this.isEditMode()) {
        this.validateCharacterWithApi(character);
      } else {
        this.saveCharacter(character);
      }
    }
  }

  private validateCharacterWithApi(character: Character): void {
    // Format the server name for API call
    const formattedRealm = this.raiderIoService.formatRealmName(character.server);
    const formattedName = this.raiderIoService.formatCharacterName(character.name);

    // Determine region (defaulting to 'eu' for now - could be made configurable)
    const region = 'eu';

    this.raiderIoService.getCharacterProfile(region, formattedRealm, formattedName)
      .subscribe({
        next: (profile) => {
          // Character exists on Raider.io, proceed with creation
          const updatedCharacter: Character = {
            ...character,
            lastApiUpdateAt: new Date()
          };

          console.log('Character validated and data fetched from Raider.io:', profile);
          this.saveCharacter(updatedCharacter);
        },
        error: (error) => {
          // Character not found or API error - prevent creation
          this.loading.set(false);
          console.error('Character validation failed:', error);

          // Set user-friendly error message
          if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
            this.apiValidationError.set(`Character "${character.name}" not found on server "${character.server}". Please verify the character name and server are correct.`);
          } else if (error.message.toLowerCase().includes('invalid realm')) {
            this.apiValidationError.set(`Server "${character.server}" not found. Please check the server name spelling.`);
          } else {
            this.apiValidationError.set('Unable to validate character. Please check your internet connection and try again.');
          }
        }
      });
  }

  private saveCharacter(character: Character): void {
    // Simulate a small delay for better UX
    setTimeout(() => {
      if (this.isEditMode()) {
        this.characterStore.updateCharacter(character.id, character);
      } else {
        this.characterStore.addCharacter(character);
      }

      this.characterSaved.emit(character);
      this.loading.set(false);
      this.onHide();
    }, 200);
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

    try {
      // Load character data into form
      (this.characterForm as unknown as CharacterFormGroup).loadCharacter(character);

      // Update signals to match loaded character data immediately
      this.factionValue.set(character.faction);
      this.raceValue.set(character.race);
      this.classValue.set(character.characterClass);

      // Clear any previous submission attempts and validation errors
      this.submitAttempted.set(false);
      this.apiValidationError.set(null);

    } catch (error) {
      console.error('Error loading character data:', error);
    } finally {
      // Clear flag after form updates complete
      setTimeout(() => {
        this.isLoadingCharacterData = false;
      }, 50);
    }
  }

  private resetForm(): void {
    // Set flag to prevent cascading form updates
    this.isLoadingCharacterData = true;

    try {
      // Reset form to initial state
      (this.characterForm as unknown as CharacterFormGroup).resetForm();
      this.submitAttempted.set(false);
      this.apiValidationError.set(null);

      // Reset signals
      this.factionValue.set(null);
      this.raceValue.set(null);
      this.classValue.set(null);

    } catch (error) {
      console.error('Error resetting form:', error);
    } finally {
      // Clear flag after form updates complete
      setTimeout(() => {
        this.isLoadingCharacterData = false;
      }, 50);
    }
  }

  private generateId(): string {
    return `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

}
