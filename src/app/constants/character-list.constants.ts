import { Faction } from '../enums/faction.enum';
import { CharacterClass } from '../enums/class.enum';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
}

export interface FilterOption {
  label: string;
  value: string | null;
}

export const CHARACTER_TABLE_COLUMNS: TableColumn[] = [
  { field: 'nameAndClass', header: '', sortable: false, filterable: false },
  { field: 'professions', header: '', sortable: false, filterable: false },
  { field: 'vaultProgress', header: '', sortable: false, filterable: false },
  { field: 'actions', header: '', sortable: false, filterable: false }
];

export const FACTION_FILTER_OPTIONS: FilterOption[] = [
  { label: 'All Factions', value: null },
  { label: 'Alliance', value: Faction.Alliance },
  { label: 'Horde', value: Faction.Horde }
];

export const CLASS_FILTER_OPTIONS: FilterOption[] = [
  { label: 'All Classes', value: null },
  ...Object.values(CharacterClass).map(cls => ({ label: cls, value: cls }))
];

export const PAGINATION_CONFIG = {
  DEFAULT_ROWS: 10,
  ROWS_PER_PAGE_OPTIONS: [5, 10, 20, 50]
} as const;

export const CLASS_COLORS: Record<CharacterClass, string> = {
  [CharacterClass.DeathKnight]: '#C41E3A',
  [CharacterClass.DemonHunter]: '#A330C9',
  [CharacterClass.Druid]: '#FF7C0A',
  [CharacterClass.Evoker]: '#33937F',
  [CharacterClass.Hunter]: '#AAD372',
  [CharacterClass.Mage]: '#3FC7EB',
  [CharacterClass.Monk]: '#00FF98',
  [CharacterClass.Paladin]: '#F48CBA',
  [CharacterClass.Priest]: '#FFFFFF',
  [CharacterClass.Rogue]: '#FFF468',
  [CharacterClass.Shaman]: '#0070DD',
  [CharacterClass.Warlock]: '#8788EE',
  [CharacterClass.Warrior]: '#C69B6D'
};

export const FACTION_SEVERITIES = {
  [Faction.Alliance]: 'info' as const,
  [Faction.Horde]: 'warning' as const
};

export const VAULT_PROGRESS_CONFIG = {
  MAX_SLOTS_PER_TYPE: 3,
  TOTAL_VAULT_SLOTS: 9,
  RAID_BOSSES_PER_SLOT: 3,
  DUNGEONS_PER_SLOT: 4,
  HONOR_PER_SLOT: 5000
} as const;