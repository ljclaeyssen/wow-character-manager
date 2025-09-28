import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { FormsModule } from '@angular/forms';

import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { NotificationService } from '../../services/notification.service';

interface ExportOptions {
  characters: boolean;
  activities: boolean;
  resetHistory: boolean;
  includeTimestamps: boolean;
  formatPretty: boolean;
}

interface ExportData {
  metadata: {
    exportDate: string;
    version: string;
    dataTypes: string[];
  };
  characters?: any[];
  activities?: Record<string, any>;
  resetHistory?: any[];
}

interface ExportState {
  isExporting: boolean;
  progress: number;
  message: string | null;
  messageType: 'success' | 'info' | 'warn' | 'error' | null;
  lastExportDate: Date | null;
}

@Component({
  selector: 'app-data-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    MessageModule,
    ProgressSpinnerModule,
    PanelModule,
    DividerModule
  ],
  templateUrl: './data-export.component.html',
  styleUrl: './data-export.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataExportComponent {
  private readonly characterStore = inject(CharacterStore);
  private readonly activityStore = inject(ActivityStore);
  private readonly notificationService = inject(NotificationService);

  // Component state
  protected readonly exportOptions = signal<ExportOptions>({
    characters: true,
    activities: true,
    resetHistory: false,
    includeTimestamps: true,
    formatPretty: true
  });

  protected readonly exportState = signal<ExportState>({
    isExporting: false,
    progress: 0,
    message: null,
    messageType: null,
    lastExportDate: null
  });

  // Store data
  protected readonly characters = this.characterStore.entities;
  protected readonly activities = this.activityStore.activities;
  protected readonly resetHistory = this.activityStore.recentResetHistory;

  // Computed properties
  protected readonly hasCharacterData = computed(() => this.characters().length > 0);
  protected readonly hasActivityData = computed(() => Object.keys(this.activities()).length > 0);
  protected readonly hasResetHistory = computed(() => this.resetHistory().length > 0);

  protected readonly activityCount = computed(() => Object.keys(this.activities()).length);

  protected readonly selectedDataTypes = computed(() => {
    const options = this.exportOptions();
    const types: string[] = [];

    if (options.characters) types.push('Characters');
    if (options.activities) types.push('Activities');
    if (options.resetHistory) types.push('Reset History');

    return types;
  });

  protected readonly estimatedSize = computed(() => {
    const options = this.exportOptions();
    let size = 0;

    if (options.characters) {
      size += this.characters().length * 0.5; // ~0.5KB per character
    }
    if (options.activities) {
      size += Object.keys(this.activities()).length * 2; // ~2KB per activity
    }
    if (options.resetHistory) {
      size += this.resetHistory().length * 5; // ~5KB per reset entry
    }

    return Math.max(0.1, size).toFixed(1);
  });

  protected readonly canExport = computed(() => {
    const options = this.exportOptions();
    const state = this.exportState();

    return !state.isExporting && (
      (options.characters && this.hasCharacterData()) ||
      (options.activities && this.hasActivityData()) ||
      (options.resetHistory && this.hasResetHistory())
    );
  });

  // Export option methods
  protected updateExportOption(key: keyof ExportOptions, value: boolean): void {
    this.exportOptions.update(options => ({
      ...options,
      [key]: value
    }));
  }

  protected selectAll(): void {
    this.exportOptions.set({
      characters: this.hasCharacterData(),
      activities: this.hasActivityData(),
      resetHistory: this.hasResetHistory(),
      includeTimestamps: true,
      formatPretty: true
    });
  }

  protected selectNone(): void {
    this.exportOptions.update(options => ({
      ...options,
      characters: false,
      activities: false,
      resetHistory: false
    }));
  }

  // Export functionality
  protected async performExport(): Promise<void> {
    if (!this.canExport()) {
      this.showMessage('No data selected for export', 'warn');
      return;
    }

    try {
      this.updateExportState({
        isExporting: true,
        progress: 0,
        message: 'Preparing export...',
        messageType: 'info'
      });

      // Simulate progress steps
      await this.sleep(300);
      this.updateExportState({ progress: 25, message: 'Collecting data...' });

      // Collect export data
      const exportData = await this.collectExportData();

      await this.sleep(300);
      this.updateExportState({ progress: 50, message: 'Processing data...' });

      // Validate data
      this.validateExportData(exportData);

      await this.sleep(300);
      this.updateExportState({ progress: 75, message: 'Generating file...' });

      // Format data
      const formattedData = this.formatExportData(exportData);

      await this.sleep(300);
      this.updateExportState({ progress: 100, message: 'Download starting...' });

      // Trigger download
      this.downloadData(formattedData);

      // Update state
      this.updateExportState({
        isExporting: false,
        progress: 0,
        message: `Successfully exported ${this.selectedDataTypes().join(', ')}`,
        messageType: 'success',
        lastExportDate: new Date()
      });

      this.notificationService.showSuccess(
        `Export completed: ${this.selectedDataTypes().join(', ')}`,
        'Data Export'
      );

    } catch (error) {
      console.error('Export failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';

      this.updateExportState({
        isExporting: false,
        progress: 0,
        message: `Export failed: ${errorMessage}`,
        messageType: 'error'
      });

      this.notificationService.showError(`Export failed: ${errorMessage}`);
    }
  }

  // Data collection methods
  private async collectExportData(): Promise<ExportData> {
    const options = this.exportOptions();
    const exportData: ExportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        dataTypes: this.selectedDataTypes()
      }
    };

    if (options.characters) {
      exportData.characters = this.prepareCharacterData();
    }

    if (options.activities) {
      exportData.activities = this.prepareActivityData();
    }

    if (options.resetHistory) {
      exportData.resetHistory = this.prepareResetHistoryData();
    }

    return exportData;
  }

  private prepareCharacterData(): any[] {
    const options = this.exportOptions();

    return this.characters().map(character => {
      const data: any = {
        id: character.id,
        name: character.name,
        race: character.race,
        faction: character.faction,
        characterClass: character.characterClass,
        specialization: character.specialization,
        professions: character.professions
      };

      if (options.includeTimestamps) {
        data.createdAt = character.createdAt;
        data.updatedAt = character.updatedAt;
      }

      return data;
    });
  }

  private prepareActivityData(): Record<string, any> {
    const options = this.exportOptions();
    const activities = this.activities();
    const processedActivities: Record<string, any> = {};

    Object.entries(activities).forEach(([characterId, activity]) => {
      const data: any = {
        characterId: activity.characterId,
        weekStartDate: activity.weekStartDate,
        mythicPlus: {
          dungeonCount: activity.mythicPlus.dungeonCount,
          highestKeyLevel: activity.mythicPlus.highestKeyLevel,
          completed: activity.mythicPlus.completed,
          vaultProgress: activity.mythicPlus.vaultProgress
        },
        raid: {
          lfrBossesKilled: activity.raid.lfrBossesKilled,
          normalBossesKilled: activity.raid.normalBossesKilled,
          heroicBossesKilled: activity.raid.heroicBossesKilled,
          mythicBossesKilled: activity.raid.mythicBossesKilled,
          completed: activity.raid.completed,
          vaultProgress: activity.raid.vaultProgress
        },
        weeklyQuests: {
          worldBossCompleted: activity.weeklyQuests.worldBossCompleted,
          sparkFragments: activity.weeklyQuests.sparkFragments,
          professionQuestsDone: activity.weeklyQuests.professionQuestsDone,
          weeklyEventCompleted: activity.weeklyQuests.weeklyEventCompleted,
          completed: activity.weeklyQuests.completed
        }
      };

      if (options.includeTimestamps) {
        data.lastUpdated = activity.lastUpdated;
        data.mythicPlus.lastUpdated = activity.mythicPlus.lastUpdated;
        data.raid.lastUpdated = activity.raid.lastUpdated;
        data.weeklyQuests.lastUpdated = activity.weeklyQuests.lastUpdated;
      }

      processedActivities[characterId] = data;
    });

    return processedActivities;
  }

  private prepareResetHistoryData(): any[] {
    const options = this.exportOptions();

    return this.resetHistory().map(entry => {
      const data: any = {
        resetDate: entry.resetDate,
        charactersReset: entry.charactersReset,
        preservedDataCount: Object.keys(entry.preservedData).length
      };

      // Include full preserved data if timestamps are included
      if (options.includeTimestamps) {
        data.preservedData = entry.preservedData;
      }

      return data;
    });
  }

  // Data validation
  private validateExportData(data: ExportData): void {
    if (!data.metadata) {
      throw new Error('Missing export metadata');
    }

    if (this.exportOptions().characters && (!data.characters || data.characters.length === 0)) {
      throw new Error('Character data selected but no characters found');
    }

    if (this.exportOptions().activities && (!data.activities || Object.keys(data.activities).length === 0)) {
      throw new Error('Activity data selected but no activities found');
    }

    if (this.exportOptions().resetHistory && (!data.resetHistory || data.resetHistory.length === 0)) {
      throw new Error('Reset history selected but no history found');
    }
  }

  // Data formatting
  private formatExportData(data: ExportData): string {
    const options = this.exportOptions();

    try {
      if (options.formatPretty) {
        return JSON.stringify(data, null, 2);
      } else {
        return JSON.stringify(data);
      }
    } catch (error) {
      throw new Error('Failed to format export data as JSON');
    }
  }

  // File download
  private downloadData(data: string): void {
    try {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFileName();
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to download export file');
    }
  }

  private generateFileName(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

    const dataTypes = this.selectedDataTypes().join('-').toLowerCase();

    return `wow-character-data_${dataTypes}_${dateStr}_${timeStr}.json`;
  }

  // UI helper methods
  protected dismissMessage(): void {
    this.updateExportState({
      message: null,
      messageType: null
    });
  }

  protected getDataTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'characters': return 'pi pi-users';
      case 'activities': return 'pi pi-calendar';
      case 'reset history': return 'pi pi-history';
      default: return 'pi pi-file';
    }
  }

  // Private helper methods
  private updateExportState(updates: Partial<ExportState>): void {
    this.exportState.update(current => ({ ...current, ...updates }));
  }

  private showMessage(message: string, type: 'success' | 'info' | 'warn' | 'error'): void {
    this.updateExportState({
      message,
      messageType: type
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}