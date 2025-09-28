import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';

import {
  CharacterActivity,
  MythicPlusActivity,
  MythicPlusRun,
  RaidActivity,
  WeeklyQuest
} from '../models/activity.model';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';
import { ResetService } from '../services/reset.service';

interface ActivityState {
  activities: Record<string, CharacterActivity>; // keyed by characterId
  currentWeekStart: Date;
  loading: boolean;
  error: string | null;
  // Reset tracking
  lastResetDate: Date | null;
  isResetInProgress: boolean;
  resetHistory: Array<{
    resetDate: Date;
    charactersReset: string[];
    preservedData: Record<string, CharacterActivity>;
  }>;
}

export const ActivityStore = signalStore(
  { providedIn: 'root' },

  // Add state for activities by character
  withState<ActivityState>({
    activities: {},
    currentWeekStart: getWeekStartDate(),
    loading: false,
    error: null,
    // Reset tracking
    lastResetDate: null,
    isResetInProgress: false,
    resetHistory: []
  }),

  // Add computed selectors
  withComputed((store) => ({
    // Get activity for specific character
    getActivityForCharacter: computed(() => {
      return (characterId: string): CharacterActivity | null => {
        return store.activities()[characterId] || null;
      };
    }),

    // Great Vault progress calculations for all characters
    vaultProgressSummary: computed(() => {
      const activities = store.activities();
      const summary: Record<string, {
        characterId: string;
        mythicPlus: { slotsEarned: number; totalDungeons: number; highestKey: number };
        raid: { slotsEarned: number; totalBosses: number; difficulties: string[] };
        hasWorldBoss: boolean;
        sparkFragments: number;
        professionQuestsDone: number;
      }> = {};

      Object.values(activities).forEach(activity => {
        // M+ vault progress (1/4/8 dungeons for 1/2/3 slots)
        const mpSlots = calculateMythicPlusVaultSlots(activity.mythicPlus.dungeonCount);

        // Raid vault progress (2/4/6 bosses for 1/2/3 slots)
        const totalRaidBosses = activity.raid.normalBossesKilled +
                               activity.raid.heroicBossesKilled +
                               activity.raid.mythicBossesKilled;
        const raidSlots = calculateRaidVaultSlots(totalRaidBosses);

        // Determine available difficulties
        const difficulties: string[] = [];
        if (activity.raid.mythicBossesKilled > 0) difficulties.push('Mythic');
        if (activity.raid.heroicBossesKilled > 0) difficulties.push('Heroic');
        if (activity.raid.normalBossesKilled > 0) difficulties.push('Normal');

        summary[activity.characterId] = {
          characterId: activity.characterId,
          mythicPlus: {
            slotsEarned: mpSlots,
            totalDungeons: activity.mythicPlus.dungeonCount,
            highestKey: activity.mythicPlus.highestKeyLevel
          },
          raid: {
            slotsEarned: raidSlots,
            totalBosses: totalRaidBosses,
            difficulties
          },
          hasWorldBoss: activity.weeklyQuests.worldBossCompleted,
          sparkFragments: activity.weeklyQuests.sparkFragments,
          professionQuestsDone: activity.weeklyQuests.professionQuestsDone
        };
      });

      return summary;
    }),

    // Overall completion statistics
    weeklyCompletionStats: computed(() => {
      const activities = store.activities();
      const totalCharacters = Object.keys(activities).length;

      if (totalCharacters === 0) {
        return {
          totalCharacters: 0,
          averageVaultSlots: 0,
          completedWorldBosses: 0,
          totalSparkFragments: 0,
          completedProfessionQuests: 0
        };
      }

      let totalVaultSlots = 0;
      let completedWorldBosses = 0;
      let totalSparkFragments = 0;
      let completedProfessionQuests = 0;

      Object.values(activities).forEach(activity => {
        const mpSlots = calculateMythicPlusVaultSlots(activity.mythicPlus.dungeonCount);
        const totalBosses = activity.raid.normalBossesKilled +
                           activity.raid.heroicBossesKilled +
                           activity.raid.mythicBossesKilled;
        const raidSlots = calculateRaidVaultSlots(totalBosses);

        totalVaultSlots += mpSlots + raidSlots;

        if (activity.weeklyQuests.worldBossCompleted) completedWorldBosses++;
        totalSparkFragments += activity.weeklyQuests.sparkFragments;
        completedProfessionQuests += activity.weeklyQuests.professionQuestsDone;
      });

      return {
        totalCharacters,
        averageVaultSlots: Math.round((totalVaultSlots / totalCharacters) * 10) / 10,
        completedWorldBosses,
        totalSparkFragments,
        completedProfessionQuests
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
      const hoursUntilReset = Math.ceil((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      return {
        weekStart,
        weekEnd,
        daysUntilReset: Math.max(0, daysUntilReset),
        hoursUntilReset: Math.max(0, hoursUntilReset),
        isResetDay: daysUntilReset === 0 && hoursUntilReset <= 12 // Reset day buffer
      };
    }),

    // Loading states
    isLoading: computed(() => store.loading()),
    hasError: computed(() => !!store.error()),

    // Reset state computed properties
    resetStatus: computed(() => ({
      lastResetDate: store.lastResetDate(),
      isResetInProgress: store.isResetInProgress(),
      daysSinceReset: store.lastResetDate()
        ? Math.floor((Date.now() - store.lastResetDate()!.getTime()) / (1000 * 60 * 60 * 24))
        : null,
      hasRecentHistory: store.resetHistory().length > 0
    })),

    // Get reset history (limited to last 10 resets)
    recentResetHistory: computed(() => {
      return store.resetHistory()
        .sort((a, b) => b.resetDate.getTime() - a.resetDate.getTime())
        .slice(0, 10);
    }),

    // Check if character needs reset
    charactersNeedingReset: computed(() => {
      const activities = store.activities();
      const currentWeekStart = store.currentWeekStart();

      return Object.keys(activities).filter(characterId => {
        const activity = activities[characterId];
        return activity.weekStartDate.getTime() < currentWeekStart.getTime();
      });
    })
  })),

  // Add methods for state mutations
  withMethods((store) => {
    const storageService = inject(StorageService);
    const notificationService = inject(NotificationService);
    const resetService = inject(ResetService);
    const STORAGE_KEY = 'wow-activities';
    const RESET_HISTORY_KEY = 'wow-reset-history';

    const methods = {
    // Initialize activity for character
    initializeCharacterActivity: (characterId: string) => {
      const weekStart = store.currentWeekStart();
      const newActivity: CharacterActivity = {
        characterId,
        weekStartDate: weekStart,
        mythicPlus: {
          characterId,
          weekStartDate: weekStart,
          completed: false,
          lastUpdated: new Date(),
          dungeonCount: 0,
          highestKeyLevel: 0,
          runs: [],
          vaultProgress: {
            slot1: false,
            slot2: false,
            slot3: false
          }
        },
        raid: {
          characterId,
          weekStartDate: weekStart,
          completed: false,
          lastUpdated: new Date(),
          lfrBossesKilled: 0,
          normalBossesKilled: 0,
          heroicBossesKilled: 0,
          mythicBossesKilled: 0,
          vaultProgress: {
            slot1: false,
            slot2: false,
            slot3: false
          }
        },
        weeklyQuests: {
          characterId,
          weekStartDate: weekStart,
          completed: false,
          lastUpdated: new Date(),
          worldBossCompleted: false,
          sparkFragments: 0,
          professionQuestsDone: 0,
          weeklyEventCompleted: false
        },
        lastUpdated: new Date()
      };

      patchState(store, {
        activities: {
          ...store.activities(),
          [characterId]: newActivity
        }
      });

      methods.saveToLocalStorage();
    },

    // Add individual M+ run
    addMythicPlusRun: (characterId: string, run: MythicPlusRun): void => {
      const currentActivity = store.activities()[characterId];
      if (!currentActivity) {
        methods.initializeCharacterActivity(characterId);
        return methods.addMythicPlusRun(characterId, run);
      }

      const updatedRuns = [...currentActivity.mythicPlus.runs, run];
      const dungeonCount = updatedRuns.length;
      const highestKeyLevel = Math.max(...updatedRuns.map(r => r.keyLevel));

      const updatedMP = {
        ...currentActivity.mythicPlus,
        runs: updatedRuns,
        dungeonCount,
        highestKeyLevel,
        lastUpdated: new Date()
      };

      // Update vault progress based on dungeon count
      updatedMP.vaultProgress = {
        slot1: dungeonCount >= 1,
        slot2: dungeonCount >= 4,
        slot3: dungeonCount >= 8
      };

      const updatedActivity = {
        ...currentActivity,
        mythicPlus: updatedMP,
        lastUpdated: new Date()
      };

      patchState(store, {
        activities: {
          ...store.activities(),
          [characterId]: updatedActivity
        }
      });

      methods.saveToLocalStorage();

      // Show vault progress notification
      const slotsEarned = calculateMythicPlusVaultSlots(dungeonCount);
      notificationService.showVaultProgress('Mythic+', `${slotsEarned}/3 vault slots earned (${dungeonCount} dungeons)`);
    },

    // Update M+ activity
    updateMythicPlusActivity: (characterId: string, updates: Partial<MythicPlusActivity>) => {
      const currentActivity = store.activities()[characterId];
      if (!currentActivity) {
        methods.initializeCharacterActivity(characterId);
        return;
      }

      const updatedMP = {
        ...currentActivity.mythicPlus,
        ...updates,
        lastUpdated: new Date()
      };

      // Update vault progress based on dungeon count
      updatedMP.vaultProgress = {
        slot1: updatedMP.dungeonCount >= 1,
        slot2: updatedMP.dungeonCount >= 4,
        slot3: updatedMP.dungeonCount >= 8
      };

      const updatedActivity = {
        ...currentActivity,
        mythicPlus: updatedMP,
        lastUpdated: new Date()
      };

      patchState(store, {
        activities: {
          ...store.activities(),
          [characterId]: updatedActivity
        }
      });

      methods.saveToLocalStorage();

      // Show vault progress notification
      const slotsEarned = calculateMythicPlusVaultSlots(updatedMP.dungeonCount);
      notificationService.showVaultProgress('Mythic+', `${slotsEarned}/3 vault slots earned (${updatedMP.dungeonCount} dungeons)`);
    },

    // Update raid activity
    updateRaidActivity: (characterId: string, updates: Partial<RaidActivity>) => {
      const currentActivity = store.activities()[characterId];
      if (!currentActivity) {
        methods.initializeCharacterActivity(characterId);
        return;
      }

      const updatedRaid = {
        ...currentActivity.raid,
        ...updates,
        lastUpdated: new Date()
      };

      // Calculate total bosses and update vault progress
      const totalBosses = (updatedRaid.normalBossesKilled || 0) +
                         (updatedRaid.heroicBossesKilled || 0) +
                         (updatedRaid.mythicBossesKilled || 0);

      updatedRaid.vaultProgress = {
        slot1: totalBosses >= 2,
        slot2: totalBosses >= 4,
        slot3: totalBosses >= 6
      };

      const updatedActivity = {
        ...currentActivity,
        raid: updatedRaid,
        lastUpdated: new Date()
      };

      patchState(store, {
        activities: {
          ...store.activities(),
          [characterId]: updatedActivity
        }
      });

      methods.saveToLocalStorage();

      // Show vault progress notification
      const slotsEarned = calculateRaidVaultSlots(totalBosses);
      notificationService.showVaultProgress('Raid', `${slotsEarned}/3 vault slots earned (${totalBosses} bosses)`);
    },

    // Update weekly quests
    updateWeeklyQuests: (characterId: string, updates: Partial<WeeklyQuest>) => {
      const currentActivity = store.activities()[characterId];
      if (!currentActivity) {
        methods.initializeCharacterActivity(characterId);
        return;
      }

      const updatedQuests = {
        ...currentActivity.weeklyQuests,
        ...updates,
        lastUpdated: new Date()
      };

      const updatedActivity = {
        ...currentActivity,
        weeklyQuests: updatedQuests,
        lastUpdated: new Date()
      };

      patchState(store, {
        activities: {
          ...store.activities(),
          [characterId]: updatedActivity
        }
      });

      methods.saveToLocalStorage();

      // Show notification for weekly quest updates
      if (updates.worldBossCompleted) {
        notificationService.showActivityUpdated('World Boss completed');
      }
      if (updates.sparkFragments !== undefined) {
        notificationService.showActivityUpdated('Spark Fragments updated');
      }
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
        activities: store.activities(),
        currentWeekStart: store.currentWeekStart().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      const success = storageService.set(STORAGE_KEY, data);
      if (!success) {
        methods.setError('Failed to save activity data');
      }
    },

    // Async methods using rxMethod
    loadFromLocalStorage: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const validator = (data: unknown): data is { activities: Record<string, any>, currentWeekStart: string, lastUpdated: string } => {
            return typeof data === 'object' && data !== null &&
                   'activities' in data && typeof (data as any).activities === 'object' &&
                   'currentWeekStart' in data && typeof (data as any).currentWeekStart === 'string';
          };

          const data = storageService.getWithValidation(STORAGE_KEY, validator);

          if (data) {
            try {
              // Process activities and convert date strings back to Date objects
              const processedActivities: Record<string, CharacterActivity> = {};
              Object.entries(data.activities || {}).forEach(([charId, activity]: [string, any]) => {
                processedActivities[charId] = {
                  ...activity,
                  weekStartDate: new Date(activity.weekStartDate),
                  mythicPlus: {
                    ...activity.mythicPlus,
                    weekStartDate: new Date(activity.mythicPlus.weekStartDate),
                    lastUpdated: new Date(activity.mythicPlus.lastUpdated)
                  },
                  raid: {
                    ...activity.raid,
                    weekStartDate: new Date(activity.raid.weekStartDate),
                    lastUpdated: new Date(activity.raid.lastUpdated)
                  },
                  weeklyQuests: {
                    ...activity.weeklyQuests,
                    weekStartDate: new Date(activity.weeklyQuests.weekStartDate),
                    lastUpdated: new Date(activity.weeklyQuests.lastUpdated)
                  },
                  lastUpdated: new Date(activity.lastUpdated)
                };
              });

              patchState(store, {
                activities: processedActivities,
                currentWeekStart: new Date(data.currentWeekStart),
                loading: false,
                error: null
              });

              return of(processedActivities);
            } catch (error) {
              console.error('Failed to process stored activities:', error);
              patchState(store, {
                loading: false,
                error: 'Failed to process saved activities'
              });
              return of({});
            }
          } else {
            patchState(store, { loading: false, error: null });
            return of({});
          }
        })
      )
    ),

    // Weekly reset methods
    performWeeklyReset: () => {
      patchState(store, { isResetInProgress: true });

      try {
        const currentActivities = store.activities();
        const currentWeekStart = getWeekStartDate();
        const resetDate = new Date();

        // Preserve current week's data for history
        const preservedData = { ...currentActivities };

        // Reset all character activities for new week
        const resetActivities: Record<string, CharacterActivity> = {};
        Object.keys(currentActivities).forEach(characterId => {
          resetActivities[characterId] = createFreshWeeklyActivity(characterId, currentWeekStart);
        });

        // Create reset history entry
        const historyEntry = {
          resetDate,
          charactersReset: Object.keys(currentActivities),
          preservedData
        };

        // Update reset history (keep last 10 entries)
        const updatedHistory = [historyEntry, ...store.resetHistory()].slice(0, 10);

        // Update store state
        patchState(store, {
          activities: resetActivities,
          currentWeekStart,
          lastResetDate: resetDate,
          isResetInProgress: false,
          resetHistory: updatedHistory
        });

        // Save to storage
        methods.saveToLocalStorage();
        methods.saveResetHistory();

        // Notify user
        notificationService.showSuccess(
          `Weekly reset completed for ${Object.keys(currentActivities).length} characters`,
          'Weekly Reset'
        );

        console.log('Weekly reset completed successfully');

      } catch (error) {
        console.error('Weekly reset failed:', error);
        patchState(store, {
          isResetInProgress: false,
          error: 'Failed to perform weekly reset'
        });
        notificationService.showError('Failed to perform weekly reset');
      }
    },

    // Manual reset trigger
    triggerManualReset: () => {
      if (store.isResetInProgress()) {
        notificationService.showWarning('Reset already in progress');
        return;
      }

      methods.performWeeklyReset();
    },

    // Reset specific character
    resetCharacterActivity: (characterId: string) => {
      const currentWeekStart = store.currentWeekStart();
      const currentActivities = store.activities();

      if (!currentActivities[characterId]) {
        methods.initializeCharacterActivity(characterId);
        return;
      }

      const freshActivity = createFreshWeeklyActivity(characterId, currentWeekStart);

      patchState(store, {
        activities: {
          ...currentActivities,
          [characterId]: freshActivity
        }
      });

      methods.saveToLocalStorage();
      notificationService.showInfo(`Reset activity for character ${characterId}`);
    },

    // Historical data methods
    getCharacterHistoryForWeek: (characterId: string, weekStartDate: Date): CharacterActivity | null => {
      // Search through reset history for specific week
      const targetWeekTime = weekStartDate.getTime();

      for (const historyEntry of store.resetHistory()) {
        const preservedActivity = historyEntry.preservedData[characterId];
        if (preservedActivity && preservedActivity.weekStartDate.getTime() === targetWeekTime) {
          return preservedActivity;
        }
      }

      return null;
    },

    // Save/load reset history
    saveResetHistory: () => {
      const historyData = {
        resetHistory: store.resetHistory().map(entry => ({
          resetDate: entry.resetDate.toISOString(),
          charactersReset: entry.charactersReset,
          preservedData: Object.fromEntries(
            Object.entries(entry.preservedData).map(([charId, activity]) => [
              charId,
              {
                ...activity,
                weekStartDate: activity.weekStartDate.toISOString(),
                lastUpdated: activity.lastUpdated.toISOString(),
                mythicPlus: {
                  ...activity.mythicPlus,
                  weekStartDate: activity.mythicPlus.weekStartDate.toISOString(),
                  lastUpdated: activity.mythicPlus.lastUpdated.toISOString()
                },
                raid: {
                  ...activity.raid,
                  weekStartDate: activity.raid.weekStartDate.toISOString(),
                  lastUpdated: activity.raid.lastUpdated.toISOString()
                },
                weeklyQuests: {
                  ...activity.weeklyQuests,
                  weekStartDate: activity.weeklyQuests.weekStartDate.toISOString(),
                  lastUpdated: activity.weeklyQuests.lastUpdated.toISOString()
                }
              }
            ])
          )
        })),
        lastSaved: new Date().toISOString()
      };

      const success = storageService.set(RESET_HISTORY_KEY, historyData);
      if (!success) {
        console.warn('Failed to save reset history');
      }
    },

    loadResetHistory: () => {
      try {
        const data = storageService.get(RESET_HISTORY_KEY) as any;
        if (data && data.resetHistory) {
          const processedHistory = data.resetHistory.map((entry: any) => ({
            resetDate: new Date(entry.resetDate),
            charactersReset: entry.charactersReset,
            preservedData: Object.fromEntries(
              Object.entries(entry.preservedData).map(([charId, activity]: [string, any]) => [
                charId,
                {
                  ...activity,
                  weekStartDate: new Date(activity.weekStartDate),
                  lastUpdated: new Date(activity.lastUpdated),
                  mythicPlus: {
                    ...activity.mythicPlus,
                    weekStartDate: new Date(activity.mythicPlus.weekStartDate),
                    lastUpdated: new Date(activity.mythicPlus.lastUpdated)
                  },
                  raid: {
                    ...activity.raid,
                    weekStartDate: new Date(activity.raid.weekStartDate),
                    lastUpdated: new Date(activity.raid.lastUpdated)
                  },
                  weeklyQuests: {
                    ...activity.weeklyQuests,
                    weekStartDate: new Date(activity.weeklyQuests.weekStartDate),
                    lastUpdated: new Date(activity.weeklyQuests.lastUpdated)
                  }
                }
              ])
            )
          }));

          patchState(store, { resetHistory: processedHistory });
        }
      } catch (error) {
        console.error('Failed to load reset history:', error);
      }
    },

    // Listen to reset service events
    subscribeToResetEvents: rxMethod<void>(
      pipe(
        switchMap(() => resetService.resetEvent$),
        tap(() => {
          console.log('Reset event received from ResetService');
          methods.performWeeklyReset();
        }),
        catchError((error) => {
          console.error('Error handling reset event:', error);
          methods.setError('Failed to handle reset event');
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
      console.log('ActivityStore initialized');

      // Load reset history first
      store.loadResetHistory();

      // Check if weekly reset is needed
      const currentWeekStart = getWeekStartDate();
      if (store.currentWeekStart().getTime() !== currentWeekStart.getTime()) {
        store.performWeeklyReset();
      }

      // Auto-load from localStorage
      store.loadFromLocalStorage();

      // Subscribe to reset service events
      store.subscribeToResetEvents();

      console.log('ActivityStore reset integration complete');
    },
    onDestroy: () => {
      console.log('ActivityStore destroyed');
    }
  })
);

// Helper functions
function getWeekStartDate(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));

  // WoW reset is on Wednesday, so calculate Wednesday of current week
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2); // Wednesday is 2 days after Monday
  wednesday.setHours(0, 0, 0, 0); // Reset to start of day

  // If we haven't passed Wednesday yet, use last Wednesday
  if (now < wednesday) {
    wednesday.setDate(wednesday.getDate() - 7);
  }

  return wednesday;
}

function calculateMythicPlusVaultSlots(dungeonCount: number): number {
  if (dungeonCount >= 8) return 3;
  if (dungeonCount >= 4) return 2;
  if (dungeonCount >= 1) return 1;
  return 0;
}

function calculateRaidVaultSlots(bossCount: number): number {
  if (bossCount >= 6) return 3;
  if (bossCount >= 4) return 2;
  if (bossCount >= 2) return 1;
  return 0;
}

function createFreshWeeklyActivity(characterId: string, weekStartDate: Date): CharacterActivity {
  return {
    characterId,
    weekStartDate,
    mythicPlus: {
      characterId,
      weekStartDate,
      completed: false,
      lastUpdated: new Date(),
      dungeonCount: 0,
      highestKeyLevel: 0,
      runs: [],
      vaultProgress: {
        slot1: false,
        slot2: false,
        slot3: false
      }
    },
    raid: {
      characterId,
      weekStartDate,
      completed: false,
      lastUpdated: new Date(),
      lfrBossesKilled: 0,
      normalBossesKilled: 0,
      heroicBossesKilled: 0,
      mythicBossesKilled: 0,
      vaultProgress: {
        slot1: false,
        slot2: false,
        slot3: false
      }
    },
    weeklyQuests: {
      characterId,
      weekStartDate,
      completed: false,
      lastUpdated: new Date(),
      worldBossCompleted: false,
      sparkFragments: 0,
      professionQuestsDone: 0,
      weeklyEventCompleted: false
    },
    lastUpdated: new Date()
  };
}