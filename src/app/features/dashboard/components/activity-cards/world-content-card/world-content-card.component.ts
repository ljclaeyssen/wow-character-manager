import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'wow-world-content-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TooltipModule,
    MessageModule
  ],
  templateUrl: './world-content-card.component.html',
  styleUrl: './world-content-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorldContentCardComponent {
  // Inputs
  readonly worldBossCompleted = input<boolean>(false);
  readonly sparkQuestCompleted = input<boolean>(false);
  readonly weeklyEventCompleted = input<boolean>(false);
  readonly currentWeekEvent = input<string>('Timewalking');
  readonly loading = input<boolean>(false);
  readonly allQuestsCompleted = input<boolean>(false);

  // Outputs
  readonly toggleWorldBoss = output<void>();
  readonly toggleSparkQuest = output<void>();
  readonly toggleWeeklyEvent = output<void>();

  // Event handlers
  protected onToggleWorldBoss(): void {
    this.toggleWorldBoss.emit();
  }

  protected onToggleSparkQuest(): void {
    this.toggleSparkQuest.emit();
  }

  protected onToggleWeeklyEvent(): void {
    this.toggleWeeklyEvent.emit();
  }
}