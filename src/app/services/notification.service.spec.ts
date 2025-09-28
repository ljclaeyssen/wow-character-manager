import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add', 'clear']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MessageService, useValue: messageServiceSpy }
      ]
    });

    service = TestBed.inject(NotificationService);
    messageService = TestBed.inject(MessageService) as jasmine.SpyObj<MessageService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should call MessageService.add with success severity', () => {
      const message = 'Operation successful';
      const title = 'Success';

      service.showSuccess(message, title);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: title,
        detail: message,
        life: 3000
      });
    });

    it('should use default title and duration when not provided', () => {
      const message = 'Operation successful';

      service.showSuccess(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: 3000
      });
    });

    it('should use custom duration when provided', () => {
      const message = 'Operation successful';
      const customDuration = 5000;

      service.showSuccess(message, 'Success', customDuration);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Success',
        detail: message,
        life: customDuration
      });
    });
  });

  describe('showError', () => {
    it('should call MessageService.add with error severity', () => {
      const message = 'Operation failed';
      const title = 'Error';

      service.showError(message, title);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: title,
        detail: message,
        life: 5000
      });
    });

    it('should use default title and duration when not provided', () => {
      const message = 'Operation failed';

      service.showError(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 5000
      });
    });
  });

  describe('showWarning', () => {
    it('should call MessageService.add with warning severity', () => {
      const message = 'Be careful';
      const title = 'Warning';

      service.showWarning(message, title);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: title,
        detail: message,
        life: 4000
      });
    });

    it('should use default title and duration when not provided', () => {
      const message = 'Be careful';

      service.showWarning(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'warn',
        summary: 'Warning',
        detail: message,
        life: 4000
      });
    });
  });

  describe('showInfo', () => {
    it('should call MessageService.add with info severity', () => {
      const message = 'FYI';
      const title = 'Information';

      service.showInfo(message, title);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: title,
        detail: message,
        life: 4000
      });
    });

    it('should use default title and duration when not provided', () => {
      const message = 'FYI';

      service.showInfo(message);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Information',
        detail: message,
        life: 4000
      });
    });
  });

  describe('clear', () => {
    it('should call MessageService.clear', () => {
      service.clear();

      expect(messageService.clear).toHaveBeenCalled();
    });
  });

  describe('WoW-specific notification methods', () => {
    describe('showCharacterSaved', () => {
      it('should show success notification for character save', () => {
        const characterName = 'Thrall';

        service.showCharacterSaved(characterName);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Character Saved',
          detail: 'Character "Thrall" has been saved successfully!',
          life: 3000
        });
      });
    });

    describe('showCharacterDeleted', () => {
      it('should show info notification for character deletion', () => {
        const characterName = 'Jaina';

        service.showCharacterDeleted(characterName);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'info',
          summary: 'Character Deleted',
          detail: 'Character "Jaina" has been deleted.',
          life: 4000
        });
      });
    });

    describe('showActivityUpdated', () => {
      it('should show success notification for activity update', () => {
        const activityType = 'Mythic Plus';

        service.showActivityUpdated(activityType);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Activity Updated',
          detail: 'Mythic Plus progress has been updated!',
          life: 3000
        });
      });
    });

    describe('showWeeklyReset', () => {
      it('should show info notification for weekly reset', () => {
        service.showWeeklyReset();

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'info',
          summary: 'Weekly Reset',
          detail: 'Weekly activities have been reset!',
          life: 6000
        });
      });
    });

    describe('showDataExported', () => {
      it('should show success notification for data export', () => {
        service.showDataExported();

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Export Complete',
          detail: 'Character data has been exported successfully!',
          life: 3000
        });
      });
    });

    describe('showDataImported', () => {
      it('should show success notification for data import with character count', () => {
        const charactersCount = 5;

        service.showDataImported(charactersCount);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Import Complete',
          detail: '5 character(s) have been imported successfully!',
          life: 3000
        });
      });

      it('should handle singular character count', () => {
        const charactersCount = 1;

        service.showDataImported(charactersCount);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Import Complete',
          detail: '1 character(s) have been imported successfully!',
          life: 3000
        });
      });
    });

    describe('showValidationError', () => {
      it('should show error notification for validation failure', () => {
        const fieldName = 'Character Name';

        service.showValidationError(fieldName);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Please check the Character Name field and try again.',
          life: 5000
        });
      });
    });

    describe('showNetworkError', () => {
      it('should show error notification for network issues', () => {
        service.showNetworkError();

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'Connection Error',
          detail: 'Unable to connect. Please check your connection and try again.',
          life: 5000
        });
      });
    });

    describe('showVaultProgress', () => {
      it('should show info notification for Great Vault progress', () => {
        const activity = 'Mythic Plus';
        const progress = '4/8 dungeons completed';

        service.showVaultProgress(activity, progress);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'info',
          summary: 'Great Vault Progress',
          detail: 'Mythic Plus: 4/8 dungeons completed',
          life: 3000
        });
      });
    });

    describe('showProfessionKnowledgeUpdated', () => {
      it('should show success notification for profession knowledge gain', () => {
        const profession = 'Blacksmithing';
        const points = 15;

        service.showProfessionKnowledgeUpdated(profession, points);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Profession Progress',
          detail: 'Blacksmithing knowledge updated! +15 knowledge points',
          life: 3000
        });
      });

      it('should handle single knowledge point', () => {
        const profession = 'Alchemy';
        const points = 1;

        service.showProfessionKnowledgeUpdated(profession, points);

        expect(messageService.add).toHaveBeenCalledWith({
          severity: 'success',
          summary: 'Profession Progress',
          detail: 'Alchemy knowledge updated! +1 knowledge points',
          life: 3000
        });
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle MessageService errors gracefully', () => {
      messageService.add.and.throwError('MessageService error');

      expect(() => service.showSuccess('test message')).not.toThrow();
    });

    it('should handle empty or null messages', () => {
      service.showSuccess('');
      service.showError(null as any);

      expect(messageService.add).toHaveBeenCalledTimes(2);
    });

    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(1000);

      service.showInfo(longMessage);

      expect(messageService.add).toHaveBeenCalledWith({
        severity: 'info',
        summary: 'Information',
        detail: longMessage,
        life: 4000
      });
    });
  });

  describe('multiple notifications', () => {
    it('should handle multiple notifications in sequence', () => {
      service.showSuccess('First message');
      service.showError('Second message');
      service.showWarning('Third message');

      expect(messageService.add).toHaveBeenCalledTimes(3);
    });

    it('should allow clearing notifications', () => {
      service.showSuccess('Message to be cleared');
      service.clear();

      expect(messageService.add).toHaveBeenCalledTimes(1);
      expect(messageService.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration with WoW character management', () => {
    it('should support complete character workflow notifications', () => {
      // Simulate a character creation workflow
      service.showCharacterSaved('NewCharacter');
      service.showActivityUpdated('Mythic Plus');
      service.showVaultProgress('Raid', '2/6 bosses killed');
      service.showProfessionKnowledgeUpdated('Engineering', 5);

      expect(messageService.add).toHaveBeenCalledTimes(4);

      // Verify the messages were called with correct parameters
      const calls = messageService.add.calls.all();
      expect(calls[0].args[0].summary).toBe('Character Saved');
      expect(calls[1].args[0].summary).toBe('Activity Updated');
      expect(calls[2].args[0].summary).toBe('Great Vault Progress');
      expect(calls[3].args[0].summary).toBe('Profession Progress');
    });
  });
});