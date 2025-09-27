import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';

import {
  CharacterProfession,
  ProfessionKnowledge,
  WeeklyProfessionProgress
} from '../models/profession.model';
import { Profession, ProfessionType, getProfessionType, getGatheringProfessions } from '../enums/profession.enum';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

interface ProfessionState {
  characterProfessions: Record<string, CharacterProfession[]>; // keyed by characterId
  weeklyProgress: Record<string, WeeklyProfessionProgress>; // keyed by characterId
  currentWeekStart: Date;
  loading: boolean;
  error: string | null;

  // Default harvesting caps (can be customized)
  harvestingCaps: Record<Profession, number>;

  // Current expansion collectibles and buyables
  availableCollectibles: string[];
  availableBuyables: string[];
}

export const ProfessionStore = signalStore(
  { providedIn: 'root' },

  // Add state for profession knowledge by character
  withState<ProfessionState>({
    characterProfessions: {},
    weeklyProgress: {},
    currentWeekStart: getWeekStartDate(),
    loading: false,
    error: null,

    // Default weekly harvesting caps (these can be customized by user)
    harvestingCaps: {
      [Profession.Herbalism]: 50,
      [Profession.Mining]: 50,
      [Profession.Skinning]: 50,
      // Crafting professions don't have harvesting caps
      [Profession.Blacksmithing]: 0,
      [Profession.Leatherworking]: 0,
      [Profession.Tailoring]: 0,
      [Profession.Jewelcrafting]: 0,
      [Profession.Enchanting]: 0,
      [Profession.Engineering]: 0,
      [Profession.Alchemy]: 0,
      [Profession.Inscription]: 0
    },

    // Current expansion items (to be defined by user)
    availableCollectibles: [
      'ancient-waygate-map',
      'mysterious-ore-sample',
      'rare-herb-seed',
      'pristine-beast-hide'
    ],
    availableBuyables: [
      'profession-trainer-manual',
      'advanced-technique-tome',
      'master-craftsman-guide'
    ]
  }),

  // Add computed selectors
  withComputed((store) => ({
    // Get professions for specific character
    getCharacterProfessions: computed(() => {
      return (characterId: string): CharacterProfession[] => {
        return store.characterProfessions()[characterId] || [];
      };
    }),

    // Get weekly progress for specific character
    getWeeklyProgress: computed(() => {
      return (characterId: string): WeeklyProfessionProgress | null => {
        return store.weeklyProgress()[characterId] || null;
      };
    }),

    // Knowledge progress summary for all characters
    knowledgeProgressSummary: computed(() => {
      const characterProfessions = store.characterProfessions();
      const weeklyProgress = store.weeklyProgress();

      const summary: Record<string, {
        characterId: string;
        professions: {
          profession: Profession;
          type: ProfessionType;
          weeklyQuestDone: boolean;
          harvestingProgress: { current: number; cap: number; percentage: number };
          collectiblesCount: number;
          buyablesCount: number;
          totalKnowledgeEarned: number;
        }[];
        totalWeeklyProgress: number;
      }> = {};

      Object.entries(characterProfessions).forEach(([charId, professions]) => {
        const progress = weeklyProgress[charId];
        const professionDetails = professions.map(charProf => {
          const knowledge = charProf.knowledge;
          const harvestingCap = store.harvestingCaps()[charProf.profession.id];
          const harvestingPercentage = harvestingCap > 0 ?
            Math.round((knowledge.harvestingPoints / harvestingCap) * 100) : 0;

          // Calculate total knowledge earned this week
          let totalKnowledge = 0;
          if (knowledge.weeklyQuestDone) totalKnowledge += 10; // Assume 10 points per weekly quest
          totalKnowledge += knowledge.harvestingPoints;
          totalKnowledge += knowledge.collectiblesObtained.length * 5; // Assume 5 points per collectible
          totalKnowledge += knowledge.buyablesObtained.length * 3; // Assume 3 points per buyable

          return {
            profession: charProf.profession.id,
            type: charProf.profession.type,
            weeklyQuestDone: knowledge.weeklyQuestDone,
            harvestingProgress: {
              current: knowledge.harvestingPoints,
              cap: harvestingCap,
              percentage: harvestingPercentage
            },
            collectiblesCount: knowledge.collectiblesObtained.length,
            buyablesCount: knowledge.buyablesObtained.length,
            totalKnowledgeEarned: totalKnowledge
          };
        });

        const totalWeeklyProgress = progress ? progress.totalKnowledgePointsEarned : 0;

        summary[charId] = {
          characterId: charId,
          professions: professionDetails,
          totalWeeklyProgress
        };
      });

      return summary;
    }),

    // Overall profession statistics
    professionStats: computed(() => {
      const characterProfessions = store.characterProfessions();
      const totalCharacters = Object.keys(characterProfessions).length;

      if (totalCharacters === 0) {
        return {
          totalCharacters: 0,
          totalProfessions: 0,
          completedWeeklyQuests: 0,
          averageHarvestingProgress: 0,
          mostPopularProfession: null as Profession | null
        };
      }

      const professionCounts: Record<Profession, number> = {} as Record<Profession, number>;
      Object.values(Profession).forEach(prof => professionCounts[prof] = 0);

      let totalProfessions = 0;
      let completedWeeklyQuests = 0;
      let totalHarvestingProgress = 0;
      let harvestingProfessionCount = 0;

      Object.values(characterProfessions).forEach(professions => {
        professions.forEach(charProf => {
          totalProfessions++;
          professionCounts[charProf.profession.id]++;

          if (charProf.knowledge.weeklyQuestDone) {
            completedWeeklyQuests++;
          }

          // Calculate harvesting progress for gathering professions
          if (getProfessionType(charProf.profession.id) === ProfessionType.Gathering) {
            const cap = store.harvestingCaps()[charProf.profession.id];
            if (cap > 0) {
              totalHarvestingProgress += (charProf.knowledge.harvestingPoints / cap) * 100;
              harvestingProfessionCount++;
            }
          }
        });
      });

      // Find most popular profession
      let mostPopularProfession: Profession | null = null;
      let maxCount = 0;
      Object.entries(professionCounts).forEach(([profession, count]) => {
        if (count > maxCount) {
          maxCount = count;
          mostPopularProfession = profession as Profession;
        }
      });

      return {
        totalCharacters,
        totalProfessions,
        completedWeeklyQuests,
        averageHarvestingProgress: harvestingProfessionCount > 0 ?
          Math.round(totalHarvestingProgress / harvestingProfessionCount) : 0,
        mostPopularProfession
      };
    }),

    // Week information
    weekInfo: computed(() => {
      const weekStart = store.currentWeekStart();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const now = new Date();
      const timeUntilReset = weekEnd.getTime() - now.getTime();
      const daysUntilReset = Math.ceil(timeUntilReset / (1000 * 60 * 60 * 24));

      return {
        weekStart,
        weekEnd,
        daysUntilReset: Math.max(0, daysUntilReset),
        isResetDay: daysUntilReset === 0
      };
    }),

    // Loading states
    isLoading: computed(() => store.loading()),
    hasError: computed(() => !!store.error())
  })),

  // Add methods for state mutations
  withMethods((store) => {
    const storageService = inject(StorageService);
    const notificationService = inject(NotificationService);
    const STORAGE_KEY = 'wow-professions';

    const methods = {
    // Initialize character professions
    initializeCharacterProfessions: (characterId: string, professions: Profession[]) => {
      if (professions.length > 2) {
        methods.setError('Characters can only have maximum 2 professions');
        return;
      }

      const weekStart = store.currentWeekStart();
      const characterProfessions: CharacterProfession[] = professions.map(profession => ({
        characterId,
        profession: {
          id: profession,
          name: profession,
          type: getProfessionType(profession)
        },
        knowledge: {
          professionId: profession,
          characterId,
          weekStartDate: weekStart,
          weeklyQuestDone: false,
          harvestingPoints: 0,
          harvestingCap: store.harvestingCaps()[profession],
          collectiblesObtained: [],
          buyablesObtained: [],
          lastUpdated: new Date()
        },
        skillLevel: 1,
        maxSkillLevel: 100,
        specializations: [],
        lastUpdated: new Date()
      }));

      patchState(store, {
        characterProfessions: {
          ...store.characterProfessions(),
          [characterId]: characterProfessions
        }
      });

      methods.updateWeeklyProgress(characterId);
      methods.saveToLocalStorage();
    },

    // Update weekly quest completion
    updateWeeklyQuest: (characterId: string, professionId: Profession, completed: boolean) => {
      const characterProfessions = store.characterProfessions()[characterId];
      if (!characterProfessions) return;

      const updatedProfessions = characterProfessions.map(charProf => {
        if (charProf.profession.id === professionId) {
          return {
            ...charProf,
            knowledge: {
              ...charProf.knowledge,
              weeklyQuestDone: completed,
              lastUpdated: new Date()
            },
            lastUpdated: new Date()
          };
        }
        return charProf;
      });

      patchState(store, {
        characterProfessions: {
          ...store.characterProfessions(),
          [characterId]: updatedProfessions
        }
      });

      methods.updateWeeklyProgress(characterId);
      methods.saveToLocalStorage();

      // Show weekly quest notification
      if (completed) {
        const professionName = Object.keys(Profession).find(key => Profession[key as keyof typeof Profession] === professionId) || 'Profession';
        notificationService.showProfessionKnowledgeUpdated(professionName, 10); // Weekly quest typically gives 10 points
      }
    },

    // Update harvesting points
    updateHarvestingPoints: (characterId: string, professionId: Profession, points: number) => {
      const characterProfessions = store.characterProfessions()[characterId];
      if (!characterProfessions) return;

      const professionType = getProfessionType(professionId);
      if (professionType !== ProfessionType.Gathering) {
        methods.setError('Only gathering professions can have harvesting points');
        return;
      }

      const cap = store.harvestingCaps()[professionId];
      const clampedPoints = Math.min(Math.max(0, points), cap);

      const updatedProfessions = characterProfessions.map(charProf => {
        if (charProf.profession.id === professionId) {
          return {
            ...charProf,
            knowledge: {
              ...charProf.knowledge,
              harvestingPoints: clampedPoints,
              lastUpdated: new Date()
            },
            lastUpdated: new Date()
          };
        }
        return charProf;
      });

      patchState(store, {
        characterProfessions: {
          ...store.characterProfessions(),
          [characterId]: updatedProfessions
        }
      });

      methods.updateWeeklyProgress(characterId);
      methods.saveToLocalStorage();

      // Show profession knowledge notification
      const professionName = Object.keys(Profession).find(key => Profession[key as keyof typeof Profession] === professionId) || 'Profession';
      notificationService.showProfessionKnowledgeUpdated(professionName, points);
    },

    // Add collectible item
    addCollectible: (characterId: string, professionId: Profession, collectibleId: string) => {
      const characterProfessions = store.characterProfessions()[characterId];
      if (!characterProfessions) return;

      if (!store.availableCollectibles().includes(collectibleId)) {
        methods.setError('Invalid collectible item');
        return;
      }

      const updatedProfessions = characterProfessions.map(charProf => {
        if (charProf.profession.id === professionId) {
          const collectibles = charProf.knowledge.collectiblesObtained;
          if (collectibles.includes(collectibleId)) {
            return charProf; // Already obtained
          }

          return {
            ...charProf,
            knowledge: {
              ...charProf.knowledge,
              collectiblesObtained: [...collectibles, collectibleId],
              lastUpdated: new Date()
            },
            lastUpdated: new Date()
          };
        }
        return charProf;
      });

      patchState(store, {
        characterProfessions: {
          ...store.characterProfessions(),
          [characterId]: updatedProfessions
        }
      });

      methods.updateWeeklyProgress(characterId);
      methods.saveToLocalStorage();
    },

    // Add buyable item
    addBuyable: (characterId: string, professionId: Profession, buyableId: string) => {
      const characterProfessions = store.characterProfessions()[characterId];
      if (!characterProfessions) return;

      if (!store.availableBuyables().includes(buyableId)) {
        methods.setError('Invalid buyable item');
        return;
      }

      const updatedProfessions = characterProfessions.map(charProf => {
        if (charProf.profession.id === professionId) {
          const buyables = charProf.knowledge.buyablesObtained;
          if (buyables.includes(buyableId)) {
            return charProf; // Already obtained
          }

          return {
            ...charProf,
            knowledge: {
              ...charProf.knowledge,
              buyablesObtained: [...buyables, buyableId],
              lastUpdated: new Date()
            },
            lastUpdated: new Date()
          };
        }
        return charProf;
      });

      patchState(store, {
        characterProfessions: {
          ...store.characterProfessions(),
          [characterId]: updatedProfessions
        }
      });

      methods.updateWeeklyProgress(characterId);
      methods.saveToLocalStorage();
    },

    // Update weekly progress summary
    updateWeeklyProgress: (characterId: string) => {
      const characterProfessions = store.characterProfessions()[characterId];
      if (!characterProfessions) return;

      const weekStart = store.currentWeekStart();
      let totalKnowledgePointsEarned = 0;
      let questsCompleted = 0;
      const harvestingProgress: Record<string, { current: number; cap: number; percentage: number }> = {};

      characterProfessions.forEach(charProf => {
        const knowledge = charProf.knowledge;

        // Count weekly quest completion
        if (knowledge.weeklyQuestDone) {
          questsCompleted++;
          totalKnowledgePointsEarned += 10; // Assume 10 points per weekly quest
        }

        // Count harvesting progress
        const harvestingCap = store.harvestingCaps()[charProf.profession.id];
        if (harvestingCap > 0) {
          totalKnowledgePointsEarned += knowledge.harvestingPoints;
          harvestingProgress[charProf.profession.id] = {
            current: knowledge.harvestingPoints,
            cap: harvestingCap,
            percentage: Math.round((knowledge.harvestingPoints / harvestingCap) * 100)
          };
        }

        // Count collectibles and buyables
        totalKnowledgePointsEarned += knowledge.collectiblesObtained.length * 5;
        totalKnowledgePointsEarned += knowledge.buyablesObtained.length * 3;
      });

      const weeklyProgress: WeeklyProfessionProgress = {
        characterId,
        weekStartDate: weekStart,
        professions: characterProfessions,
        totalKnowledgePointsEarned,
        questsCompleted,
        harvestingProgress,
        lastUpdated: new Date()
      };

      patchState(store, {
        weeklyProgress: {
          ...store.weeklyProgress(),
          [characterId]: weeklyProgress
        }
      });
    },

    // Weekly reset functionality
    performWeeklyReset: () => {
      const newWeekStart = getWeekStartDate();
      const characterProfessions = store.characterProfessions();

      // Reset weekly progress for all characters
      const resetProfessions: Record<string, CharacterProfession[]> = {};

      Object.entries(characterProfessions).forEach(([characterId, professions]) => {
        const resetCharacterProfessions = professions.map(charProf => ({
          ...charProf,
          knowledge: {
            ...charProf.knowledge,
            weekStartDate: newWeekStart,
            weeklyQuestDone: false,
            harvestingPoints: 0,
            // Keep collectibles and buyables as they're per expansion, not weekly
            lastUpdated: new Date()
          },
          lastUpdated: new Date()
        }));

        resetProfessions[characterId] = resetCharacterProfessions;
      });

      patchState(store, {
        characterProfessions: resetProfessions,
        weeklyProgress: {}, // Clear weekly progress
        currentWeekStart: newWeekStart
      });

      // Recalculate weekly progress for all characters
      Object.keys(resetProfessions).forEach(characterId => {
        methods.updateWeeklyProgress(characterId);
      });

      methods.saveToLocalStorage();
    },

    // Update harvesting caps (customization feature)
    updateHarvestingCap: (profession: Profession, newCap: number) => {
      if (getProfessionType(profession) !== ProfessionType.Gathering) {
        methods.setError('Can only set harvesting caps for gathering professions');
        return;
      }

      patchState(store, {
        harvestingCaps: {
          ...store.harvestingCaps(),
          [profession]: Math.max(0, newCap)
        }
      });

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
        characterProfessions: store.characterProfessions(),
        weeklyProgress: store.weeklyProgress(),
        currentWeekStart: store.currentWeekStart().toISOString(),
        harvestingCaps: store.harvestingCaps(),
        availableCollectibles: store.availableCollectibles(),
        availableBuyables: store.availableBuyables(),
        lastUpdated: new Date().toISOString()
      };

      const success = storageService.set(STORAGE_KEY, data);
      if (!success) {
        methods.setError('Failed to save profession data');
      }
    },

    // Async methods using rxMethod
    loadFromLocalStorage: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const validator = (data: unknown): data is {
            characterProfessions: Record<string, any[]>,
            weeklyProgress: Record<string, any>,
            currentWeekStart: string,
            harvestingCaps?: Record<string, number>,
            availableCollectibles?: string[],
            availableBuyables?: string[],
            lastUpdated: string
          } => {
            return typeof data === 'object' && data !== null &&
                   'characterProfessions' in data && typeof (data as any).characterProfessions === 'object' &&
                   'currentWeekStart' in data && typeof (data as any).currentWeekStart === 'string';
          };

          const data = storageService.getWithValidation(STORAGE_KEY, validator);

          if (data) {
            try {
              // Process character professions and convert date strings back to Date objects
              const processedCharacterProfessions: Record<string, CharacterProfession[]> = {};
              Object.entries(data.characterProfessions || {}).forEach(([charId, professions]: [string, any]) => {
                processedCharacterProfessions[charId] = professions.map((charProf: any) => ({
                  ...charProf,
                  knowledge: {
                    ...charProf.knowledge,
                    weekStartDate: new Date(charProf.knowledge.weekStartDate),
                    lastUpdated: new Date(charProf.knowledge.lastUpdated)
                  },
                  lastUpdated: new Date(charProf.lastUpdated)
                }));
              });

              // Process weekly progress
              const processedWeeklyProgress: Record<string, WeeklyProfessionProgress> = {};
              Object.entries(data.weeklyProgress || {}).forEach(([charId, progress]: [string, any]) => {
                processedWeeklyProgress[charId] = {
                  ...progress,
                  weekStartDate: new Date(progress.weekStartDate),
                  professions: progress.professions.map((charProf: any) => ({
                    ...charProf,
                    knowledge: {
                      ...charProf.knowledge,
                      weekStartDate: new Date(charProf.knowledge.weekStartDate),
                      lastUpdated: new Date(charProf.knowledge.lastUpdated)
                    },
                    lastUpdated: new Date(charProf.lastUpdated)
                  })),
                  lastUpdated: new Date(progress.lastUpdated)
                };
              });

              patchState(store, {
                characterProfessions: processedCharacterProfessions,
                weeklyProgress: processedWeeklyProgress,
                currentWeekStart: new Date(data.currentWeekStart),
                harvestingCaps: data.harvestingCaps || store.harvestingCaps(),
                availableCollectibles: data.availableCollectibles || store.availableCollectibles(),
                availableBuyables: data.availableBuyables || store.availableBuyables(),
                loading: false,
                error: null
              });

              return of(processedCharacterProfessions);
            } catch (error) {
              console.error('Failed to process stored profession data:', error);
              patchState(store, {
                loading: false,
                error: 'Failed to process saved profession data'
              });
              return of({});
            }
          } else {
            patchState(store, { loading: false, error: null });
            return of({});
          }
        })
      )
    )
    };

    return methods;
  }),

  // Add lifecycle hooks
  withHooks({
    onInit: (store) => {
      console.log('ProfessionStore initialized');

      // Check if weekly reset is needed
      const currentWeekStart = getWeekStartDate();
      if (store.currentWeekStart().getTime() !== currentWeekStart.getTime()) {
        store.performWeeklyReset();
      }

      // Auto-load from localStorage
      store.loadFromLocalStorage();
    },
    onDestroy: () => {
      console.log('ProfessionStore destroyed');
    }
  })
);

// Helper function (same as in activity store)
function getWeekStartDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));

  // WoW reset is on Wednesday
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);
  wednesday.setHours(0, 0, 0, 0);

  if (now < wednesday) {
    wednesday.setDate(wednesday.getDate() - 7);
  }

  return wednesday;
}