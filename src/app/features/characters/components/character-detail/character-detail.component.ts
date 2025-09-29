import { ChangeDetectionStrategy, Component, computed, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { Character } from '../../../../models/character.model';
import { ActivityStore } from '../../../../store/activity.store';
import { CharacterStore } from '../../../../store/character.store';
import { Faction } from '../../../../enums/faction.enum';
import { CharacterClass } from '../../../../enums/class.enum';
import { ActivityType } from '../../../../enums/activity-type.enum';
import {
  CLASS_COLORS,
  FACTION_COLORS,
  FACTION_ICONS,
  ACTIVITY_ICONS,
  ACTIVITY_SEVERITIES,
  VAULT_CONFIG,
  TIME_PERIODS
} from '../../../../constants/character-detail.constants';
import { CharacterOverviewCardComponent } from './character-overview-card/character-overview-card.component';

@Component({
  selector: 'wow-character-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    ChipModule,
    DividerModule,
    PanelModule,
    TooltipModule,
    CharacterOverviewCardComponent
  ],
  templateUrl: './character-detail.component.html',
  styleUrl: './character-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterDetailComponent implements OnInit {
  private readonly activityStore = inject(ActivityStore);
  private readonly characterStore = inject(CharacterStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Character signal - loaded from route
  readonly character = signal<Character | null>(null);

  // Current character computed for template
  protected readonly currentCharacter = computed(() => this.character());

  // Output events
  readonly editCharacter = output<Character>();
  readonly deleteCharacter = output<Character>();
  readonly closeDetail = output<void>();

  // Character activities computed
  protected readonly characterActivities = computed(() => {
    const character = this.character();
    if (!character) return [];

    const characterId = character.id;
    const characterActivity = this.activityStore.getActivityForCharacter()(characterId);

    // For now, return an empty array as we'll implement activity tracking later
    // This prevents the compilation errors
    return [];
  });

  // Vault progress computed
  protected readonly vaultProgress = computed(() => {
    const character = this.character();
    if (!character) return { mythicPlus: 0, raid: 0, pvp: 0, total: 0 };

    const characterId = character.id;
    const characterActivity = this.activityStore.getActivityForCharacter()(characterId);

    const progress = {
      raid: 0,
      mythicPlus: 0,
      pvp: 0,
      total: 0
    };

    // Calculate vault progress from CharacterActivity data
    if (characterActivity) {
      // Calculate raid vault slots (simplified for now)
      if (characterActivity.raid.vaultProgress.slot1) progress.raid = Math.max(progress.raid, 1);
      if (characterActivity.raid.vaultProgress.slot2) progress.raid = Math.max(progress.raid, 2);
      if (characterActivity.raid.vaultProgress.slot3) progress.raid = Math.max(progress.raid, 3);

      // Calculate M+ vault slots
      if (characterActivity.mythicPlus.vaultProgress.slot1) progress.mythicPlus = Math.max(progress.mythicPlus, 1);
      if (characterActivity.mythicPlus.vaultProgress.slot2) progress.mythicPlus = Math.max(progress.mythicPlus, 2);
      if (characterActivity.mythicPlus.vaultProgress.slot3) progress.mythicPlus = Math.max(progress.mythicPlus, 3);
    }

    progress.total = progress.raid + progress.mythicPlus + progress.pvp;
    return progress;
  });

  protected readonly vaultPercentage = computed(() => {
    return Math.round((this.vaultProgress().total / VAULT_CONFIG.TOTAL_SLOTS) * 100);
  });

  // Recent activities (last 5)
  protected readonly recentActivities = computed(() => {
    return this.characterActivities().slice(0, VAULT_CONFIG.RECENT_ACTIVITIES_LIMIT);
  });

  // Activity statistics
  protected readonly activityStats = computed(() => {
    const character = this.character();
    if (!character) return {
      totalActivities: 0,
      mythicPlusCompleted: 0,
      raidsCompleted: 0,
      pvpMatches: 0,
      weeklyCompleted: 0
    };

    const characterId = character.id;
    const characterActivity = this.activityStore.getActivityForCharacter()(characterId);

    const stats = {
      totalActivities: 0,
      mythicPlusCompleted: 0,
      raidsCompleted: 0,
      pvpMatches: 0,
      weeklyCompleted: 0
    };

    // Calculate stats from CharacterActivity data
    if (characterActivity) {
      stats.mythicPlusCompleted = characterActivity.mythicPlus.dungeonCount || 0;
      stats.raidsCompleted = (characterActivity.raid.normalBossesKilled || 0) +
                           (characterActivity.raid.heroicBossesKilled || 0) +
                           (characterActivity.raid.mythicBossesKilled || 0);
      stats.totalActivities = stats.mythicPlusCompleted + stats.raidsCompleted;
      stats.weeklyCompleted = stats.totalActivities;
    }

    return stats;
  });

  // Weekly progress for activities card
  protected readonly weeklyProgress = computed(() => {
    const character = this.character();
    if (!character) return { raidProgress: 0, mythicPlusProgress: 0, pvpProgress: 0 };

    const characterId = character.id;
    const characterActivity = this.activityStore.getActivityForCharacter()(characterId);

    if (!characterActivity) return { raidProgress: 0, mythicPlusProgress: 0, pvpProgress: 0 };

    const totalBossesKilled = (characterActivity.raid.lfrBossesKilled || 0) +
                             (characterActivity.raid.normalBossesKilled || 0) +
                             (characterActivity.raid.heroicBossesKilled || 0) +
                             (characterActivity.raid.mythicBossesKilled || 0);

    return {
      raidProgress: Math.round(totalBossesKilled / 8 * 100), // Assuming 8 bosses max
      mythicPlusProgress: Math.round((characterActivity.mythicPlus.dungeonCount || 0) / 8 * 100),
      pvpProgress: 0 // Not implemented yet
    };
  });


  ngOnInit(): void {
    // Get character ID from route parameter
    const characterId = this.route.snapshot.paramMap.get('id');
    if (characterId) {
      // Find character in store
      const character = this.characterStore.entities().find(c => c.id === characterId);
      if (character) {
        this.character.set(character);
      }
    }
  }

  protected onEditCharacter(): void {
    const character = this.character();
    if (character) {
      this.editCharacter.emit(character);
    }
  }

  protected onDeleteCharacter(): void {
    const character = this.character();
    if (character) {
      this.deleteCharacter.emit(character);
    }
  }

  protected onClose(): void {
    this.router.navigate(['/characters']);
  }

  protected getClassColor(characterClass: CharacterClass): string {
    return CLASS_COLORS[characterClass] || '#FFFFFF';
  }

  protected getFactionColor(faction: Faction): string {
    return FACTION_COLORS[faction];
  }

  protected getFactionIcon(faction: Faction): string {
    return FACTION_ICONS[faction];
  }

  protected getRaceDisplayName(race: string): string {
    return race.replace(/([A-Z])/g, ' $1').trim();
  }

  protected getActivityIcon(type: ActivityType): string {
    return ACTIVITY_ICONS[type] || 'pi pi-circle';
  }

  protected getActivitySeverity(type: ActivityType): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' {
    return ACTIVITY_SEVERITIES[type] || 'secondary';
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  protected formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInHours = Math.floor(diffInMs / TIME_PERIODS.ONE_HOUR_MS);
    const diffInDays = Math.floor(diffInMs / TIME_PERIODS.ONE_DAY_MS);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInMinutes = Math.floor(diffInMs / TIME_PERIODS.ONE_MINUTE_MS);
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
  }

}