import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { addEntity, removeEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';

import { Character } from '../models/character.model';
import { Race } from '../enums/race.enum';
import { Faction } from '../enums/faction.enum';
import { CharacterClass } from '../enums/class.enum';
import { Profession } from '../enums/profession.enum';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

interface CharacterState {
  loading: boolean;
  error: string | null;
  selectedCharacterId: string | null;
}

export const CharacterStore = signalStore(
  { providedIn: 'root' },

  // Add entities support for Character
  withEntities<Character>(),

  // Add additional state
  withState<CharacterState>({
    loading: false,
    error: null,
    selectedCharacterId: null
  }),

  // Add computed selectors
  withComputed((store) => ({
    // Get selected character
    selectedCharacter: computed(() => {
      const id = store.selectedCharacterId();
      return id ? store.entityMap()[id] || null : null;
    }),

    // Character statistics
    characterStats: computed(() => {
      const characters = store.entities();
      const stats = {
        total: characters.length,
        byFaction: {
          [Faction.Alliance]: 0,
          [Faction.Horde]: 0
        },
        byClass: {} as Record<CharacterClass, number>,
        byRace: {} as Record<Race, number>
      };

      // Initialize class and race counters
      Object.values(CharacterClass).forEach(cls => {
        stats.byClass[cls] = 0;
      });
      Object.values(Race).forEach(race => {
        stats.byRace[race] = 0;
      });

      if (characters.length === 0) return stats;

      characters.forEach(character => {
        // Count by faction
        stats.byFaction[character.faction]++;

        // Count by class
        stats.byClass[character.characterClass]++;

        // Count by race
        stats.byRace[character.race]++;
      });

      return stats;
    }),

    // Loading states
    isLoading: computed(() => store.loading()),
    hasError: computed(() => !!store.error()),
    isEmpty: computed(() => store.entities().length === 0)
  })),

  // Add methods for state mutations
  withMethods((store) => {
    const storageService = inject(StorageService);
    const notificationService = inject(NotificationService);
    const STORAGE_KEY = 'wow-characters';

    const methods = {
    // Selection methods
    selectCharacter: (characterId: string | null) => {
      patchState(store, { selectedCharacterId: characterId });
    },

    // CRUD operations
    addCharacter: (character: Character) => {
      patchState(store, addEntity(character));
      methods.saveToLocalStorage();
      notificationService.showCharacterSaved(character.name);
    },

    updateCharacter: (id: string, changes: Partial<Character>) => {
      const updatedCharacter = { ...changes, updatedAt: new Date() };
      patchState(store, updateEntity({ id, changes: updatedCharacter }));
      methods.saveToLocalStorage();
      const character = store.entityMap()[id];
      if (character) {
        notificationService.showCharacterSaved(character.name);
      }
    },

    removeCharacter: (id: string) => {
      const character = store.entityMap()[id];
      patchState(store, removeEntity(id));
      // Clear selection if removed character was selected
      if (store.selectedCharacterId() === id) {
        patchState(store, { selectedCharacterId: null });
      }
      methods.saveToLocalStorage();
      if (character) {
        notificationService.showCharacterDeleted(character.name);
      }
    },

    // Bulk operations
    addCharacters: (characters: Character[]) => {
      characters.forEach(character => {
        patchState(store, addEntity(character));
      });
      methods.saveToLocalStorage();
    },

    removeCharacters: (ids: string[]) => {
      ids.forEach(id => {
        patchState(store, removeEntity(id));
      });
      // Clear selection if removed character was selected
      if (store.selectedCharacterId() && ids.includes(store.selectedCharacterId()!)) {
        patchState(store, { selectedCharacterId: null });
      }
      methods.saveToLocalStorage();
    },

    // Error handling
    setError: (error: string | null) => {
      patchState(store, { error, loading: false });
      if (error) {
        notificationService.showError(error);
      }
    },

    clearError: () => {
      patchState(store, { error: null });
    },

    // Loading state
    setLoading: (loading: boolean) => {
      patchState(store, { loading });
    },

    // Local storage operations
    saveToLocalStorage: () => {
      const data = {
        characters: store.entities(),
        selectedCharacterId: store.selectedCharacterId(),
        lastUpdated: new Date().toISOString()
      };

      const success = storageService.set(STORAGE_KEY, data);
      if (!success) {
        methods.setError('Failed to save character data');
      }
    },

    // Async methods using rxMethod
    loadFromLocalStorage: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const validator = (data: unknown): data is { characters: any[], selectedCharacterId: string | null, lastUpdated: string } => {
            return typeof data === 'object' && data !== null &&
                   'characters' in data && Array.isArray((data as any).characters);
          };

          const data = storageService.getWithValidation(STORAGE_KEY, validator);

          if (data) {
            try {
              const characters = data.characters || [];

              // Convert date strings back to Date objects
              const processedCharacters = characters.map((char: any) => ({
                ...char,
                createdAt: new Date(char.createdAt),
                updatedAt: new Date(char.updatedAt)
              }));

              // Clear existing entities and add new ones
              patchState(store, {
                loading: false,
                error: null,
                selectedCharacterId: data.selectedCharacterId || null
              });

              // Add entities one by one
              processedCharacters.forEach(character => {
                patchState(store, addEntity(character));
              });

              return of(processedCharacters);
            } catch (error) {
              console.error('Failed to process stored characters:', error);
              patchState(store, {
                loading: false,
                error: 'Failed to process saved characters'
              });
              return of([]);
            }
          } else {
            patchState(store, { loading: false, error: null });
            return of([]);
          }
        })
      )
    ),

    // Import/export functionality
    exportData: () => {
      try {
        const data = {
          characters: store.entities(),
          selectedCharacterId: store.selectedCharacterId(),
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wow-characters-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        notificationService.showDataExported();
        return data;
      } catch (error) {
        console.error('Failed to export data:', error);
        methods.setError('Failed to export data');
        return null;
      }
    },

    importData: rxMethod<File>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((file) => {
          return new Promise<any>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const data = JSON.parse(e.target?.result as string);
                resolve(data);
              } catch (error) {
                reject(error);
              }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
          });
        }),
        tap((data) => {
          try {
            if (data.characters && Array.isArray(data.characters)) {
              const processedCharacters = data.characters.map((char: any) => ({
                ...char,
                createdAt: new Date(char.createdAt),
                updatedAt: new Date(char.updatedAt)
              }));

              // Clear existing entities first
              const existingIds = store.ids();
              existingIds.forEach(id => {
                patchState(store, removeEntity(id));
              });

              // Add new entities
              processedCharacters.forEach((character: Character) => {
                patchState(store, addEntity(character));
              });

              // Update state
              patchState(store, {
                selectedCharacterId: data.selectedCharacterId || null,
                loading: false,
                error: null
              });

              methods.saveToLocalStorage();
              notificationService.showDataImported(processedCharacters.length);
            } else {
              throw new Error('Invalid data format');
            }
          } catch (error) {
            console.error('Failed to import data:', error);
            patchState(store, {
              loading: false,
              error: 'Failed to import data - invalid format'
            });
          }
        }),
        catchError((error) => {
          console.error('Failed to read import file:', error);
          patchState(store, {
            loading: false,
            error: 'Failed to read import file'
          });
          return of(null);
        })
      )
    )
    };

    return methods;
  }),

  // Add lifecycle hooks
  withHooks({
    onInit: (store) => {
      console.log('CharacterStore initialized');
      // Auto-load from localStorage on initialization
      store.loadFromLocalStorage();

      // Add sample data if store is empty (for testing)
      setTimeout(() => {
        if (store.isEmpty()) {
          console.log('Adding sample character data for testing');
          const sampleCharacters: Character[] = [
            {
              id: 'char-sample-1',
              name: 'Arthas',
              race: Race.Human,
              faction: Faction.Alliance,
              characterClass: CharacterClass.Paladin,
              specialization: 'Protection',
              professions: [Profession.Blacksmithing, Profession.Mining],
              createdAt: new Date('2024-01-15'),
              updatedAt: new Date('2024-01-20')
            },
            {
              id: 'char-sample-2',
              name: 'Thrall',
              race: Race.Orc,
              faction: Faction.Horde,
              characterClass: CharacterClass.Shaman,
              specialization: 'Enhancement',
              professions: [Profession.Leatherworking, Profession.Skinning],
              createdAt: new Date('2024-01-10'),
              updatedAt: new Date('2024-01-25')
            },
            {
              id: 'char-sample-3',
              name: 'Jaina',
              race: Race.Human,
              faction: Faction.Alliance,
              characterClass: CharacterClass.Mage,
              specialization: 'Frost',
              professions: [Profession.Tailoring, Profession.Enchanting],
              createdAt: new Date('2024-01-05'),
              updatedAt: new Date('2024-01-18')
            }
          ];

          store.addCharacters(sampleCharacters);
        }
      }, 100);
    },
    onDestroy: () => {
      console.log('CharacterStore destroyed');
    }
  })
);