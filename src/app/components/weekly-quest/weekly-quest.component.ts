import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

import { ActivityStore } from '../../store/activity.store';
import { ActivityService } from '../../services/activity.service';
import { Character } from '../../models/character.model';
import { Activity } from '../../models/activity.model';
import { ActivityType } from '../../enums/activity-type.enum';
import { Profession } from '../../enums/profession.enum';

interface WeeklyQuest {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  type: 'worldBoss' | 'spark' | 'profession' | 'event';
  profession?: Profession;
}

@Component({
  selector: 'wow-weekly-quest',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    CheckboxModule,
    ProgressBarModule,
    BadgeModule,
    TooltipModule,
    DividerModule,
    PanelModule,
    TagModule,
    MessageModule
  ],
  templateUrl: './weekly-quest.component.html',
  styleUrl: './weekly-quest.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeeklyQuestComponent {
  private readonly activityStore = inject(ActivityStore);
  private readonly activityService = inject(ActivityService);

  // Component inputs and outputs
  readonly selectedCharacter = input<Character | null>(null);
  readonly activityAdded = output<Activity>();

  // Store data
  protected readonly activities = this.activityStore.activities;
  protected readonly loading = this.activityStore.loading;

  // Weekly events (rotating content)
  protected readonly weeklyEvents = [
    'Timewalking Dungeons',
    'Mythic+ Bonus Event',
    'PvP Brawl',
    'Pet Battle Bonus Event',
    'Arena Skirmish Event'
  ];

  protected readonly currentWeekEvent = this.weeklyEvents[0]; // Would be dynamic in real app

  // Computed data for selected character
  protected readonly characterWeeklyQuests = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return null;

    const characterActivity = this.activities()[character.id];
    return characterActivity?.weeklyQuests || null;
  });

  // World Boss Progress
  protected readonly worldBossCompleted = computed(() => {
    const weeklyQuests = this.characterWeeklyQuests();
    return weeklyQuests?.worldBossCompleted || false;
  });

  // Spark Fragment Progress (every 2 weeks = 1 full spark)
  protected readonly sparkProgress = computed(() => {
    const weeklyQuests = this.characterWeeklyQuests();
    if (!weeklyQuests) return { current: 0, max: 2, percentage: 0 };

    const currentFragments = weeklyQuests.sparkFragments;

    return {
      current: currentFragments,
      max: 2,
      percentage: Math.round((currentFragments / 2) * 100)
    };
  });

  // Profession Quest Progress
  protected readonly professionQuestProgress = computed(() => {
    const character = this.selectedCharacter();
    const weeklyQuests = this.characterWeeklyQuests();
    if (!character || !weeklyQuests) return [];

    const completedQuests = weeklyQuests.professionQuestsDone;
    const totalQuests = character.professions.length;

    return character.professions.map((profession, index) => {
      return {
        profession,
        completed: index < completedQuests,
        name: `${profession} Knowledge Quest`,
        description: `Weekly profession quest for ${profession} knowledge points`
      };
    });
  });

  // Weekly Event Progress
  protected readonly weeklyEventCompleted = computed(() => {
    const weeklyQuests = this.characterWeeklyQuests();
    return weeklyQuests?.weeklyEventCompleted || false;
  });

  // Profession quest completion count
  protected readonly completedProfessionQuests = computed(() => {
    const progress = this.professionQuestProgress();
    return progress.filter(p => p.completed).length;
  });

  // Overall weekly progress
  protected readonly weeklyProgress = computed(() => {
    const character = this.selectedCharacter();
    if (!character) return { completed: 0, total: 0, percentage: 0 };

    const worldBoss = this.worldBossCompleted() ? 1 : 0;
    const spark = this.sparkProgress().current >= 1 ? 1 : 0;
    const professions = this.professionQuestProgress().filter(p => p.completed).length;
    const weeklyEvent = this.weeklyEventCompleted() ? 1 : 0;

    const completed = worldBoss + spark + professions + weeklyEvent;
    const total = 1 + 1 + character.professions.length + 1; // worldBoss + spark + professions + event

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  });

  // Methods
  protected onToggleWorldBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const isCompleted = currentActivity.weeklyQuests.worldBossCompleted;

    this.activityStore.updateWeeklyQuests(character.id, {
      worldBossCompleted: !isCompleted
    });
  }

  protected onToggleSparkQuest(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const currentFragments = currentActivity.weeklyQuests.sparkFragments;
    const newFragments = currentFragments >= 2 ? 0 : currentFragments + 1;

    this.activityStore.updateWeeklyQuests(character.id, {
      sparkFragments: newFragments
    });
  }

  protected onToggleProfessionQuest(profession: Profession): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const currentQuests = currentActivity.weeklyQuests.professionQuestsDone;
    const maxQuests = character.professions.length; // Each profession has 1 quest per week
    const newQuests = currentQuests >= maxQuests ? 0 : currentQuests + 1;

    this.activityStore.updateWeeklyQuests(character.id, {
      professionQuestsDone: newQuests
    });
  }

  protected onToggleWeeklyEvent(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const currentActivity = this.activityStore.activities()[character.id];
    if (!currentActivity) {
      this.activityStore.initializeCharacterActivity(character.id);
      return;
    }

    const isCompleted = currentActivity.weeklyQuests.weeklyEventCompleted;

    this.activityStore.updateWeeklyQuests(character.id, {
      weeklyEventCompleted: !isCompleted
    });
  }

  protected getCompletionSeverity(completed: boolean): 'success' | 'warn' {
    return completed ? 'success' : 'warn';
  }

  protected getProgressSeverity(percentage: number): 'success' | 'info' | 'warn' | 'danger' {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warn';
    return 'danger';
  }

  protected getProfessionIcon(profession: Profession): string {
    return `professions_icon/Ui_profession_${profession.toLowerCase()}.png`;
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Private helper methods
}