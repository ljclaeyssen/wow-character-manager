import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { CharacterStore } from '../../../../store/character.store';
import { ActivityStore } from '../../../../store/activity.store';
import { Character } from '../../../../models/character.model';
import { CharacterFormComponent } from '../character-form/character-form.component';
import { Faction } from '../../../../enums/faction.enum';
import { CharacterClass } from '../../../../enums/class.enum';
import { Race } from '../../../../enums/race.enum';
import {
  TableColumn,
  FilterOption,
  CHARACTER_TABLE_COLUMNS,
  FACTION_FILTER_OPTIONS,
  CLASS_FILTER_OPTIONS,
  PAGINATION_CONFIG,
  CLASS_COLORS,
  FACTION_SEVERITIES,
  VAULT_PROGRESS_CONFIG
} from '../../../../constants/character-list.constants';

@Component({
  selector: 'wow-character-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    TooltipModule,
    InputTextModule,
    CharacterFormComponent
  ],
  templateUrl: './character-list.component.html',
  styleUrl: './character-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterListComponent {
  private readonly characterStore = inject(CharacterStore);
  private readonly activityStore = inject(ActivityStore);
  private readonly router = inject(Router);

  // Output events
  readonly addCharacter = output<void>();
  readonly editCharacter = output<Character>();
  readonly characterSelected = output<Character>();

  // Table configuration
  protected readonly selectedCharacter = signal<Character | null>(null);

  // Character form state
  protected readonly showCharacterForm = signal(false);
  protected readonly editingCharacter = signal<Character | null>(null);

  // Pagination and filtering
  protected readonly globalFilterValue = signal<string>('');
  protected readonly first = signal<number>(0);
  protected readonly rows = signal<number>(10);

  // Filter options
  protected readonly factionOptions = FACTION_FILTER_OPTIONS;

  protected readonly classOptions = CLASS_FILTER_OPTIONS;

  // Table columns
  protected readonly columns = CHARACTER_TABLE_COLUMNS;

  // Data from stores
  protected readonly characters = this.characterStore.entities;
  protected readonly loading = this.characterStore.loading;
  protected readonly isEmpty = this.characterStore.isEmpty;

  // Enhanced character data with vault progress
  protected readonly enhancedCharacters = computed(() => {
    return this.characters().map(character => {
      const activity = this.activityStore.getActivityForCharacter()(character.id);
      const vaultSlots = this.calculateVaultSlots(activity);

      return {
        ...character,
        vaultProgress: vaultSlots,
        vaultPercentage: Math.round((vaultSlots.total / 9) * 100) // 9 is max vault slots
      };
    });
  });


  protected onCharacterSelect(character: Character): void {
    this.selectedCharacter.set(character);
    this.characterSelected.emit(character);
    // Navigation to character detail page disabled for now
    // this.router.navigate(['/characters/detail', character.id]);
  }

  protected onEditCharacter(character: Character): void {
    this.editingCharacter.set(character);
    this.showCharacterForm.set(true);
  }

  protected onDeleteCharacter(character: Character): void {
    this.characterStore.removeCharacter(character.id);
  }

  protected onAddCharacter(): void {
    this.editingCharacter.set(null);
    this.showCharacterForm.set(true);
  }

  protected onCharacterFormClose(): void {
    this.showCharacterForm.set(false);
    this.editingCharacter.set(null);
  }

  protected onCharacterSaved(): void {
    this.showCharacterForm.set(false);
    this.editingCharacter.set(null);
  }

  protected onGlobalFilter(event: any): void {
    const target = event.target as HTMLInputElement;
    this.globalFilterValue.set(target.value);
  }

  protected onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
  }

  protected getFactionSeverity(faction: Faction): 'info' | 'warning' {
    return FACTION_SEVERITIES[faction];
  }

  protected getClassColor(characterClass: CharacterClass): string {
    return CLASS_COLORS[characterClass] || '#FFFFFF';
  }

  protected getRaceDisplayName(race: Race): string {
    return race.replace(/([A-Z])/g, ' $1').trim();
  }

  protected getClassIcon(characterClass: CharacterClass): string {
    return `classes_icon/${characterClass}_Icon.gif`;
  }

  protected getProfessionIcon(profession: string): string {
    return `professions_icon/Ui_profession_${profession.toLowerCase()}.png`;
  }

  private calculateVaultSlots(activity: any): { raid: number; mythicPlus: number; pvp: number; total: number } {
    if (!activity) {
      return { raid: 0, mythicPlus: 0, pvp: 0, total: 0 };
    }

    // Calculate raid vault slots (0-3 based on bosses killed)
    const raidSlots = Math.min(VAULT_PROGRESS_CONFIG.MAX_SLOTS_PER_TYPE, Math.floor((activity.raidProgress?.currentTier?.bossesKilled || 0) / VAULT_PROGRESS_CONFIG.RAID_BOSSES_PER_SLOT));

    // Calculate M+ vault slots (0-3 based on dungeons completed)
    const mythicPlusSlots = Math.min(VAULT_PROGRESS_CONFIG.MAX_SLOTS_PER_TYPE, Math.floor((activity.mythicPlus?.dungeonCount || 0) / VAULT_PROGRESS_CONFIG.DUNGEONS_PER_SLOT));

    // Calculate PvP vault slots (0-3 based on honor/conquest)
    const pvpSlots = Math.min(VAULT_PROGRESS_CONFIG.MAX_SLOTS_PER_TYPE, Math.floor((activity.pvp?.honorEarned || 0) / VAULT_PROGRESS_CONFIG.HONOR_PER_SLOT));

    const total = raidSlots + mythicPlusSlots + pvpSlots;

    return {
      raid: raidSlots,
      mythicPlus: mythicPlusSlots,
      pvp: pvpSlots,
      total
    };
  }

  protected getItemLevelDisplay(character: Character): string {
    const ilvl = character.itemLevel;
    return ilvl && ilvl > 0 ? `${ilvl} iLvl` : '';
  }

  protected getRioScoreDisplay(character: Character): string {
    const rio = character.rioScore;
    return rio && rio > 0 ? `${Math.round(rio)} RIO` : '';
  }

  protected hasProgressionData(character: Character): boolean {
    return !!(character.itemLevel && character.itemLevel > 0) || !!(character.rioScore && character.rioScore > 0);
  }

}