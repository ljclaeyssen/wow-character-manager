import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';

import { CharacterStore } from '../../store/character.store';
import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { CharacterActivity } from '../../models/activity.model';
import { Race } from '../../enums/race.enum';
import { Faction } from '../../enums/faction.enum';
import { CharacterClass } from '../../enums/class.enum';
import { Profession } from '../../enums/profession.enum';

interface CharacterSummary {
  id: string;
  name: string;
  race: Race;
  faction: Faction;
  characterClass: CharacterClass;
  specialization: string;
  professions: Profession[];

  // Activity Progress
  mythicPlusProgress: {
    dungeonCount: number;
    highestKey: number;
    vaultSlots: number;
    percentage: number;
  };

  raidProgress: {
    totalBosses: number;
    highestDifficulty: string;
    vaultSlots: number;
    percentage: number;
  };

  weeklyQuestProgress: {
    completed: number;
    total: number;
    percentage: number;
  };

  // Overall Progress
  overallCompletion: number;
  vaultSlotsTotal: number;
  lastActivity: Date | null;

  // Status
  isActive: boolean;
  weeklyGoalMet: boolean;
}

interface FilterOption {
  label: string;
  value: any;
}

@Component({
  selector: 'wow-summary-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ProgressBarModule,
    TagModule,
    BadgeModule,
    TooltipModule,
    MenuModule,
    CardModule,
    PanelModule,
    DividerModule,
    SelectModule,
    DatePickerModule,
    MultiSelectModule
  ],
  templateUrl: './summary-table.component.html',
  styleUrl: './summary-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryTableComponent {
  protected readonly characterStore = inject(CharacterStore);
  protected readonly activityStore = inject(ActivityStore);
  protected readonly activityService = inject(ActivityService);

  // Table state
  protected readonly globalFilterValue = signal('');
  protected readonly selectedCharacters = signal<CharacterSummary[]>([]);
  protected readonly loading = signal(false);
  protected readonly first = signal(0);
  protected readonly rows = signal(10);

  // Filter options
  protected readonly factionOptions: FilterOption[] = [
    { label: 'Alliance', value: Faction.Alliance },
    { label: 'Horde', value: Faction.Horde }
  ];

  protected readonly classOptions: FilterOption[] = Object.values(CharacterClass).map(cls => ({
    label: this.formatClassName(cls),
    value: cls
  }));

  protected readonly raceOptions: FilterOption[] = Object.values(Race).map(race => ({
    label: this.formatRaceName(race),
    value: race
  }));

  protected readonly difficultyOptions: FilterOption[] = [
    { label: 'LFR', value: 'LFR' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Heroic', value: 'Heroic' },
    { label: 'Mythic', value: 'Mythic' }
  ];

  // Store data
  protected readonly characters = this.characterStore.entities;
  protected readonly activities = this.activityStore.activities;
  protected readonly charactersLoading = this.characterStore.loading;
  protected readonly activitiesLoading = this.activityStore.loading;

  // Enhanced character data for table display
  protected readonly characterSummaries = computed((): CharacterSummary[] => {
    const chars = this.characters();
    const acts = this.activities();

    return chars.map(character => {
      const characterActivity = acts[character.id];

      // Calculate M+ progress
      const mythicPlusProgress = this.calculateMythicPlusProgress(characterActivity);

      // Calculate raid progress
      const raidProgress = this.calculateRaidProgress(characterActivity);

      // Calculate weekly quest progress
      const weeklyQuestProgress = this.calculateWeeklyQuestProgress(character, characterActivity);

      // Calculate overall completion
      const overallCompletion = this.calculateOverallCompletion(
        mythicPlusProgress.percentage,
        raidProgress.percentage,
        weeklyQuestProgress.percentage
      );

      // Determine if weekly goal is met (80% completion threshold)
      const weeklyGoalMet = overallCompletion >= 80;

      // Calculate total vault slots
      const vaultSlotsTotal = mythicPlusProgress.vaultSlots + raidProgress.vaultSlots;

      // Determine activity status
      const lastActivity = characterActivity?.lastUpdated || null;
      const isActive = this.isCharacterActive(lastActivity);

      return {
        id: character.id,
        name: character.name,
        race: character.race,
        faction: character.faction,
        characterClass: character.characterClass,
        specialization: character.specialization,
        professions: character.professions,
        mythicPlusProgress,
        raidProgress,
        weeklyQuestProgress,
        overallCompletion,
        vaultSlotsTotal,
        lastActivity,
        isActive,
        weeklyGoalMet
      };
    });
  });

  // Filtered and sorted data
  protected readonly filteredCharacters = computed(() => {
    const summaries = this.characterSummaries();
    const globalFilter = this.globalFilterValue().toLowerCase();

    if (!globalFilter) {
      return summaries;
    }

    return summaries.filter(char =>
      char.name.toLowerCase().includes(globalFilter) ||
      char.race.toLowerCase().includes(globalFilter) ||
      char.characterClass.toLowerCase().includes(globalFilter) ||
      char.specialization.toLowerCase().includes(globalFilter)
    );
  });

  // Statistics
  protected readonly tableStats = computed(() => {
    const summaries = this.characterSummaries();

    if (summaries.length === 0) {
      return {
        totalCharacters: 0,
        averageCompletion: 0,
        totalVaultSlots: 0,
        activeCharacters: 0,
        goalsMetCount: 0
      };
    }

    const totalCompletion = summaries.reduce((sum, char) => sum + char.overallCompletion, 0);
    const totalVaultSlots = summaries.reduce((sum, char) => sum + char.vaultSlotsTotal, 0);
    const activeCharacters = summaries.filter(char => char.isActive).length;
    const goalsMetCount = summaries.filter(char => char.weeklyGoalMet).length;

    return {
      totalCharacters: summaries.length,
      averageCompletion: Math.round(totalCompletion / summaries.length),
      totalVaultSlots,
      activeCharacters,
      goalsMetCount
    };
  });

  // Methods
  protected onGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.globalFilterValue.set(target.value);
  }

  protected onRowSelect(event: any): void {
    // Handle row selection
    console.log('Selected character:', event.data);
  }

  protected onRowUnselect(event: any): void {
    // Handle row deselection
    console.log('Unselected character:', event.data);
  }

  protected exportCSV(): void {
    const summaries = this.characterSummaries();
    const csvData = this.convertToCSV(summaries);
    this.downloadCSV(csvData, 'character-summary.csv');
  }

  protected exportSelected(): void {
    const selected = this.selectedCharacters();
    if (selected.length === 0) {
      return;
    }

    const csvData = this.convertToCSV(selected);
    this.downloadCSV(csvData, 'selected-characters.csv');
  }

  protected refreshData(): void {
    this.loading.set(true);
    // Simulate data refresh
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  // Progress calculation methods
  private calculateMythicPlusProgress(activity: CharacterActivity | undefined) {
    if (!activity?.mythicPlus) {
      return {
        dungeonCount: 0,
        highestKey: 0,
        vaultSlots: 0,
        percentage: 0
      };
    }

    const { dungeonCount, highestKeyLevel } = activity.mythicPlus;
    const vaultSlots = this.calculateMythicPlusSlots(dungeonCount);
    const percentage = Math.round((dungeonCount / 8) * 100); // 8 dungeons for max progress

    return {
      dungeonCount,
      highestKey: highestKeyLevel || 0,
      vaultSlots,
      percentage: Math.min(percentage, 100)
    };
  }

  private calculateRaidProgress(activity: CharacterActivity | undefined) {
    if (!activity?.raid) {
      return {
        totalBosses: 0,
        highestDifficulty: 'None',
        vaultSlots: 0,
        percentage: 0
      };
    }

    const { lfrBossesKilled, normalBossesKilled, heroicBossesKilled, mythicBossesKilled } = activity.raid;
    const totalBosses = (lfrBossesKilled || 0) + normalBossesKilled + heroicBossesKilled + mythicBossesKilled;

    const highestDifficulty = this.getHighestRaidDifficulty(activity.raid);
    const vaultSlots = this.calculateRaidSlots(totalBosses);
    const percentage = Math.round((totalBosses / 20) * 100); // Assuming 20 bosses for full progress

    return {
      totalBosses,
      highestDifficulty,
      vaultSlots,
      percentage: Math.min(percentage, 100)
    };
  }

  private calculateWeeklyQuestProgress(character: Character, activity: CharacterActivity | undefined) {
    if (!activity?.weeklyQuests) {
      return {
        completed: 0,
        total: this.getTotalWeeklyQuests(character),
        percentage: 0
      };
    }

    const { worldBossCompleted, sparkFragments, professionQuestsDone, weeklyEventCompleted } = activity.weeklyQuests;

    let completed = 0;
    if (worldBossCompleted) completed++;
    if (sparkFragments > 0) completed++;
    completed += professionQuestsDone;
    if (weeklyEventCompleted) completed++;

    const total = this.getTotalWeeklyQuests(character);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percentage
    };
  }

  private calculateOverallCompletion(mythicPercent: number, raidPercent: number, questPercent: number): number {
    // Weighted average: M+ 40%, Raids 40%, Quests 20%
    return Math.round((mythicPercent * 0.4) + (raidPercent * 0.4) + (questPercent * 0.2));
  }

  private calculateMythicPlusSlots(count: number): number {
    if (count >= 8) return 3;
    if (count >= 4) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  private calculateRaidSlots(count: number): number {
    if (count >= 6) return 3;
    if (count >= 4) return 2;
    if (count >= 2) return 1;
    return 0;
  }

  private getHighestRaidDifficulty(raid: any): string {
    if (raid.mythicBossesKilled > 0) return 'Mythic';
    if (raid.heroicBossesKilled > 0) return 'Heroic';
    if (raid.normalBossesKilled > 0) return 'Normal';
    if (raid.lfrBossesKilled > 0) return 'LFR';
    return 'None';
  }

  private getTotalWeeklyQuests(character: Character): number {
    // World boss (1) + Spark fragment (1) + Profession quests (2) + Weekly event (1)
    return 1 + 1 + character.professions.length + 1;
  }

  private isCharacterActive(lastActivity: Date | null): boolean {
    if (!lastActivity) return false;

    const now = new Date();
    const timeDiff = now.getTime() - new Date(lastActivity).getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);

    return daysDiff <= 7; // Active if updated within last week
  }

  // Utility methods
  protected getFactionSeverity(faction: Faction): 'info' | 'warn' {
    return faction === Faction.Alliance ? 'info' : 'warn';
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

  protected getProgressSeverity(percentage: number): 'success' | 'info' | 'warn' | 'danger' {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 40) return 'warn';
    return 'danger';
  }

  protected getVaultSlotSeverity(slots: number): 'success' | 'info' | 'warn' | 'danger' {
    if (slots >= 6) return 'success';
    if (slots >= 4) return 'info';
    if (slots >= 2) return 'warn';
    return 'danger';
  }

  protected formatClassName(className: CharacterClass): string {
    return className.replace(/([A-Z])/g, ' $1').trim();
  }

  protected formatRaceName(race: Race): string {
    return race.replace(/([A-Z])/g, ' $1').trim();
  }

  protected formatDate(date: Date | null): string {
    if (!date) return 'Never';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }

  protected formatRelativeTime(date: Date | null): string {
    if (!date) return 'Never';

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

  // CSV export methods
  private convertToCSV(data: CharacterSummary[]): string {
    const headers = [
      'Name', 'Race', 'Faction', 'Class', 'Specialization',
      'M+ Dungeons', 'M+ Highest Key', 'M+ Vault Slots',
      'Raid Bosses', 'Raid Difficulty', 'Raid Vault Slots',
      'Weekly Quests', 'Overall Completion %', 'Total Vault Slots',
      'Last Activity', 'Is Active', 'Goal Met'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(char => {
      const row = [
        `"${char.name}"`,
        `"${char.race}"`,
        `"${char.faction}"`,
        `"${char.characterClass}"`,
        `"${char.specialization}"`,
        char.mythicPlusProgress.dungeonCount,
        char.mythicPlusProgress.highestKey,
        char.mythicPlusProgress.vaultSlots,
        char.raidProgress.totalBosses,
        `"${char.raidProgress.highestDifficulty}"`,
        char.raidProgress.vaultSlots,
        `${char.weeklyQuestProgress.completed}/${char.weeklyQuestProgress.total}`,
        char.overallCompletion,
        char.vaultSlotsTotal,
        `"${this.formatDate(char.lastActivity)}"`,
        char.isActive ? 'Yes' : 'No',
        char.weeklyGoalMet ? 'Yes' : 'No'
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}