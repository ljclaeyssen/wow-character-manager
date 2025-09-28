import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly messageService = inject(MessageService);

  /**
   * Show a success notification
   */
  showSuccess(message: string, title = 'Success', duration = 3000): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: duration
    });
  }

  /**
   * Show an error notification
   */
  showError(message: string, title = 'Error', duration = 5000): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: duration
    });
  }

  /**
   * Show a warning notification
   */
  showWarning(message: string, title = 'Warning', duration = 4000): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: duration
    });
  }

  /**
   * Show an info notification
   */
  showInfo(message: string, title = 'Information', duration = 4000): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: duration
    });
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.messageService.clear();
  }

  /**
   * WoW-specific notification methods
   */

  /**
   * Show character saved notification
   */
  showCharacterSaved(characterName: string): void {
    this.showSuccess(`Character "${characterName}" has been saved successfully!`, 'Character Saved');
  }

  /**
   * Show character deleted notification
   */
  showCharacterDeleted(characterName: string): void {
    this.showInfo(`Character "${characterName}" has been deleted.`, 'Character Deleted');
  }

  /**
   * Show activity updated notification
   */
  showActivityUpdated(activityType: string): void {
    this.showSuccess(`${activityType} progress has been updated!`, 'Activity Updated');
  }

  /**
   * Show weekly reset notification
   */
  showWeeklyReset(): void {
    this.showInfo('Weekly activities have been reset!', 'Weekly Reset', 6000);
  }

  /**
   * Show data export success notification
   */
  showDataExported(): void {
    this.showSuccess('Character data has been exported successfully!', 'Export Complete');
  }

  /**
   * Show data import success notification
   */
  showDataImported(charactersCount: number): void {
    this.showSuccess(
      `${charactersCount} character(s) have been imported successfully!`,
      'Import Complete'
    );
  }

  /**
   * Show validation error notification
   */
  showValidationError(fieldName: string): void {
    this.showError(`Please check the ${fieldName} field and try again.`, 'Validation Error');
  }

  /**
   * Show network error notification
   */
  showNetworkError(): void {
    this.showError('Unable to connect. Please check your connection and try again.', 'Connection Error');
  }

  /**
   * Show Great Vault progress notification
   */
  showVaultProgress(activity: string, progress: string): void {
    this.showInfo(`${activity}: ${progress}`, 'Great Vault Progress', 3000);
  }

  /**
   * Show profession knowledge updated notification
   */
  showProfessionKnowledgeUpdated(profession: string, points: number): void {
    this.showSuccess(
      `${profession} knowledge updated! +${points} knowledge points`,
      'Profession Progress'
    );
  }
}