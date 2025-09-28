import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { NotificationService } from '../../services/notification.service';
import { Character } from '../../models/character.model';
import { CharacterActivity } from '../../models/activity.model';

interface ImportMetadata {
  exportDate: string;
  version: string;
  dataTypes: string[];
}

interface ImportData {
  metadata: ImportMetadata;
  characters?: Character[];
  activities?: Record<string, CharacterActivity>;
  resetHistory?: Array<{
    resetDate: string;
    charactersReset: string[];
    preservedData: Record<string, CharacterActivity>;
  }>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: ImportMetadata;
  characterCount?: number;
  activityCount?: number;
  resetHistoryCount?: number;
}

interface ImportOptions {
  mergeCharacters: boolean;
  mergeActivities: boolean;
  importResetHistory: boolean;
  overwriteExisting: boolean;
}

interface ImportState {
  isImporting: boolean;
  progress: number;
  message: string | null;
  messageType: 'success' | 'info' | 'warn' | 'error' | null;
  lastImportDate: Date | null;
}

@Component({
  selector: 'app-data-import',
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
    DividerModule,
    FileUploadModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './data-import.component.html',
  styleUrl: './data-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataImportComponent {
  private readonly characterStore = inject(CharacterStore);
  private readonly activityStore = inject(ActivityStore);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  // Component state
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly validationResult = signal<ValidationResult | null>(null);

  protected readonly importOptions = signal<ImportOptions>({
    mergeCharacters: true,
    mergeActivities: true,
    importResetHistory: false,
    overwriteExisting: false
  });

  protected readonly importState = signal<ImportState>({
    isImporting: false,
    progress: 0,
    message: null,
    messageType: null,
    lastImportDate: null
  });

  // Store data for conflict checking
  protected readonly existingCharacters = this.characterStore.entities;
  protected readonly existingActivities = this.activityStore.activities;

  // Computed properties
  protected readonly hasValidFile = computed(() =>
    this.selectedFile() !== null && this.validationResult()?.isValid === true
  );

  protected readonly hasConflicts = computed(() => {
    const validation = this.validationResult();
    if (!validation?.isValid) return false;

    const options = this.importOptions();
    const existing = this.existingCharacters();

    return options.mergeCharacters &&
           validation.characterCount! > 0 &&
           existing.length > 0;
  });

  protected readonly canImport = computed(() => {
    const state = this.importState();
    return this.hasValidFile() && !state.isImporting;
  });

  protected readonly importSummary = computed(() => {
    const validation = this.validationResult();
    const options = this.importOptions();

    if (!validation?.isValid) return null;

    return {
      characters: options.mergeCharacters ? validation.characterCount || 0 : 0,
      activities: options.mergeActivities ? validation.activityCount || 0 : 0,
      resetHistory: options.importResetHistory ? validation.resetHistoryCount || 0 : 0
    };
  });

  // File handling methods
  protected onFileSelect(event: any): void {
    const files = event.files || event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.selectedFile.set(file);
      this.validateFile(file);
    }
  }

  protected onFileRemove(): void {
    this.selectedFile.set(null);
    this.validationResult.set(null);
    this.clearMessage();
  }

  // File validation
  private async validateFile(file: File): Promise<void> {
    try {
      this.showMessage('Validating file...', 'info');

      // Check file type
      if (!file.name.endsWith('.json')) {
        this.validationResult.set({
          isValid: false,
          errors: ['File must be a JSON file'],
          warnings: []
        });
        this.showMessage('Invalid file type', 'error');
        return;
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        this.validationResult.set({
          isValid: false,
          errors: ['File size too large (max 50MB)'],
          warnings: []
        });
        this.showMessage('File too large', 'error');
        return;
      }

      // Read and parse file
      const content = await this.readFileContent(file);
      const parsedData = this.parseJsonContent(content);

      // Validate structure
      const validation = this.validateImportData(parsedData);
      this.validationResult.set(validation);

      if (validation.isValid) {
        this.showMessage('File validated successfully', 'success');
      } else {
        this.showMessage('File validation failed', 'error');
      }

    } catch (error) {
      console.error('File validation error:', error);
      this.validationResult.set({
        isValid: false,
        errors: ['Failed to read or parse file'],
        warnings: []
      });
      this.showMessage('File validation failed', 'error');
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseJsonContent(content: string): ImportData {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  private validateImportData(data: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required structure
    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return { isValid: false, errors, warnings };
    }

    // Validate metadata
    if (!data.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!data.metadata.exportDate) {
        errors.push('Missing export date in metadata');
      }
      if (!data.metadata.version) {
        warnings.push('Missing version information');
      }
      if (!Array.isArray(data.metadata.dataTypes)) {
        warnings.push('Missing data types information');
      }
    }

    // Count data items
    let characterCount = 0;
    let activityCount = 0;
    let resetHistoryCount = 0;

    // Validate characters
    if (data.characters) {
      if (!Array.isArray(data.characters)) {
        errors.push('Characters data must be an array');
      } else {
        characterCount = data.characters.length;

        // Basic character validation
        data.characters.forEach((char: any, index: number) => {
          if (!char.id || !char.name) {
            errors.push(`Character ${index + 1}: Missing required fields (id, name)`);
          }
          if (!char.race || !char.characterClass) {
            warnings.push(`Character ${index + 1}: Missing race or class information`);
          }
        });
      }
    }

    // Validate activities
    if (data.activities) {
      if (typeof data.activities !== 'object') {
        errors.push('Activities data must be an object');
      } else {
        activityCount = Object.keys(data.activities).length;

        // Basic activity validation
        Object.entries(data.activities).forEach(([charId, activity]: [string, any]) => {
          if (!activity.characterId || !activity.weekStartDate) {
            errors.push(`Activity for ${charId}: Missing required fields`);
          }
        });
      }
    }

    // Validate reset history
    if (data.resetHistory) {
      if (!Array.isArray(data.resetHistory)) {
        errors.push('Reset history must be an array');
      } else {
        resetHistoryCount = data.resetHistory.length;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: data.metadata,
      characterCount,
      activityCount,
      resetHistoryCount
    };
  }

  // Import options methods
  protected updateImportOption(key: keyof ImportOptions, value: boolean): void {
    this.importOptions.update(options => ({
      ...options,
      [key]: value
    }));
  }

  // Import functionality
  protected async performImport(): Promise<void> {
    if (!this.canImport()) {
      this.showMessage('Cannot import at this time', 'warn');
      return;
    }

    const file = this.selectedFile()!;
    const options = this.importOptions();

    // Check for conflicts and confirm if needed
    if (this.hasConflicts() && !options.overwriteExisting) {
      this.confirmationService.confirm({
        message: 'Importing will merge with existing data. Continue?',
        header: 'Confirm Import',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonStyleClass: 'p-button-success',
        rejectButtonStyleClass: 'p-button-secondary',
        accept: () => this.executeImport(file),
        reject: () => this.showMessage('Import cancelled', 'info')
      });
      return;
    }

    await this.executeImport(file);
  }

  private async executeImport(file: File): Promise<void> {
    try {
      this.updateImportState({
        isImporting: true,
        progress: 0,
        message: 'Starting import...',
        messageType: 'info'
      });

      // Read and parse file
      await this.sleep(300);
      this.updateImportState({ progress: 20, message: 'Reading file...' });

      const content = await this.readFileContent(file);
      const importData: ImportData = JSON.parse(content);

      await this.sleep(300);
      this.updateImportState({ progress: 40, message: 'Processing data...' });

      const options = this.importOptions();
      let importedCount = 0;

      // Import characters
      if (options.mergeCharacters && importData.characters) {
        await this.importCharacters(importData.characters);
        importedCount += importData.characters.length;
      }

      await this.sleep(300);
      this.updateImportState({ progress: 70, message: 'Importing activities...' });

      // Import activities
      if (options.mergeActivities && importData.activities) {
        await this.importActivities(importData.activities);
        importedCount += Object.keys(importData.activities).length;
      }

      await this.sleep(300);
      this.updateImportState({ progress: 90, message: 'Finalizing import...' });

      // Import reset history
      if (options.importResetHistory && importData.resetHistory) {
        await this.importResetHistory(importData.resetHistory);
      }

      await this.sleep(300);
      this.updateImportState({
        isImporting: false,
        progress: 100,
        message: `Successfully imported ${importedCount} items`,
        messageType: 'success',
        lastImportDate: new Date()
      });

      this.notificationService.showSuccess(
        `Import completed: ${importedCount} items imported`,
        'Data Import'
      );

      // Clear file selection
      this.selectedFile.set(null);
      this.validationResult.set(null);

    } catch (error) {
      console.error('Import failed:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';

      this.updateImportState({
        isImporting: false,
        progress: 0,
        message: `Import failed: ${errorMessage}`,
        messageType: 'error'
      });

      this.notificationService.showError(`Import failed: ${errorMessage}`);
    }
  }

  private async importCharacters(characters: Character[]): Promise<void> {
    const options = this.importOptions();

    for (const character of characters) {
      if (options.overwriteExisting) {
        this.characterStore.updateCharacter(character.id, character);
      } else {
        // Check if character exists
        const existing = this.existingCharacters().find(c => c.id === character.id);
        if (!existing) {
          this.characterStore.addCharacter(character);
        }
      }
    }
  }

  private async importActivities(activities: Record<string, CharacterActivity>): Promise<void> {
    const options = this.importOptions();

    Object.entries(activities).forEach(([characterId, activity]) => {
      if (options.overwriteExisting) {
        this.activityStore.updateMythicPlusActivity(characterId, activity.mythicPlus);
        this.activityStore.updateRaidActivity(characterId, activity.raid);
        this.activityStore.updateWeeklyQuests(characterId, activity.weeklyQuests);
      } else {
        // Only import if no existing activity for this character
        const existing = this.existingActivities()[characterId];
        if (!existing) {
          this.activityStore.updateMythicPlusActivity(characterId, activity.mythicPlus);
          this.activityStore.updateRaidActivity(characterId, activity.raid);
          this.activityStore.updateWeeklyQuests(characterId, activity.weeklyQuests);
        }
      }
    });
  }

  private async importResetHistory(resetHistory: any[]): Promise<void> {
    // Add reset history to activity store
    resetHistory.forEach(entry => {
      // Note: Reset history import would need additional method in activity store
      console.log('Reset history entry:', entry);
    });
  }

  // UI helper methods
  protected dismissMessage(): void {
    this.updateImportState({
      message: null,
      messageType: null
    });
  }

  protected getValidationIcon(): string {
    const validation = this.validationResult();
    if (!validation) return 'pi pi-file';
    return validation.isValid ? 'pi pi-check-circle' : 'pi pi-times-circle';
  }

  protected getValidationColor(): string {
    const validation = this.validationResult();
    if (!validation) return '';
    return validation.isValid ? 'text-green-600' : 'text-red-600';
  }

  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Private helper methods
  private updateImportState(updates: Partial<ImportState>): void {
    this.importState.update(current => ({ ...current, ...updates }));
  }

  private showMessage(message: string, type: 'success' | 'info' | 'warn' | 'error'): void {
    this.updateImportState({
      message,
      messageType: type
    });
  }

  private clearMessage(): void {
    this.updateImportState({
      message: null,
      messageType: null
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}