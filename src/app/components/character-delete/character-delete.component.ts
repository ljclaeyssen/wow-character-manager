import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Character } from '../../models/character.model';
import { CharacterStore } from '../../store/character.store';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';

@Component({
  selector: 'wow-character-delete',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDialogModule,
    ButtonModule,
    TagModule,
    DividerModule
  ],
  providers: [ConfirmationService],
  templateUrl: './character-delete.component.html',
  styleUrl: './character-delete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterDeleteComponent {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly characterStore = inject(CharacterStore);
  private readonly messageService = inject(MessageService);

  // Input signals
  readonly character = input.required<Character>();

  // Output events
  readonly deleteConfirmed = output<Character>();
  readonly deleteCancelled = output<void>();

  protected confirmDelete(): void {
    const character = this.character();

    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: `Are you sure you want to delete "${character.name}"?`,
      header: 'Delete Character Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-text',
      accept: () => {
        this.performDelete(character);
      },
      reject: () => {
        this.deleteCancelled.emit();
      }
    });
  }

  protected showDetailedConfirmation(): void {
    const character = this.character();

    // Create detailed confirmation message
    const detailsHtml = `
      <div class="character-delete-details">
        <p><strong>Character Details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${character.name}</li>
          <li><strong>Race:</strong> ${this.getRaceDisplayName(character.race)}</li>
          <li><strong>Class:</strong> ${character.characterClass}</li>
          <li><strong>Specialization:</strong> ${character.specialization}</li>
          <li><strong>Faction:</strong> ${character.faction}</li>
          ${character.professions.length > 0 ?
            `<li><strong>Professions:</strong> ${character.professions.join(', ')}</li>` :
            ''
          }
        </ul>
        <p class="delete-warning"><strong>⚠️ Warning:</strong> This action cannot be undone!</p>
      </div>
    `;

    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: detailsHtml,
      header: `Delete ${character.name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'pi pi-trash',
      rejectIcon: 'pi pi-times',
      acceptLabel: 'Delete Character',
      rejectLabel: 'Keep Character',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.performDelete(character);
      },
      reject: () => {
        this.deleteCancelled.emit();
      }
    });
  }

  private performDelete(character: Character): void {
    try {
      // Remove character from store
      this.characterStore.removeCharacter(character.id);

      // Emit success event
      this.deleteConfirmed.emit(character);

      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: 'Character Deleted',
        detail: `${character.name} has been permanently deleted`,
        life: 4000
      });
    } catch (error) {
      // Handle delete error
      console.error('Failed to delete character:', error);

      this.messageService.add({
        severity: 'error',
        summary: 'Delete Failed',
        detail: `Failed to delete ${character.name}. Please try again.`,
        life: 5000
      });
    }
  }

  protected getFactionSeverity(faction: Faction): 'info' | 'warning' {
    return faction === Faction.Alliance ? 'info' : 'warning';
  }

  protected getClassColor(characterClass: CharacterClass): string {
    const classColors: Record<CharacterClass, string> = {
      [CharacterClass.DeathKnight]: '#C41E3A',
      [CharacterClass.DemonHunter]: '#A330C9',
      [CharacterClass.Druid]: '#FF7C0A',
      [CharacterClass.Evoker]: '#33937F',
      [CharacterClass.Hunter]: '#AAD372',
      [CharacterClass.Mage]: '#3FC7EB',
      [CharacterClass.Monk]: '#00FF98',
      [CharacterClass.Paladin]: '#F48CBA',
      [CharacterClass.Priest]: '#FFFFFF',
      [CharacterClass.Rogue]: '#FFF468',
      [CharacterClass.Shaman]: '#0070DD',
      [CharacterClass.Warlock]: '#8788EE',
      [CharacterClass.Warrior]: '#C69B6D'
    };

    return classColors[characterClass] || '#FFFFFF';
  }

  protected getRaceDisplayName(race: string): string {
    return race.replace(/([A-Z])/g, ' $1').trim();
  }

  protected formatProfessions(professions: string[]): string {
    if (professions.length === 0) {
      return 'No professions';
    }

    if (professions.length === 1) {
      return professions[0];
    }

    return professions.join(' & ');
  }

  protected formatCreatedDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
}