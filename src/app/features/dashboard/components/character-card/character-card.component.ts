import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { Character } from '../../../../models/character.model';
import { Faction } from '../../../../enums/faction.enum';
import { CharacterClass } from '../../../../enums/class.enum';
import { Profession } from '../../../../enums/profession.enum';
import { FACTION_ICONS, CLASS_ICONS } from '../../../../constants/character-detail.constants';

export interface EnhancedCharacter extends Character {
  vaultProgress: number;
  vaultPercentage: number;
  lastActivity: Date | null;
}

@Component({
  selector: 'wow-character-card',
  standalone: true,
  imports: [
    CommonModule,
    TagModule
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


  protected getFactionIcon(faction: Faction): string {
    return FACTION_ICONS[faction];
  }

  protected getClassIcon(characterClass: CharacterClass): string {
    return CLASS_ICONS[characterClass];
  }

  protected getProfessionIcon(profession: Profession): string {
    return `professions_icon/Ui_profession_${profession.toLowerCase()}.png`;
  }

  protected hasProgressionData(): boolean {
    const char = this.character();
    return !!(char.itemLevel && char.itemLevel > 0) || !!(char.rioScore && char.rioScore > 0);
  }

  protected getItemLevelDisplay(): string {
    const ilvl = this.character().itemLevel;
    return ilvl && ilvl > 0 ? `${ilvl} iLvl` : '';
  }

  protected getRioScoreDisplay(): string {
    const rio = this.character().rioScore;
    return rio && rio > 0 ? `${Math.round(rio)} RIO` : '';
  }

}