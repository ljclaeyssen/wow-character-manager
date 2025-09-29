import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';
import { Profession } from '../../../../../enums/profession.enum';

export interface ProfessionQuest {
  profession: Profession;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'wow-profession-knowledge-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TooltipModule,
    MessageModule
  ],
  templateUrl: './profession-knowledge-card.component.html',
  styleUrl: './profession-knowledge-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfessionKnowledgeCardComponent {
  // Inputs
  readonly professionQuests = input<ProfessionQuest[]>([]);
  readonly loading = input<boolean>(false);
  readonly allQuestsCompleted = input<boolean>(false);

  // Outputs
  readonly toggleProfessionQuest = output<Profession>();

  // Event handlers
  protected onToggleProfessionQuest(profession: Profession): void {
    this.toggleProfessionQuest.emit(profession);
  }

  protected getProfessionIcon(profession: Profession): string {
    return `professions_icon/Ui_profession_${profession.toLowerCase()}.png`;
  }
}