import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { GreatVaultSlot, GreatVaultRewardType } from '../../models/great-vault.model';

@Component({
  selector: 'app-vault-slot',
  standalone: true,
  imports: [
    CommonModule,
    ProgressBarModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './vault-slot.component.html',
  styleUrl: './vault-slot.component.scss'
})
export class VaultSlotComponent {
  readonly slot = input.required<GreatVaultSlot>();
  readonly slotNumber = input.required<number>();

  protected getSlotIcon(): string {
    const slot = this.slot();
    switch (slot.rewardType) {
      case GreatVaultRewardType.MythicPlus:
        return 'pi pi-trophy';
      case GreatVaultRewardType.Raid:
        return 'pi pi-users';
      case GreatVaultRewardType.PvP:
        return 'pi pi-shield';
      default:
        return 'pi pi-box';
    }
  }

  protected getProgressPercentage(): number {
    return Math.round(this.slot().progress * 100);
  }

  protected getSlotSeverity(): 'success' | 'info' | 'warn' | 'danger' {
    const slot = this.slot();
    if (slot.unlocked) return 'success';
    if (slot.progress >= 0.5) return 'info';
    if (slot.progress > 0) return 'warn';
    return 'danger';
  }

  protected getTooltipText(): string {
    const slot = this.slot();
    const status = slot.unlocked ? 'Unlocked' : 'Locked';
    const progress = this.getProgressPercentage();

    return `Slot ${this.slotNumber()}: ${status}
Requirement: ${slot.requirement}
Progress: ${progress}%
Item Level: ${slot.itemLevel}`;
  }
}