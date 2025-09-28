import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'wow-vault-progress-card',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    MessageModule,
    DividerModule
  ],
  templateUrl: './vault-progress-card.component.html',
  styleUrl: './vault-progress-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VaultProgressCardComponent {
  // Inputs
  readonly mythicPlusVaultProgress = input.required<{
    slots: number;
    slotRewards: string[];
    nextMilestone: { remaining: number };
  }>();
  readonly raidVaultProgress = input.required<{
    slots: number;
    slotRewards: string[];
    nextMilestone: { remaining: number };
  }>();

  // Helper method for tag severity
  protected getTagSeverity(reward: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    switch (reward) {
      case 'Mythic': return 'warning';
      case 'Heroic': return 'info';
      default: return 'secondary';
    }
  }
}