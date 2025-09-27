import { TestBed } from '@angular/core/testing';
import { ProfessionStore } from './profession.store';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import { Profession } from '../enums/profession.enum';

describe('ProfessionStore', () => {
  let store: InstanceType<typeof ProfessionStore>;
  let mockStorageService: jasmine.SpyObj<StorageService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['get', 'set', 'getWithValidation']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showError', 'showProfessionKnowledgeUpdated'
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

    store = TestBed.inject(ProfessionStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have correct initial state', () => {
    expect(store.characterProfessions()).toEqual({});
    expect(store.weeklyProgress()).toEqual({});
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.currentWeekStart()).toBeInstanceOf(Date);
  });

  it('should initialize character professions', () => {
    const testCharacterId = 'test-character-1';
    const professions = [Profession.Mining, Profession.Blacksmithing];

    store.initializeCharacterProfessions(testCharacterId, professions);

    const characterProfessions = store.characterProfessions()[testCharacterId];
    expect(characterProfessions).toBeDefined();
    expect(characterProfessions.length).toBe(2);
  });

  it('should prevent more than 2 professions', () => {
    const testCharacterId = 'test-character-1';
    const professions = [Profession.Mining, Profession.Blacksmithing, Profession.Herbalism];

    store.initializeCharacterProfessions(testCharacterId, professions);

    expect(store.error()).toBe('Characters can only have maximum 2 professions');
    expect(mockNotificationService.showError).toHaveBeenCalledWith('Characters can only have maximum 2 professions');
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
      'wow-professions',
      jasmine.any(Object)
    );
  });

  it('should handle storage save errors', () => {
    mockStorageService.set.and.returnValue(false);

    store.saveToLocalStorage();

    expect(store.error()).toBe('Failed to save profession data');
    expect(mockNotificationService.showError).toHaveBeenCalledWith('Failed to save profession data');
  });

  it('should update weekly quest completion', () => {
    const testCharacterId = 'test-character-1';
    store.initializeCharacterProfessions(testCharacterId, [Profession.Mining]);

    store.updateWeeklyQuest(testCharacterId, Profession.Mining, true);

    expect(mockNotificationService.showProfessionKnowledgeUpdated).toHaveBeenCalledWith(
      'Mining',
      10
    );
  });

  it('should handle harvesting points updates', () => {
    const testCharacterId = 'test-character-1';
    store.initializeCharacterProfessions(testCharacterId, [Profession.Mining]);

    store.updateHarvestingPoints(testCharacterId, Profession.Mining, 25);

    expect(mockNotificationService.showProfessionKnowledgeUpdated).toHaveBeenCalledWith(
      'Mining',
      25
    );
  });
});