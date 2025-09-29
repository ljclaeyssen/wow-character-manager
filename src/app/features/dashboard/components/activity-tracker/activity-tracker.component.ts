import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { PanelModule } from 'primeng/panel';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';

import { Character } from '../../../../models/character.model';
import { VaultProgressCardComponent } from '../activity-cards/vault-progress-card/vault-progress-card.component';
import { ProfessionKnowledgeCardComponent, ProfessionQuest } from '../activity-cards/profession-knowledge-card/profession-knowledge-card.component';
import { WorldContentCardComponent } from '../activity-cards/world-content-card/world-content-card.component';
import { Profession } from '../../../../enums/profession.enum';
import { ActivityStore } from '../../../../store/activity.store';
import { ProfessionStore } from '../../../../store/profession.store';

@Component({
  selector: 'wow-activity-tracker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    PanelModule,
    ProgressBarModule,
    BadgeModule,
    ButtonModule,
    TooltipModule,
    DividerModule,
    TagModule,
    MessageModule,
    CheckboxModule,
    VaultProgressCardComponent,
    ProfessionKnowledgeCardComponent,
    WorldContentCardComponent
  ],
  templateUrl: './activity-tracker.component.html',
  styleUrl: './activity-tracker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityTrackerComponent {
  private readonly activityStore = inject(ActivityStore);
  private readonly professionStore = inject(ProfessionStore);

  // Component inputs
  readonly selectedCharacter = input<Character | null>(null);

  constructor() {
    // Initialize profession data when character changes
    effect(() => {
      const character = this.selectedCharacter();
      if (character) {
        // Initialize profession data if not exists
        this.initializeProfessionData(character);
      }
    });
  }

  // Computed data for display

  protected readonly nextResetDate = computed(() => {
    const now = new Date();
    const nextWednesday = new Date(now);
    nextWednesday.setUTCDate(now.getUTCDate() + ((3 - now.getUTCDay() + 7) % 7));
    nextWednesday.setUTCHours(15, 0, 0, 0); // Wednesday 15:00 UTC

    if (nextWednesday <= now) {
      nextWednesday.setUTCDate(nextWednesday.getUTCDate() + 7);
    }

    return nextWednesday;
  });

  protected readonly timeUntilReset = computed(() => {
    const resetDate = this.nextResetDate();
    const now = new Date();
    const timeDiff = resetDate.getTime() - now.getTime();

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  });

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date));
  }


  /**
   * Initialize profession data in store if not exists
   */
  private initializeProfessionData(character: Character): void {
    if (character.professions.length > 0) {
      const characterProfessions = this.professionStore.getCharacterProfessions()(character.id);
      if (characterProfessions.length === 0) {
        // Character has professions but they're not initialized in the store
        this.professionStore.initializeCharacterProfessions(character.id, character.professions);
      }
    }
  }


  // Profession quests data
  protected readonly professionQuests = computed((): ProfessionQuest[] => {
    const character = this.selectedCharacter();
    if (!character || !character.professions.length) return [];

    const characterProfessions = this.professionStore.getCharacterProfessions()(character.id);

    return character.professions.map(professionName => {
      const charProfession = characterProfessions.find(cp => cp.profession.id === professionName);
      return {
        profession: professionName as Profession,
        description: `Weekly ${professionName} knowledge quest`,
        completed: charProfession?.knowledge.weeklyQuestDone || false
      };
    });
  });

  // World content data
  protected readonly worldContentData = computed(() => {
    const character = this.selectedCharacter();
    if (!character) {
      return {
        worldBossCompleted: false,
        sparkQuestCompleted: false,
        weeklyEventCompleted: false,
        currentWeekEvent: 'Timewalking',
        allQuestsCompleted: false
      };
    }

    const characterActivity = this.activityStore.getActivityForCharacter()(character.id);
    const weeklyQuests = characterActivity?.weeklyQuests;

    const worldBossCompleted = weeklyQuests?.worldBossCompleted || false;
    const sparkQuestCompleted = (weeklyQuests?.sparkFragments || 0) > 0;
    const weeklyEventCompleted = weeklyQuests?.weeklyEventCompleted || false;
    const allQuestsCompleted = worldBossCompleted && sparkQuestCompleted && weeklyEventCompleted;

    return {
      worldBossCompleted,
      sparkQuestCompleted,
      weeklyEventCompleted,
      currentWeekEvent: 'Timewalking',
      allQuestsCompleted
    };
  });

  // All profession quests completed computed property
  protected readonly allProfessionQuestsCompleted = computed(() => {
    return this.professionQuests().every(q => q.completed);
  });

  // Event handlers for profession knowledge card
  protected onToggleProfessionQuest(profession: Profession): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const characterProfessions = this.professionStore.getCharacterProfessions()(character.id);
    const charProfession = characterProfessions.find(cp => cp.profession.id === profession);
    const currentState = charProfession?.knowledge.weeklyQuestDone || false;

    this.professionStore.updateWeeklyQuest(character.id, profession, !currentState);
  }

  // Event handlers for world content card
  protected onToggleWorldBoss(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const characterActivity = this.activityStore.getActivityForCharacter()(character.id);
    const currentState = characterActivity?.weeklyQuests?.worldBossCompleted || false;

    this.activityStore.updateWeeklyQuests(character.id, {
      worldBossCompleted: !currentState
    });
  }

  protected onToggleSparkQuest(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const characterActivity = this.activityStore.getActivityForCharacter()(character.id);
    const currentFragments = characterActivity?.weeklyQuests?.sparkFragments || 0;

    this.activityStore.updateWeeklyQuests(character.id, {
      sparkFragments: currentFragments > 0 ? 0 : 1
    });
  }

  protected onToggleWeeklyEvent(): void {
    const character = this.selectedCharacter();
    if (!character) return;

    const characterActivity = this.activityStore.getActivityForCharacter()(character.id);
    const currentState = characterActivity?.weeklyQuests?.weeklyEventCompleted || false;

    this.activityStore.updateWeeklyQuests(character.id, {
      weeklyEventCompleted: !currentState
    });
  }

}