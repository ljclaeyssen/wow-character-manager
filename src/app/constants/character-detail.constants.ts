import { ActivityType } from '../enums/activity-type.enum';
import { Faction } from '../enums/faction.enum';
import { CharacterClass } from '../enums/class.enum';

export const CLASS_COLORS: Record<CharacterClass, string> = {
  [CharacterClass.DeathKnight]: '#C41E3A',
  [CharacterClass.DemonHunter]: '#A330C9',
  [CharacterClass.Druid]: '#FF7D0A',
  [CharacterClass.Evoker]: '#33937F',
  [CharacterClass.Hunter]: '#ABD473',
  [CharacterClass.Mage]: '#69CCF0',
  [CharacterClass.Monk]: '#00FF96',
  [CharacterClass.Paladin]: '#F58CBA',
  [CharacterClass.Priest]: '#FFFFFF',
  [CharacterClass.Rogue]: '#FFF569',
  [CharacterClass.Shaman]: '#0070DE',
  [CharacterClass.Warlock]: '#9482C9',
  [CharacterClass.Warrior]: '#C79C6E'
};

export const FACTION_COLORS = {
  [Faction.Alliance]: '#0078D4',
  [Faction.Horde]: '#C42128'
} as const;

export const FACTION_ICONS = {
  [Faction.Alliance]: 'factions_icon/Alliance_64.png',
  [Faction.Horde]: 'factions_icon/Horde_64.png'
} as const;

export const CLASS_ICONS: Record<CharacterClass, string> = {
  [CharacterClass.DeathKnight]: 'classes_icon/Warrior_Icon.gif', // Fallback - no DeathKnight icon available
  [CharacterClass.DemonHunter]: 'classes_icon/Rogue_Icon.gif', // Fallback - no DemonHunter icon available
  [CharacterClass.Druid]: 'classes_icon/Druid_Icon.gif',
  [CharacterClass.Evoker]: 'classes_icon/Classicon_evoker.png',
  [CharacterClass.Hunter]: 'classes_icon/Hunter_Icon.gif',
  [CharacterClass.Mage]: 'classes_icon/Mage_Icon.gif',
  [CharacterClass.Monk]: 'classes_icon/Class_monk.png',
  [CharacterClass.Paladin]: 'classes_icon/Paladin_Icon.gif',
  [CharacterClass.Priest]: 'classes_icon/Priest_Icon.gif',
  [CharacterClass.Rogue]: 'classes_icon/Rogue_Icon.gif',
  [CharacterClass.Shaman]: 'classes_icon/Shaman_Icon.gif',
  [CharacterClass.Warlock]: 'classes_icon/Warlock_Icon.gif',
  [CharacterClass.Warrior]: 'classes_icon/Warrior_Icon.gif'
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  [ActivityType.MythicPlusCompleted]: 'pi pi-compass',
  [ActivityType.RaidBossKilled]: 'pi pi-trophy',
  [ActivityType.PvPMatchCompleted]: 'pi pi-flag',
  [ActivityType.QuestCompleted]: 'pi pi-check-circle',
  [ActivityType.AchievementEarned]: 'pi pi-star',
  [ActivityType.ItemObtained]: 'pi pi-gift'
};

export const ACTIVITY_SEVERITIES: Record<ActivityType, 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast'> = {
  [ActivityType.MythicPlusCompleted]: 'info',
  [ActivityType.RaidBossKilled]: 'success',
  [ActivityType.PvPMatchCompleted]: 'danger',
  [ActivityType.QuestCompleted]: 'secondary',
  [ActivityType.AchievementEarned]: 'warning',
  [ActivityType.ItemObtained]: 'contrast'
};

export const VAULT_CONFIG = {
  TOTAL_SLOTS: 9,
  SLOTS_PER_TYPE: 3,
  RECENT_ACTIVITIES_LIMIT: 5
} as const;

export const TIME_PERIODS = {
  ONE_WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  ONE_HOUR_MS: 60 * 60 * 1000,
  ONE_MINUTE_MS: 60 * 1000
} as const;