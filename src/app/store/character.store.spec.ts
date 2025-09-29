import { TestBed } from '@angular/core/testing';
import { CharacterStore } from './character.store';
import { StorageService } from '../services/storage.service';
import { Character } from '../models/character.model';
import { Race } from '../enums/race.enum';
import { Faction } from '../enums/faction.enum';
import { CharacterClass } from '../enums/class.enum';
import { Profession } from '../enums/profession.enum';

describe('CharacterStore', () => {
  let store: InstanceType<typeof CharacterStore>;
  let mockStorageService: jasmine.SpyObj<StorageService>;

  // Mock StorageService
  const createMockStorageService = () => jasmine.createSpyObj('StorageService', {
    'get': null,
    'set': true,
    'getWithValidation': null,
    'remove': true,
    'clear': true,
    'exists': false,
    'isAvailable': true
  });

  // Test character data
  const testCharacter: Character = {
    id: '1',
    name: 'Testchar',
    race: Race.Human,
    server: 'Ysondre',
    faction: Faction.Alliance,
    characterClass: CharacterClass.Warrior,
    specialization: 'Arms',
    professions: [Profession.Mining, Profession.Blacksmithing],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const testCharacter2: Character = {
    id: '2',
    name: 'Hordeguy',
    server: 'Ysondre',
    race: Race.Orc,
    faction: Faction.Horde,
    characterClass: CharacterClass.Shaman,
    specialization: 'Enhancement',
    professions: [Profession.Herbalism, Profession.Alchemy],
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  };

  beforeEach(() => {
    mockStorageService = createMockStorageService();

    TestBed.configureTestingModule({
      providers: [
        CharacterStore,
        { provide: StorageService, useValue: mockStorageService }
      ]
    });

    store = TestBed.inject(CharacterStore);

    // Reset all StorageService mocks
    mockStorageService.get.calls.reset();
    mockStorageService.set.calls.reset();
    mockStorageService.getWithValidation.calls.reset();
    mockStorageService.remove.calls.reset();
    mockStorageService.clear.calls.reset();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      expect(store.entities()).toEqual([]);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.selectedCharacterId()).toBeNull();
      expect(store.isEmpty()).toBe(true);
    });

    it('should have correct initial computed values', () => {
      expect(store.selectedCharacter()).toBeNull();
      expect(store.characterStats().total).toBe(0);
      expect(store.isLoading()).toBe(false);
      expect(store.hasError()).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    it('should add a character', () => {
      store.addCharacter(testCharacter);

      expect(store.entities()).toContain(testCharacter);
      expect(store.entities().length).toBe(1);
      expect(store.isEmpty()).toBe(false);
      expect(mockStorageService.set).toHaveBeenCalledWith(
        'wow-characters',
        jasmine.any(Object)
      );
    });

    it('should update a character', () => {
      store.addCharacter(testCharacter);

      const updates = { name: 'UpdatedName' };
      store.updateCharacter(testCharacter.id, updates);

      const updatedCharacter = store.entityMap()[testCharacter.id];
      expect(updatedCharacter.name).toBe('UpdatedName');
      expect(updatedCharacter.updatedAt).toBeInstanceOf(Date);
      expect(mockStorageService.set).toHaveBeenCalled();
    });

    it('should remove a character', () => {
      store.addCharacter(testCharacter);
      store.addCharacter(testCharacter2);
      expect(store.entities().length).toBe(2);

      store.removeCharacter(testCharacter.id);

      expect(store.entities().length).toBe(1);
      expect(store.entityMap()[testCharacter.id]).toBeUndefined();
      expect(store.entities()[0]).toEqual(testCharacter2);
      expect(mockStorageService.set).toHaveBeenCalled();
    });

    it('should clear selection when removing selected character', () => {
      store.addCharacter(testCharacter);
      store.selectCharacter(testCharacter.id);
      expect(store.selectedCharacterId()).toBe(testCharacter.id);

      store.removeCharacter(testCharacter.id);

      expect(store.selectedCharacterId()).toBeNull();
      expect(store.selectedCharacter()).toBeNull();
    });

    it('should add multiple characters', () => {
      const characters = [testCharacter, testCharacter2];
      store.addCharacters(characters);

      expect(store.entities().length).toBe(2);
      expect(store.entities()).toContain(testCharacter);
      expect(store.entities()).toContain(testCharacter2);
      expect(mockStorageService.set).toHaveBeenCalled();
    });

    it('should remove multiple characters', () => {
      store.addCharacters([testCharacter, testCharacter2]);
      expect(store.entities().length).toBe(2);

      store.removeCharacters([testCharacter.id, testCharacter2.id]);

      expect(store.entities().length).toBe(0);
      expect(store.isEmpty()).toBe(true);
      expect(mockStorageService.set).toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    beforeEach(() => {
      store.addCharacter(testCharacter);
    });

    it('should select a character', () => {
      store.selectCharacter(testCharacter.id);

      expect(store.selectedCharacterId()).toBe(testCharacter.id);
      expect(store.selectedCharacter()).toEqual(testCharacter);
    });

    it('should deselect character', () => {
      store.selectCharacter(testCharacter.id);
      expect(store.selectedCharacterId()).toBe(testCharacter.id);

      store.selectCharacter(null);

      expect(store.selectedCharacterId()).toBeNull();
      expect(store.selectedCharacter()).toBeNull();
    });

    it('should return null for invalid character selection', () => {
      store.selectCharacter('nonexistent-id');

      expect(store.selectedCharacter()).toBeNull();
    });
  });

  describe('Character Statistics', () => {
    beforeEach(() => {
      store.addCharacters([testCharacter, testCharacter2]);
    });

    it('should calculate correct statistics', () => {
      const stats = store.characterStats();

      expect(stats.total).toBe(2);
      expect(stats.byFaction[Faction.Alliance]).toBe(1);
      expect(stats.byFaction[Faction.Horde]).toBe(1);
      expect(stats.byClass[CharacterClass.Warrior]).toBe(1);
      expect(stats.byClass[CharacterClass.Shaman]).toBe(1);
      expect(stats.byRace[Race.Human]).toBe(1);
      expect(stats.byRace[Race.Orc]).toBe(1);
    });

    it('should return empty stats for no characters', () => {
      // Start with empty store
      const emptyStore = TestBed.inject(CharacterStore);
      const stats = emptyStore.characterStats();

      expect(stats.total).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const errorMessage = 'Test error';

      store.setError(errorMessage);

      expect(store.error()).toBe(errorMessage);
      expect(store.hasError()).toBe(true);
      expect(store.loading()).toBe(false);

      store.clearError();

      expect(store.error()).toBeNull();
      expect(store.hasError()).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('should set loading state', () => {
      expect(store.loading()).toBe(false);
      expect(store.isLoading()).toBe(false);

      store.setLoading(true);

      expect(store.loading()).toBe(true);
      expect(store.isLoading()).toBe(true);

      store.setLoading(false);

      expect(store.loading()).toBe(false);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('Storage Operations', () => {
    it('should save to storage when adding character', () => {
      store.addCharacter(testCharacter);

      expect(mockStorageService.set).toHaveBeenCalledWith(
        'wow-characters',
        jasmine.any(Object)
      );

      const savedData = mockStorageService.set.calls.mostRecent().args[1] as any;
      expect(savedData.characters).toEqual([testCharacter]);
      expect(savedData.lastUpdated).toBeDefined();
    });

    it('should handle storage save errors', () => {
      mockStorageService.set.and.returnValue(false);

      store.addCharacter(testCharacter);

      expect(mockStorageService.set).toHaveBeenCalled();
      expect(store.error()).toBe('Failed to save data');
    });

    it('should load from storage on initialization', () => {
      const storedData = {
        characters: [testCharacter],
        selectedCharacterId: testCharacter.id,
        lastUpdated: new Date().toISOString()
      };

      mockStorageService.getWithValidation.and.returnValue(storedData);

      // Trigger load
      store.loadFromLocalStorage();

      // Need to wait for async operation
      setTimeout(() => {
        expect(mockStorageService.getWithValidation).toHaveBeenCalledWith(
          'wow-characters',
          jasmine.any(Function)
        );
        expect(store.entities()).toEqual([jasmine.objectContaining({
          ...testCharacter,
          createdAt: jasmine.any(Date),
          updatedAt: jasmine.any(Date)
        })]);
        expect(store.selectedCharacterId()).toBe(testCharacter.id);
      }, 0);
    });

    it('should handle storage load errors', () => {
      mockStorageService.getWithValidation.and.returnValue(null);

      store.loadFromLocalStorage();

      setTimeout(() => {
        expect(mockStorageService.getWithValidation).toHaveBeenCalled();
        expect(store.entities()).toEqual([]);
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeNull();
      }, 0);
    });

    it('should handle empty storage', () => {
      mockStorageService.getWithValidation.and.returnValue(null);

      store.loadFromLocalStorage();

      setTimeout(() => {
        expect(store.entities()).toEqual([]);
        expect(store.loading()).toBe(false);
        expect(store.error()).toBeNull();
      }, 0);
    });
  });

  describe('Export/Import Functionality', () => {
    beforeEach(() => {
      // Mock URL.createObjectURL and related DOM APIs
      (window as any).URL = {
        createObjectURL: jasmine.createSpy('createObjectURL').and.returnValue('mock-url'),
        revokeObjectURL: jasmine.createSpy('revokeObjectURL')
      };

      // Mock document.createElement
      const mockAnchor = {
        href: '',
        download: '',
        click: jasmine.createSpy('click')
      };
      spyOn(document, 'createElement').and.returnValue(mockAnchor as any);
    });

    it('should export data correctly', () => {
      store.addCharacters([testCharacter, testCharacter2]);
      store.selectCharacter(testCharacter.id);

      const exportedData = store.exportData();

      expect(exportedData).toBeDefined();
      expect(exportedData!.characters).toEqual([testCharacter, testCharacter2]);
      expect(exportedData!.selectedCharacterId).toBe(testCharacter.id);
      expect(exportedData!.version).toBe('1.0');
      expect(exportedData!.exportedAt).toBeDefined();

      expect((window as any).URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle export errors', () => {
      (window as any).URL.createObjectURL = jasmine.createSpy('createObjectURL').and.throwError('Export failed');
      spyOn(console, 'error');

      store.addCharacter(testCharacter);
      const result = store.exportData();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
      expect(store.error()).toBe('Failed to export data');
    });
  });

  describe('Computed Reactivity', () => {
    it('should update computed values when entities change', () => {
      expect(store.isEmpty()).toBe(true);
      expect(store.characterStats().total).toBe(0);

      store.addCharacter(testCharacter);

      expect(store.isEmpty()).toBe(false);
      expect(store.characterStats().total).toBe(1);

      store.addCharacter(testCharacter2);

      expect(store.characterStats().total).toBe(2);
    });

    it('should update selectedCharacter when selection changes', () => {
      store.addCharacter(testCharacter);
      expect(store.selectedCharacter()).toBeNull();

      store.selectCharacter(testCharacter.id);

      expect(store.selectedCharacter()).toEqual(testCharacter);

      store.selectCharacter(null);

      expect(store.selectedCharacter()).toBeNull();
    });
  });
});
