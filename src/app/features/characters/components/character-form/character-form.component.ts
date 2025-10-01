import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { CharacterStore } from '../../../../store/character.store';
import { Character } from '../../../../models/character.model';
import { Profession } from '../../../../enums/profession.enum';
import { CharacterRefreshService } from '../../../../services/character-refresh.service';
import { PROFESSION_OPTIONS } from '../../../../constants/character-form.constants';
import { SimpleCharacterFormGroup } from '../../../../forms/simple-character-form-group';

@Component({
  selector: 'wow-character-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ButtonModule,
    MessageModule,
  ],
  templateUrl: './character-form.component.html',
  styleUrl: './character-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterFormComponent {
  private readonly characterStore = inject(CharacterStore);
  private readonly characterRefreshService = inject(CharacterRefreshService);

  // Input signals
  readonly visible = input<boolean>(false);
  readonly editCharacter = input<Character | null>(null);

  // Output events
  readonly visibleChange = output<boolean>();
  readonly characterSaved = output<Character>();
  readonly formCancelled = output<void>();

  // Form state
  protected readonly loading = signal(false);
  protected readonly apiMessage = signal<string | null>(null);

  // Custom form group with built-in logic
  protected readonly characterForm = new SimpleCharacterFormGroup();

  // Form options - Group professions by type for better UX
  protected readonly professionOptions = [
    {
      type: 'Gathering',
      items: PROFESSION_OPTIONS.filter(p => p.type === 'Gathering')
    },
    {
      type: 'Crafting',
      items: PROFESSION_OPTIONS.filter(p => p.type === 'Crafting')
    }
  ];

  // Computed values
  protected readonly isEditMode = computed(() => !!this.editCharacter());
  protected readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Edit Character' : 'Create Character'
  );
  protected readonly formProgress = computed(() => this.characterForm.getCompletionPercentage());

  constructor() {
    // Load character data when dialog opens
    effect(() => {
      const character = this.editCharacter();
      const isVisible = this.visible();

      if (isVisible) {
        if (character) {
          this.characterForm.loadCharacter(character);
          this.apiMessage.set(null);
        } else {
          this.characterForm.resetForm();
          this.apiMessage.set(null);
        }
      }
    });

    // Clear API message when user starts typing
    this.characterForm.valueChanges.subscribe(() => {
      if (this.apiMessage()) {
        this.apiMessage.set(null);
      }
    });
  }

  protected onHide(): void {
    this.formCancelled.emit();
    this.visibleChange.emit(false);
    this.characterForm.resetForm();
  }

  protected onCancel(): void {
    this.onHide();
  }

  protected onSubmit(): void {
    this.characterForm.markAllFieldsTouched();
    this.apiMessage.set(null);

    if (this.characterForm.isReadyForSubmission()) {
      this.loading.set(true);

      const formData = this.characterForm.getFormData();

      if (this.isEditMode()) {
        // Edit mode: save directly without API validation
        this.saveCharacter({
          ...this.editCharacter()!,
          name: formData.name,
          server: formData.server,
          professions: formData.professions,
          updatedAt: new Date()
        });
      } else {
        // Create mode: validate with Raider.io API first
        this.createCharacterWithApi(formData.name, formData.server, formData.professions);
      }
    }
  }

  private createCharacterWithApi(name: string, server: string, professions: Profession[]): void {
    this.characterRefreshService.createCharacterWithApiData(name, server, professions)
      .subscribe({
        next: (character) => {
          this.saveCharacter(character);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Character validation failed:', error);

          // Show user-friendly error message
          if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
            this.apiMessage.set(`Character "${name}" not found on server "${server}". Please verify the character name and server are correct.`);
          } else if (error.message.toLowerCase().includes('invalid realm')) {
            this.apiMessage.set(`Server "${server}" not found. Please check the server name spelling.`);
          } else {
            this.apiMessage.set('Unable to validate character. Please check your internet connection and try again.');
          }
        }
      });
  }

  private saveCharacter(character: Character): void {
    if (this.isEditMode()) {
      this.characterStore.updateCharacter(character.id, character);
    } else {
      this.characterStore.addCharacter(character);
    }

    this.characterSaved.emit(character);
    this.loading.set(false);
    this.onHide();
  }

  protected getFieldError(fieldName: string): string | null {
    return this.characterForm.getFieldError(fieldName as any);
  }

  protected hasFieldError(fieldName: string): boolean {
    return this.characterForm.hasFieldError(fieldName as any);
  }

  protected getProfessionIcon(professionValue: string): string {
    const allProfessions = [
      ...this.professionOptions[0].items,
      ...this.professionOptions[1].items
    ];
    const profession = allProfessions.find(p => p.value === professionValue);
    return profession?.icon || 'professions_icon/Ui_profession_mining.png';
  }

  protected getProfessionLabel(professionValue: string): string {
    const allProfessions = [
      ...this.professionOptions[0].items,
      ...this.professionOptions[1].items
    ];
    const profession = allProfessions.find(p => p.value === professionValue);
    return profession?.label || professionValue;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}