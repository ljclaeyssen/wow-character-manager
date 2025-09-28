import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Character } from '../models/character.model';
import { Faction } from '../enums/faction.enum';
import { Race } from '../enums/race.enum';
import { CharacterClass } from '../enums/class.enum';
import { Profession } from '../enums/profession.enum';

export interface CharacterFormControls {
  name: FormControl<string>;
  faction: FormControl<Faction | ''>;
  race: FormControl<Race | ''>;
  characterClass: FormControl<CharacterClass | ''>;
  specialization: FormControl<string>;
  professions: FormControl<Profession[]>;
}

export class CharacterFormGroup extends FormGroup<CharacterFormControls> {
  private isLoadingData = false;

  constructor() {
    super({
      name: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(12),
          Validators.pattern(/^[a-zA-Z]+$/) // Only letters, no spaces or special characters
        ]
      }),
      faction: new FormControl<Faction | ''>('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      race: new FormControl<Race | ''>('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      characterClass: new FormControl<CharacterClass | ''>('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      specialization: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      professions: new FormControl<Profession[]>([], {
        nonNullable: true,
        validators: [CharacterFormGroup.maxProfessionsValidator(2)]
      })
    });

    // Set up reactive dependencies
    this.setupFormDependencies();
  }

  /**
   * Load character data into the form
   */
  loadCharacter(character: Character): void {
    this.isLoadingData = true;
    try {
      this.patchValue({
        name: character.name,
        faction: character.faction,
        race: character.race,
        characterClass: character.characterClass,
        specialization: character.specialization,
        professions: character.professions
      });
    } finally {
      setTimeout(() => {
        this.isLoadingData = false;
      }, 0);
    }
  }

  /**
   * Get form data as Character object (without id, dates)
   */
  getCharacterData(): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
    const formValue = this.getRawValue();

    return {
      name: formValue.name,
      faction: formValue.faction as Faction,
      race: formValue.race as Race,
      characterClass: formValue.characterClass as CharacterClass,
      specialization: formValue.specialization,
      professions: formValue.professions
    };
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.reset({
      name: '',
      faction: '',
      race: '',
      characterClass: '',
      specialization: '',
      professions: []
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: keyof CharacterFormControls): string | null {
    const control = this.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return null;
    }

    const errors = control.errors;
    const fieldLabel = this.getFieldLabel(fieldName);

    if (errors['required']) {
      return `${fieldLabel} is required`;
    }

    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `${fieldLabel} must be at least ${minLength} characters`;
    }

    if (errors['maxlength']) {
      const maxLength = errors['maxlength'].requiredLength;
      return `${fieldLabel} must be no more than ${maxLength} characters`;
    }

    if (errors['pattern']) {
      return `${fieldLabel} can only contain letters`;
    }

    if (errors['maxProfessions']) {
      const max = errors['maxProfessions'].max;
      return `You can select a maximum of ${max} professions`;
    }

    return 'Invalid value';
  }

  /**
   * Check if field has error and is touched
   */
  hasFieldError(fieldName: keyof CharacterFormControls): boolean {
    const control = this.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  /**
   * Mark all fields as touched (for form submission)
   */
  markAllFieldsTouched(): void {
    this.markAllAsTouched();
  }

  /**
   * Check if form is valid and ready for submission
   */
  isReadyForSubmission(): boolean {
    return this.valid;
  }

  private setupFormDependencies(): void {
    // Reset race when faction changes (only during user interaction)
    this.get('faction')?.valueChanges.subscribe((faction) => {
      if (faction && !this.isLoadingData) {
        const currentRace = this.get('race')?.value;
        // Only clear race if it's not valid for the new faction
        if (currentRace) {
          this.get('race')?.setValue('');
        }
      }
    });

    // Reset class when race changes (only during user interaction)
    this.get('race')?.valueChanges.subscribe((race) => {
      if (race && !this.isLoadingData) {
        const currentClass = this.get('characterClass')?.value;
        // Only clear class if it's not valid for the new race
        if (currentClass) {
          this.get('characterClass')?.setValue('');
        }
      }
    });

    // Reset specialization when class changes (only during user interaction)
    this.get('characterClass')?.valueChanges.subscribe((characterClass) => {
      if (characterClass && !this.isLoadingData) {
        this.get('specialization')?.setValue('');
      }
    });
  }

  private static maxProfessionsValidator(max: number) {
    return (control: any) => {
      if (!control.value) return null;

      return control.value.length > max
        ? { maxProfessions: { actual: control.value.length, max } }
        : null;
    };
  }

  private getFieldLabel(fieldName: keyof CharacterFormControls): string {
    const labels: Record<keyof CharacterFormControls, string> = {
      name: 'Character Name',
      faction: 'Faction',
      race: 'Race',
      characterClass: 'Class',
      specialization: 'Specialization',
      professions: 'Professions'
    };

    return labels[fieldName];
  }
}