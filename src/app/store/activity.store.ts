import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, catchError, of } from 'rxjs';

import {
  CharacterActivity,
  MythicPlusActivity,
  RaidActivity,
  WeeklyQuest
} from '../models/activity.model';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

interface ActivityState {
  activities: Record<string, CharacterActivity>; // keyed by characterId
  currentWeekStart: Date;
  loading: boolean;
  error: string | null;
}

export const ActivityStore = signalStore(
  { providedIn: 'root' },

  // Add state for activities by character
  withState<ActivityState>({
    activities: {},
    currentWeekStart: getWeekStartDate(),
    loading: false,
    error: null
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
    hasError: computed(() => !!store.error())
  })),

  // Add methods for state mutations
  withMethods((store) => {
    const storageService = inject(StorageService);
    const notificationService = inject(NotificationService);
    const STORAGE_KEY = 'wow-activities';

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

    // Weekly reset functionality
    performWeeklyReset: () => {
      const newWeekStart = getWeekStartDate();
      const activities = store.activities();

      // Reset all character activities for new week
      const resetActivities: Record<string, CharacterActivity> = {};

      Object.keys(activities).forEach(characterId => {
        // Initialize fresh activity for new week
        const newActivity: CharacterActivity = {
          characterId,
          weekStartDate: newWeekStart,
          mythicPlus: {
            characterId,
            weekStartDate: newWeekStart,
            completed: false,
            lastUpdated: new Date(),
            dungeonCount: 0,
            highestKeyLevel: 0,
            vaultProgress: { slot1: false, slot2: false, slot3: false }
          },
          raid: {
            characterId,
            weekStartDate: newWeekStart,
            completed: false,
            lastUpdated: new Date(),
            normalBossesKilled: 0,
            heroicBossesKilled: 0,
            mythicBossesKilled: 0,
            vaultProgress: { slot1: false, slot2: false, slot3: false }
          },
          weeklyQuests: {
            characterId,
            weekStartDate: newWeekStart,
            completed: false,
            lastUpdated: new Date(),
            worldBossCompleted: false,
            sparkFragments: 0,
            professionQuestsDone: 0,
            weeklyEventCompleted: false
          },
          lastUpdated: new Date()
        };

        resetActivities[characterId] = newActivity;
      });

      patchState(store, {
        activities: resetActivities,
        currentWeekStart: newWeekStart
      });

      methods.saveToLocalStorage();

      // Show weekly reset notification
      notificationService.showWeeklyReset();
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
    )
    };

    return methods;
  }),

  // Add lifecycle hooks
  withHooks({
    onInit: (store) => {
      console.log('ActivityStore initialized');

      // Check if weekly reset is needed
      const currentWeekStart = getWeekStartDate();
      if (store.currentWeekStart().getTime() !== currentWeekStart.getTime()) {
        store.performWeeklyReset();
      }

      // Auto-load from localStorage
      store.loadFromLocalStorage();
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