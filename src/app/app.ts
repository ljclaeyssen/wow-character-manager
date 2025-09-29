import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';

import { CharacterStore } from './store/character.store';
import { ActivityStore } from './store/activity.store';
import { NotificationService } from './services/notification.service';
import { ActivityService } from './services/activity.service';
import { ThemeService } from './services/theme.service';
import { AppToolbarComponent, ToolbarStats, ToolbarState } from './shared/components/app-toolbar/app-toolbar.component';

interface AppState {
  loading: boolean;
  error: string | null;
  sidebarVisible: boolean;
  isMobile: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    ToastModule,
    ButtonModule,
    DrawerModule,
    ProgressBarModule,
    SkeletonModule,
    AppToolbarComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  // Services
  private readonly messageService = inject(MessageService);
  private readonly notificationService = inject(NotificationService);
  private readonly characterStore = inject(CharacterStore);
  private readonly activityStore = inject(ActivityStore);
  private readonly activityService = inject(ActivityService);
  private readonly themeService = inject(ThemeService);

  // App state
  protected readonly appState = signal<AppState>({
    loading: false,
    error: null,
    sidebarVisible: false,
    isMobile: false
  });

  protected readonly title = signal('WoW Character Manager');
  protected readonly version = signal('1.0.0');

  // Navigation menu items
  protected readonly menuItems = signal<MenuItem[]>([
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
      command: () => this.closeMobileSidebar()
    },
    {
      label: 'Characters',
      icon: 'pi pi-users',
      routerLink: '/characters',
      command: () => this.closeMobileSidebar()
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      routerLink: '/settings',
      command: () => this.closeMobileSidebar()
    }
  ]);

  // Mobile menu items (flattened for sidebar)
  protected readonly mobileMenuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [];

    this.menuItems().forEach(item => {
      if (item.items) {
        // Add parent as section header
        items.push({
          label: item.label,
          icon: item.icon,
          disabled: true,
          styleClass: 'menu-section-header'
        });
        // Add child items
        item.items.forEach(child => {
          items.push({
            ...child,
            styleClass: 'menu-child-item'
          });
        });
      } else {
        items.push(item);
      }
    });

    return items;
  });

  // Store data for header statistics
  protected readonly characters = this.characterStore.entities;
  protected readonly activities = this.activityStore.activities;
  protected readonly charactersLoading = this.characterStore.loading;
  protected readonly activitiesLoading = this.activityStore.loading;

  // Header statistics
  protected readonly headerStats = computed(() => {
    const chars = this.characters();
    const acts = this.activities();

    if (chars.length === 0) {
      return {
        totalCharacters: 0,
        activeCharacters: 0,
        totalVaultSlots: 0,
        nextResetTime: this.getNextResetTime()
      };
    }

    let totalVaultSlots = 0;
    let activeCharacters = 0;

    chars.forEach(character => {
      const activity = acts[character.id];
      if (activity) {
        // Calculate M+ vault slots
        const mythicPlusSlots = this.calculateMythicPlusSlots(activity.mythicPlus.dungeonCount);

        // Calculate raid vault slots
        const totalBosses = activity.raid.normalBossesKilled +
                           activity.raid.heroicBossesKilled +
                           activity.raid.mythicBossesKilled +
                           (activity.raid.lfrBossesKilled || 0);
        const raidSlots = this.calculateRaidSlots(totalBosses);

        totalVaultSlots += mythicPlusSlots + raidSlots;

        // Check if character is active (updated within last week)
        const lastUpdate = new Date(activity.lastUpdated);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (lastUpdate > weekAgo) {
          activeCharacters++;
        }
      }
    });

    return {
      totalCharacters: chars.length,
      activeCharacters,
      totalVaultSlots,
      nextResetTime: this.getNextResetTime()
    };
  });

  // Loading state computed
  protected readonly isLoading = computed(() => {
    return this.charactersLoading() || this.activitiesLoading() || this.appState().loading;
  });

  // Error state computed
  protected readonly hasError = computed(() => {
    return this.characterStore.error() || this.activityStore.error() || this.appState().error;
  });

  // Toolbar data computed
  protected readonly toolbarStats = computed<ToolbarStats>(() => ({
    totalCharacters: this.headerStats().totalCharacters,
    activeCharacters: this.headerStats().activeCharacters,
    totalVaultSlots: this.headerStats().totalVaultSlots,
    nextResetTime: this.headerStats().nextResetTime
  }));

  protected readonly toolbarState = computed<ToolbarState>(() => ({
    loading: this.isLoading(),
    error: this.hasError(),
    isMobile: this.appState().isMobile
  }));

  ngOnInit(): void {
    this.initializeApp();
    this.setupNotifications();
    this.checkMobileView();
    this.setupResizeListener();
  }

  // App initialization
  private initializeApp(): void {
    this.updateAppState({ loading: true });

    try {
      // Initialize stores if needed
      this.notificationService.showSuccess('Application loaded successfully');
      this.updateAppState({ loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize application';
      this.updateAppState({
        loading: false,
        error: errorMessage
      });
      this.notificationService.showError(errorMessage);
    }
  }

  // Notification setup
  private setupNotifications(): void {
    // Subscribe to store errors
    const characterError = this.characterStore.error();
    const activityError = this.activityStore.error();

    if (characterError) {
      this.notificationService.showError(`Character Error: ${characterError}`);
    }

    if (activityError) {
      this.notificationService.showError(`Activity Error: ${activityError}`);
    }
  }

  // Mobile detection
  private checkMobileView(): void {
    const isMobile = window.innerWidth < 768;
    this.updateAppState({ isMobile });
  }

  // Resize listener for responsive behavior
  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      this.checkMobileView();

      // Auto-close mobile sidebar on desktop
      if (window.innerWidth >= 768 && this.appState().sidebarVisible) {
        this.closeMobileSidebar();
      }
    });
  }

  // Navigation methods
  protected toggleMobileSidebar(): void {
    this.updateAppState({
      sidebarVisible: !this.appState().sidebarVisible
    });
  }

  protected closeMobileSidebar(): void {
    this.updateAppState({ sidebarVisible: false });
  }

  protected onSidebarHide(): void {
    this.updateAppState({ sidebarVisible: false });
  }


  // Clear errors
  protected clearError(): void {
    this.updateAppState({ error: null });
  }

  // Utility methods
  private updateAppState(updates: Partial<AppState>): void {
    this.appState.update(current => ({ ...current, ...updates }));
  }

  private calculateMythicPlusSlots(dungeonCount: number): number {
    if (dungeonCount >= 8) return 3;
    if (dungeonCount >= 4) return 2;
    if (dungeonCount >= 1) return 1;
    return 0;
  }

  private calculateRaidSlots(bossCount: number): number {
    if (bossCount >= 6) return 3;
    if (bossCount >= 4) return 2;
    if (bossCount >= 2) return 1;
    return 0;
  }

  private getNextResetTime(): string {
    const nextReset = this.activityService.getNextResetDate();
    const now = new Date();
    const diffMs = nextReset.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else {
      return `${diffHours}h`;
    }
  }

}
