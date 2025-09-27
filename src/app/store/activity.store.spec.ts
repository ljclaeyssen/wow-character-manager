import { TestBed } from '@angular/core/testing';
import { ActivityStore } from './activity.store';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

describe('ActivityStore', () => {
  let store: InstanceType<typeof ActivityStore>;
  let mockStorageService: jasmine.SpyObj<StorageService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['get', 'set', 'getWithValidation']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showError', 'showVaultProgress', 'showActivityUpdated', 'showWeeklyReset'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: storageServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    });

    mockStorageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Mock successful storage operations by default
    mockStorageService.set.and.returnValue(true);
    mockStorageService.get.and.returnValue(null);
    mockStorageService.getWithValidation.and.returnValue(null);

    store = TestBed.inject(ActivityStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have correct initial state', () => {
    expect(store.activities()).toEqual({});
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.currentWeekStart()).toBeInstanceOf(Date);
  });

  it('should initialize character activity', () => {
    const testCharacterId = 'test-character-1';

    store.initializeCharacterActivity(testCharacterId);

    const activity = store.getActivityForCharacter()(testCharacterId);
    expect(activity).toBeDefined();
    expect(activity!.characterId).toBe(testCharacterId);
  });

  it('should handle errors', () => {
    store.setError('Test error');

    expect(store.error()).toBe('Test error');
    expect(mockNotificationService.showError).toHaveBeenCalledWith('Test error');
  });

  it('should manage loading state', () => {
    expect(store.loading()).toBe(false);

    store.setLoading(true);
    expect(store.loading()).toBe(true);

    store.setLoading(false);
    expect(store.loading()).toBe(false);
  });

  it('should clear errors', () => {
    store.setError('Test error');
    expect(store.error()).toBe('Test error');

    store.clearError();
    expect(store.error()).toBeNull();
  });

  it('should save to localStorage when saving', () => {
    store.saveToLocalStorage();

    expect(mockStorageService.set).toHaveBeenCalledWith(
      'wow-activities',
      jasmine.any(Object)
    );
  });

  it('should handle storage save errors', () => {
    mockStorageService.set.and.returnValue(false);

    store.saveToLocalStorage();

    expect(store.error()).toBe('Failed to save activity data');
    expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to save activity data');
  });
});