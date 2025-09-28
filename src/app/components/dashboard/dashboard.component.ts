import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PanelModule } from 'primeng/panel';
import { SplitterModule } from 'primeng/splitter';
import { DataViewModule } from 'primeng/dataview';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';

import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { Activity, CharacterActivity } from '../../models/activity.model';
import { ActivityTrackerComponent } from '../activity-tracker/activity-tracker.component';
import { RaidProgressComponent } from '../raid-progress/raid-progress.component';
import { WeeklyQuestComponent } from '../weekly-quest/weekly-quest.component';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';

@Component({
  selector: 'wow-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    SplitterModule,
    DataViewModule,
    CardModule,
    TagModule,
    ButtonModule,
    ProgressBarModule,
    BadgeModule,
    TooltipModule,
    DividerModule,
    ActivityTrackerComponent,
    RaidProgressComponent,
    WeeklyQuestComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  protected readonly characterStore = inject(CharacterStore);
  private readonly activityStore = inject(ActivityStore);
  private readonly activityService = inject(ActivityService);
  private readonly router = inject(Router);

  // Component state
  protected readonly selectedCharacter = signal<Character | null>(null);

  // Store data
  protected readonly characters = this.characterStore.entities;
  protected readonly charactersLoading = this.characterStore.loading;
  protected readonly activities = this.activityStore.activities;
  protected readonly activitiesLoading = this.activityStore.loading;

  // Dashboard statistics
  protected readonly dashboardStats = computed(() => {
    const chars = this.characters();
    const acts = this.activities();

    if (chars.length === 0) {
      return {
        totalCharacters: 0,
        totalActivities: 0,
        averageVaultProgress: 0,
        charactersWithFullVault: 0,
        mostActiveCharacter: null
      };
    }

    // Calculate vault progress for each character
    const characterVaultProgress = chars.map(character => {
      const characterActivity = acts[character.id];
      if (!characterActivity) {
        return {
          character,
          vaultSlots: 0,
          activities: 0
        };
      }

      // Calculate M+ vault slots (1/4/8 dungeons for 1/2/3 slots)
      const mythicPlusSlots = characterActivity.mythicPlus.dungeonCount >= 8 ? 3 :
                             characterActivity.mythicPlus.dungeonCount >= 4 ? 2 :
                             characterActivity.mythicPlus.dungeonCount >= 1 ? 1 : 0;

      // Calculate raid vault slots (2/4/6 bosses for 1/2/3 slots)
      const totalBosses = characterActivity.raid.normalBossesKilled +
                         characterActivity.raid.heroicBossesKilled +
                         characterActivity.raid.mythicBossesKilled;

      const raidSlots = totalBosses >= 6 ? 3 :
                       totalBosses >= 4 ? 2 :
                       totalBosses >= 2 ? 1 : 0;

      const totalVaultSlots = raidSlots + mythicPlusSlots;
      const totalActivities = characterActivity.mythicPlus.dungeonCount + totalBosses +
                              (characterActivity.weeklyQuests.worldBossCompleted ? 1 : 0) +
                              characterActivity.weeklyQuests.professionQuestsDone +
                              (characterActivity.weeklyQuests.weeklyEventCompleted ? 1 : 0);

      return {
        character,
        vaultSlots: totalVaultSlots,
        activities: totalActivities
      };
    });

    const totalVaultSlots = characterVaultProgress.reduce((sum, cp) => sum + cp.vaultSlots, 0);
    const averageVaultProgress = Math.round((totalVaultSlots / (chars.length * 9)) * 100);
    const charactersWithFullVault = characterVaultProgress.filter(cp => cp.vaultSlots >= 9).length;

    // Find most active character this week
    const mostActiveCharacter = characterVaultProgress.reduce((prev, current) =>
      current.activities > prev.activities ? current : prev
    );

    return {
      totalCharacters: chars.length,
      totalActivities: characterVaultProgress.reduce((sum, cp) => sum + cp.activities, 0),
      averageVaultProgress,
      charactersWithFullVault,
      mostActiveCharacter: mostActiveCharacter.activities > 0 ? mostActiveCharacter.character : null
    };
  });

  // Enhanced character data with activity summaries
  protected readonly enhancedCharacters = computed(() => {
    const chars = this.characters();
    const acts = this.activities();

    return chars.map(character => {
      const characterActivity = acts[character.id];
      if (!characterActivity) {
        return {
          ...character,
          weeklyActivities: 0,
          vaultProgress: 0,
          vaultPercentage: 0,
          lastActivity: null
        };
      }

      // Calculate M+ vault slots (1/4/8 dungeons for 1/2/3 slots)
      const mythicPlusSlots = characterActivity.mythicPlus.dungeonCount >= 8 ? 3 :
                             characterActivity.mythicPlus.dungeonCount >= 4 ? 2 :
                             characterActivity.mythicPlus.dungeonCount >= 1 ? 1 : 0;

      // Calculate raid vault slots (2/4/6 bosses for 1/2/3 slots)
      const totalBosses = characterActivity.raid.normalBossesKilled +
                         characterActivity.raid.heroicBossesKilled +
                         characterActivity.raid.mythicBossesKilled;

      const raidSlots = totalBosses >= 6 ? 3 :
                       totalBosses >= 4 ? 2 :
                       totalBosses >= 2 ? 1 : 0;

      const totalVaultSlots = raidSlots + mythicPlusSlots;
      const vaultPercentage = Math.round((totalVaultSlots / 6) * 100); // Max 6 slots (3 M+ + 3 Raid)

      const totalActivities = characterActivity.mythicPlus.dungeonCount + totalBosses +
                              (characterActivity.weeklyQuests.worldBossCompleted ? 1 : 0) +
                              characterActivity.weeklyQuests.professionQuestsDone +
                              (characterActivity.weeklyQuests.weeklyEventCompleted ? 1 : 0);

      return {
        ...character,
        weeklyActivities: totalActivities,
        vaultProgress: totalVaultSlots,
        vaultPercentage,
        lastActivity: characterActivity.lastUpdated
      };
    }).sort((a, b) => b.vaultPercentage - a.vaultPercentage); // Sort by vault progress
  });

  // Component methods
  protected onCharacterSelect(character: Character): void {
    this.selectedCharacter.set(character);
  }

  protected onEditCharacter(character: Character): void {
    // Navigate to characters page - editing will be handled there
    // or emit an event if needed
  }

  protected viewCharacterDetails(character: Character): void {
    this.router.navigate(['/characters/detail', character.id]);
  }


  // Utility methods
  protected getFactionSeverity(faction: Faction): 'info' | 'warning' {
    return faction === Faction.Alliance ? 'info' : 'warning';
  }

  protected getClassColor(characterClass: CharacterClass): string {
    const colors: { [key in CharacterClass]: string } = {
      [CharacterClass.Warrior]: '#C69B6D',
      [CharacterClass.Paladin]: '#F48CBA',
      [CharacterClass.Hunter]: '#AAD372',
      [CharacterClass.Rogue]: '#FFF468',
      [CharacterClass.Priest]: '#FFFFFF',
      [CharacterClass.Shaman]: '#0070DD',
      [CharacterClass.Mage]: '#3FC7EB',
      [CharacterClass.Warlock]: '#8788EE',
      [CharacterClass.Monk]: '#00FF98',
      [CharacterClass.Druid]: '#FF7C0A',
      [CharacterClass.DemonHunter]: '#A330C9',
      [CharacterClass.DeathKnight]: '#C41E3A',
      [CharacterClass.Evoker]: '#33937F'
    };
    return colors[characterClass] || '#FFFFFF';
  }

  protected getVaultProgressSeverity(percentage: number): 'success' | 'info' | 'warning' | 'danger' {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'danger';
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }

  protected formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  }

  protected getNextResetTime(): string {
    const nextReset = this.activityService.getNextResetDate();
    const now = new Date();
    const diffMs = nextReset.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else {
      return `${diffHours}h`;
    }
  }
}