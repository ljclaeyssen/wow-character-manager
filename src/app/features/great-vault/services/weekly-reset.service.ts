import { Injectable } from '@angular/core';
import { WeeklyReset } from '../models/great-vault.model';

@Injectable({
  providedIn: 'root'
})
export class WeeklyResetService {

  /**
   * Get current weekly reset information
   */
  getCurrentWeeklyReset(): WeeklyReset {
    const now = new Date();
    const currentWeekStart = this.getWeekStartDate(now);
    const previousWeekStart = this.getWeekStartDate(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
    const nextWeekStart = this.getWeekStartDate(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000));

    const timeUntilReset = nextWeekStart.getTime() - now.getTime();
    const daysUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
    const hoursUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      previousWeekStart,
      currentWeekStart,
      nextWeekStart,
      daysUntilReset: Math.max(0, daysUntilReset),
      hoursUntilReset: Math.max(0, hoursUntilReset)
    };
  }

  /**
   * Check if a date is within the current week
   */
  isDateInCurrentWeek(date: Date): boolean {
    const weekStart = this.getCurrentWeeklyReset().currentWeekStart;
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    return date >= weekStart && date < weekEnd;
  }

  /**
   * Get the start date of the WoW week (Wednesday reset)
   */
  private getWeekStartDate(referenceDate: Date = new Date()): Date {
    const date = new Date(referenceDate);
    const day = date.getDay();

    // Calculate how many days to subtract to get to Wednesday
    // Wednesday = 3, so we want to go back to the most recent Wednesday
    let daysToSubtract = (day + 4) % 7; // Convert Sunday=0 to Wednesday=0 based system

    // If it's Wednesday and before 15:00 UTC (typical reset time), use current Wednesday
    // Otherwise, use the next Wednesday
    if (day === 3 && date.getUTCHours() >= 15) {
      daysToSubtract = 0;
    } else if (day > 3 || (day === 3 && date.getUTCHours() < 15)) {
      daysToSubtract = day - 3;
    } else {
      daysToSubtract = day + 4;
    }

    const wednesday = new Date(date);
    wednesday.setUTCDate(date.getUTCDate() - daysToSubtract);
    wednesday.setUTCHours(15, 0, 0, 0); // 15:00 UTC reset time

    return wednesday;
  }

  /**
   * Format time until reset as human readable string
   */
  formatTimeUntilReset(reset: WeeklyReset): string {
    if (reset.daysUntilReset > 0) {
      return `${reset.daysUntilReset}d ${reset.hoursUntilReset}h`;
    } else {
      return `${reset.hoursUntilReset}h`;
    }
  }

  /**
   * Get reset information for a specific date
   */
  getWeeklyResetForDate(date: Date): WeeklyReset {
    const weekStart = this.getWeekStartDate(date);
    const previousWeek = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const timeUntilReset = nextWeek.getTime() - date.getTime();
    const daysUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
    const hoursUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return {
      previousWeekStart: previousWeek,
      currentWeekStart: weekStart,
      nextWeekStart: nextWeek,
      daysUntilReset: Math.max(0, daysUntilReset),
      hoursUntilReset: Math.max(0, hoursUntilReset)
    };
  }
}