import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Character } from '../../models/character.model';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';

export interface EnhancedCharacter extends Character {
  weeklyActivities: number;
  vaultProgress: number;
  vaultPercentage: number;
  lastActivity: Date | null;
}

@Component({
  selector: 'wow-character-card',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './character-card.component.html',
  styleUrl: './character-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterCardComponent {
  // Inputs
  readonly character = input.required<EnhancedCharacter>();
  readonly selected = input<boolean>(false);

  // Outputs
  readonly characterSelect = output<EnhancedCharacter>();
  readonly characterEdit = output<EnhancedCharacter>();

  // Utility methods
  protected onCharacterClick(): void {
    this.characterSelect.emit(this.character());
  }

  protected onEditClick(event: Event): void {
    event.stopPropagation();
    this.characterEdit.emit(this.character());
  }

  protected getClassColor(characterClass: CharacterClass): string {
    const colors: { [key in CharacterClass]: string } = {
      [CharacterClass.Warrior]: '#C69B6D',
      [CharacterClass.Paladin]: '#F48CBA',
      [CharacterClass.Hunter]: '#AAD372',
      [CharacterClass.Rogue]: '#FFF468',
      [CharacterClass.Priest]: '#FFFFFF',
      [CharacterClass.Shaman]: '#0070DD',
      [CharacterClass.Mage]: '#3FC7EB',
      [CharacterClass.Warlock]: '#8788EE',
      [CharacterClass.Monk]: '#00FF98',
      [CharacterClass.Druid]: '#FF7C0A',
      [CharacterClass.DemonHunter]: '#A330C9',
      [CharacterClass.DeathKnight]: '#C41E3A',
      [CharacterClass.Evoker]: '#33937F'
    };
    return colors[characterClass] || '#FFFFFF';
  }

  protected formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  }
}