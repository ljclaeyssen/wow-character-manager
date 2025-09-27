import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject, Observable, interval } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface ResetInfo {
  nextResetDate: Date;
  daysUntilReset: number;
  hoursUntilReset: number;
  minutesUntilReset: number;
  isResetDay: boolean;
  timeUntilResetMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResetService {
  private readonly resetSubject = new Subject<void>();
  private readonly lastResetCheck = signal<Date | null>(null);

  constructor() {
    // Check for reset on service initialization
    this.checkForReset();
  }

  /**
   * Observable that emits when a weekly reset occurs
   */
  get resetEvent$(): Observable<void> {
    return this.resetSubject.asObservable();
  }

  /**
   * Get the next Wednesday reset date (Europe timezone)
   */
  getNextResetDate(): Date {
    const now = new Date();

    // Get current Wednesday of this week
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday
    const daysUntilWednesday = (3 - dayOfWeek + 7) % 7; // Days until next Wednesday

    const nextWednesday = new Date(now);
    nextWednesday.setDate(now.getDate() + daysUntilWednesday);

    // Set to reset time (assume 10:00 AM Europe time)
    nextWednesday.setHours(10, 0, 0, 0);

    // If today is Wednesday and we haven't passed reset time, use today
    // Otherwise, use next Wednesday
    if (dayOfWeek === 3 && now.getHours() < 10) {
      const todayReset = new Date(now);
      todayReset.setHours(10, 0, 0, 0);
      return todayReset;
    } else if (daysUntilWednesday === 0) {
      // Today is Wednesday but after reset time, get next Wednesday
      nextWednesday.setDate(nextWednesday.getDate() + 7);
    }

    return nextWednesday;
  }

  /**
   * Get the most recent Wednesday reset date (Europe timezone)
   */
  getCurrentWeekResetDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Calculate days since last Wednesday
    const daysSinceWednesday = (dayOfWeek + 4) % 7; // 0 = Wednesday, 1 = Thursday, etc.

    const lastWednesday = new Date(now);
    lastWednesday.setDate(now.getDate() - daysSinceWednesday);
    lastWednesday.setHours(10, 0, 0, 0);

    // If today is Wednesday and we haven't passed reset time, use last week's Wednesday
    if (dayOfWeek === 3 && now.getHours() < 10) {
      lastWednesday.setDate(lastWednesday.getDate() - 7);
    }

    return lastWednesday;
  }

  /**
   * Get comprehensive reset information
   */
  getResetInfo(): ResetInfo {
    const now = new Date();
    const nextReset = this.getNextResetDate();
    const timeUntilResetMs = nextReset.getTime() - now.getTime();

    const daysUntilReset = Math.floor(timeUntilResetMs / (1000 * 60 * 60 * 24));
    const hoursUntilReset = Math.floor((timeUntilResetMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilResetMs % (1000 * 60 * 60)) / (1000 * 60));

    // Consider it reset day if it's within 2 hours of reset
    const isResetDay = timeUntilResetMs <= (2 * 60 * 60 * 1000) && timeUntilResetMs > 0;

    return {
      nextResetDate: nextReset,
      daysUntilReset: Math.max(0, daysUntilReset),
      hoursUntilReset: Math.max(0, hoursUntilReset),
      minutesUntilReset: Math.max(0, minutesUntilReset),
      isResetDay,
      timeUntilResetMs: Math.max(0, timeUntilResetMs)
    };
  }

  /**
   * Observable that provides real-time countdown information
   * Updates every minute
   */
  getResetCountdown$(): Observable<ResetInfo> {
    return interval(60000).pipe( // Update every minute
      startWith(0),
      map(() => this.getResetInfo())
    );
  }

  /**
   * Check if a reset has occurred since the last check
   */
  hasResetOccurred(lastVisit: Date): boolean {
    const currentWeekReset = this.getCurrentWeekResetDate();
    return lastVisit < currentWeekReset;
  }

  /**
   * Check if a reset has occurred since last service check
   * This is called internally and can trigger reset events
   */
  checkForReset(): boolean {
    const now = new Date();
    const currentWeekReset = this.getCurrentWeekResetDate();
    const lastCheck = this.lastResetCheck();

    if (lastCheck && lastCheck < currentWeekReset && now >= currentWeekReset) {
      // Reset has occurred since last check
      this.lastResetCheck.set(now);
      this.resetSubject.next();
      return true;
    }

    // Update last check time
    if (!lastCheck) {
      this.lastResetCheck.set(now);
    }

    return false;
  }

  /**
   * Manually trigger a reset event
   * Useful for testing or manual reset scenarios
   */
  triggerManualReset(): void {
    this.lastResetCheck.set(new Date());
    this.resetSubject.next();
  }

  /**
   * Get formatted time until reset string
   */
  getFormattedTimeUntilReset(): string {
    const resetInfo = this.getResetInfo();

    if (resetInfo.daysUntilReset > 0) {
      return `${resetInfo.daysUntilReset}d ${resetInfo.hoursUntilReset}h ${resetInfo.minutesUntilReset}m`;
    } else if (resetInfo.hoursUntilReset > 0) {
      return `${resetInfo.hoursUntilReset}h ${resetInfo.minutesUntilReset}m`;
    } else {
      return `${resetInfo.minutesUntilReset}m`;
    }
  }

  /**
   * Check if it's currently reset day and time
   */
  isCurrentlyResetTime(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hours = now.getHours();

    // Wednesday (day 3) between 10:00-12:00 (2 hour window)
    return dayOfWeek === 3 && hours >= 10 && hours < 12;
  }

  /**
   * Get days since last reset
   */
  getDaysSinceReset(): number {
    const now = new Date();
    const lastReset = this.getCurrentWeekResetDate();
    const timeDiff = now.getTime() - lastReset.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  /**
   * Compute if user should be notified about upcoming reset
   */
  shouldNotifyUpcomingReset(): boolean {
    const resetInfo = this.getResetInfo();

    // Notify if less than 24 hours until reset
    return resetInfo.timeUntilResetMs <= (24 * 60 * 60 * 1000);
  }

  /**
   * Get reset status message for UI display
   */
  getResetStatusMessage(): string {
    const resetInfo = this.getResetInfo();

    if (resetInfo.isResetDay) {
      return 'Weekly reset is happening soon!';
    } else if (resetInfo.daysUntilReset === 0) {
      return `Reset in ${resetInfo.hoursUntilReset}h ${resetInfo.minutesUntilReset}m`;
    } else if (resetInfo.daysUntilReset === 1) {
      return 'Reset tomorrow';
    } else {
      return `Reset in ${resetInfo.daysUntilReset} days`;
    }
  }

  /**
   * Subscribe to periodic reset checks (called from app initialization)
   */
  startPeriodicResetCheck(): void {
    // Check for reset every 30 minutes
    interval(30 * 60 * 1000).subscribe(() => {
      this.checkForReset();
    });
  }

  /**
   * Destroy the service and clean up subscriptions
   */
  destroy(): void {
    this.resetSubject.complete();
  }
}