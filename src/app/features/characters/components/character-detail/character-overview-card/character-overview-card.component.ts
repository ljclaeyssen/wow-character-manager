import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { Character } from '../../../../../models/character.model';
import { Faction } from '../../../../../enums/faction.enum';
import { CharacterClass } from '../../../../../enums/class.enum';
import { Race } from '../../../../../enums/race.enum';
import { CLASS_COLORS, FACTION_COLORS, FACTION_ICONS } from '../../../../../constants/character-detail.constants';

@Component({
  selector: 'wow-character-overview-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    ProgressBarModule,
    ChipModule,
    DividerModule
  ],
  templateUrl: './character-overview-card.component.html',
  styleUrl: './character-overview-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterOverviewCardComponent {
  readonly character = input.required<Character>();
  readonly vaultProgress = input<{ raid: number; mythicPlus: number; pvp: number; total: number }>({ raid: 0, mythicPlus: 0, pvp: 0, total: 0 });

  protected getClassColor(characterClass: CharacterClass): string {
    return CLASS_COLORS[characterClass] || '#FFFFFF';
  }

  protected getFactionColor(faction: Faction): string {
    return FACTION_COLORS[faction];
  }

  protected getRaceDisplayName(race: Race): string {
    return race.replace(/([A-Z])/g, ' $1').trim();
  }

  protected getProfessionIcon(profession: string): string {
    return `professions_icon/Ui_profession_${profession.toLowerCase()}.png`;
  }

  protected getVaultProgressPercentage(): number {
    return Math.round((this.vaultProgress().total / 9) * 100);
  }

  protected getFactionIcon(faction: Faction): string {
    return FACTION_ICONS[faction];
  }
}