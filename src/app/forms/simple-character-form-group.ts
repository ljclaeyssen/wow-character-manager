import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Character } from '../models/character.model';
import { Profession } from '../enums/profession.enum';

export interface SimpleCharacterFormControls {
  name: FormControl<string>;
  server: FormControl<string>;
  professions: FormControl<Profession[]>;
  [key: string]: any; // Index signature for Angular template compatibility
}

export class SimpleCharacterFormGroup extends FormGroup<SimpleCharacterFormControls> {

  constructor() {
    super({
      name: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(12)
          // Removed pattern restriction - allow any characters
        ]
      }),
      server: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      professions: new FormControl<Profession[]>([], {
        nonNullable: true,
        validators: [SimpleCharacterFormGroup.maxProfessionsValidator(2)]
      })
    });

    // Set up reactive value change logic
    this.setupValueChangeLogic();
  }

  /**
   * Load character data into the form
   */
  loadCharacter(character: Character): void {
    this.patchValue({
      name: character.name,
      server: character.server,
      professions: character.professions
    });
  }

  /**
   * Get form data for character creation/update
   */
  getFormData(): { name: string; server: string; professions: Profession[] } {
    const formValue = this.getRawValue();
    return {
      name: formValue.name,
      server: formValue.server,
      professions: formValue.professions
    };
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.reset({
      name: '',
      server: '',
      professions: []
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: keyof SimpleCharacterFormControls): string | null {
    const control = this.get(fieldName as string);
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


    if (errors['maxProfessions']) {
      const max = errors['maxProfessions'].max;
      return `You can select a maximum of ${max} professions`;
    }

    return 'Invalid value';
  }

  /**
   * Check if field has error and is touched
   */
  hasFieldError(fieldName: keyof SimpleCharacterFormControls): boolean {
    const control = this.get(fieldName as string);
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

  /**
   * Get form completion percentage
   */
  getCompletionPercentage(): number {
    const controls = Object.keys(this.controls);
    const filledControls = controls.filter(key => {
      const control = this.get(key);
      const value = control?.value;

      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value.toString().trim().length > 0;
    });

    return Math.round((filledControls.length / controls.length) * 100);
  }

  private setupValueChangeLogic(): void {
    // Character name formatting - minimal formatting, preserve user input
    this.get('name')?.valueChanges.subscribe(name => {
      if (name && name.length > 0) {
        // Only trim whitespace, preserve casing and special characters
        const formatted = name.trim();
        if (name !== formatted) {
          this.get('name')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // Server name formatting
    this.get('server')?.valueChanges.subscribe(server => {
      if (server && server.length > 0) {
        // Auto-format server name (remove extra spaces, capitalize properly)
        const formatted = server
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();

        if (server !== formatted) {
          this.get('server')?.setValue(formatted, { emitEvent: false });
        }
      }
    });

    // Profession selection validation
    this.get('professions')?.valueChanges.subscribe(professions => {
      if (professions && professions.length > 0) {
        console.log(`Selected ${professions.length} profession(s):`, professions);
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

  private getFieldLabel(fieldName: keyof SimpleCharacterFormControls): string {
    const labels: Record<keyof SimpleCharacterFormControls, string> = {
      name: 'Character Name',
      server: 'Server/Realm',
      professions: 'Professions'
    };

    return labels[fieldName];
  }
}