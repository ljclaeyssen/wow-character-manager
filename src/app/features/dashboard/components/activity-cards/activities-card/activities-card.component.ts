import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { Character } from '../../../../../models/character.model';

@Component({
  selector: 'wow-activities-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    BadgeModule,
    ProgressBarModule,
    DividerModule
  ],
  templateUrl: './activities-card.component.html',
  styleUrl: './activities-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivitiesCardComponent {
  // Inputs
  readonly selectedCharacter = input<Character | null>(null);
  readonly vaultProgress = input.required<{
    total: number;
    raid: number;
    mythicPlus: number;
    pvp: number;
  }>();
  readonly weeklyProgress = input.required<{
    raidProgress: number;
    mythicPlusProgress: number;
    pvpProgress: number;
  }>();
  readonly loading = input<boolean>(false);

  // Outputs
  readonly addLFRBoss = output<void>();
  readonly addNormalBoss = output<void>();
  readonly addHeroicBoss = output<void>();
  readonly addMythicBoss = output<void>();
  readonly addLowLevelRun = output<void>();
  readonly addHighLevelRun = output<void>();

  // Constants
  protected readonly MYTHIC_LOOT_THRESHOLD = 8;

  // Computed properties
  protected readonly vaultProgressPercentage = computed(() => {
    const progress = this.vaultProgress();
    return Math.round((progress.total / 9) * 100);
  });

  // Event handlers
  protected onAddLFRBoss(): void {
    this.addLFRBoss.emit();
  }

  protected onAddNormalBoss(): void {
    this.addNormalBoss.emit();
  }

  protected onAddHeroicBoss(): void {
    this.addHeroicBoss.emit();
  }

  protected onAddMythicBoss(): void {
    this.addMythicBoss.emit();
  }

  protected onAddLowLevelRun(): void {
    this.addLowLevelRun.emit();
  }

  protected onAddHighLevelRun(): void {
    this.addHighLevelRun.emit();
  }

  protected getProgressSeverity(progress: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'info';
    if (progress >= 50) return 'warn';
    if (progress >= 25) return 'secondary';
    return 'danger';
  }
}
