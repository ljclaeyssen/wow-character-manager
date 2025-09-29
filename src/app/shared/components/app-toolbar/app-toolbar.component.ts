import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { CharacterRefreshService } from '../../../services/character-refresh.service';
import { NotificationService } from '../../../services/notification.service';

export interface ToolbarStats {
  totalCharacters: number;
  activeCharacters: number;
  totalVaultSlots: number;
  nextResetTime: string;
}

export interface ToolbarState {
  loading: boolean;
  error: string | null;
  isMobile: boolean;
}

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToolbarModule,
    ButtonModule,
    MenubarModule,
    BadgeModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './app-toolbar.component.html',
  styleUrl: './app-toolbar.component.scss'
})
export class AppToolbarComponent {
  private readonly characterRefreshService = inject(CharacterRefreshService);
  private readonly notificationService = inject(NotificationService);

  // Inputs
  readonly title = input<string>('WoW Character Manager');
  readonly version = input<string>('1.0.0');
  readonly menuItems = input<MenuItem[]>([]);
  readonly stats = input<ToolbarStats>({
    totalCharacters: 0,
    activeCharacters: 0,
    totalVaultSlots: 0,
    nextResetTime: ''
  });
  readonly state = input<ToolbarState>({
    loading: false,
    error: null,
    isMobile: false
  });

  // Outputs
  readonly toggleMobileMenu = output<void>();
  readonly clearError = output<void>();

  // Internal state
  protected readonly isRefreshing = computed(() => this.state().loading);

  protected onToggleMobileMenu(): void {
    this.toggleMobileMenu.emit();
  }

  protected onRefreshData(): void {
    if (this.isRefreshing()) {
      return; // Prevent multiple simultaneous refreshes
    }

    this.notificationService.showInfo('Refreshing character data from Raider.io...');

    this.characterRefreshService.refreshAllCharacters().subscribe({
      next: (result) => {
        if (result.total === 0) {
          this.notificationService.showInfo('No characters to refresh');
        } else if (result.successful === result.total) {
          this.notificationService.showSuccess(`Successfully refreshed ${result.successful} character(s)`);
        } else if (result.successful > 0) {
          this.notificationService.showError(`Refreshed ${result.successful}/${result.total} characters. ${result.failed} failed.`);
        } else {
          this.notificationService.showError(`Failed to refresh all ${result.total} characters`);
        }

        console.log('Character refresh completed:', result);
      },
      error: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh character data';
        this.notificationService.showError(`Refresh failed: ${errorMessage}`);
        console.error('Character refresh error:', error);
      }
    });
  }

  protected onClearError(): void {
    this.clearError.emit();
  }

  protected getVaultSlotSeverity(slots: number): 'success' | 'info' | 'warn' | 'danger' {
    if (slots >= 5) return 'success';
    if (slots >= 3) return 'info';
    if (slots >= 1) return 'warn';
    return 'danger';
  }
}