import { Faction } from '../enums/faction.enum';
import { Race } from '../enums/race.enum';
import { CharacterClass } from '../enums/class.enum';
import { Profession } from '../enums/profession.enum';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface RaceOption extends DropdownOption {
  faction: Faction;
}

export interface SpecializationOption extends DropdownOption {
  characterClass: CharacterClass;
}

export interface ClassOption extends DropdownOption {
  availableRaces: Race[];
}

export const FACTION_OPTIONS: DropdownOption[] = [
  { label: 'Alliance', value: Faction.Alliance },
  { label: 'Horde', value: Faction.Horde }
];

export const RACE_OPTIONS: RaceOption[] = [
  // Alliance Races
  { label: 'Human', value: Race.Human, faction: Faction.Alliance },
  { label: 'Dwarf', value: Race.Dwarf, faction: Faction.Alliance },
  { label: 'Night Elf', value: Race.NightElf, faction: Faction.Alliance },
  { label: 'Gnome', value: Race.Gnome, faction: Faction.Alliance },
  { label: 'Draenei', value: Race.Draenei, faction: Faction.Alliance },
  { label: 'Worgen', value: Race.Worgen, faction: Faction.Alliance },
  { label: 'Void Elf', value: Race.VoidElf, faction: Faction.Alliance },
  { label: 'Lightforged Draenei', value: Race.LightforgedDraenei, faction: Faction.Alliance },
  { label: 'Dark Iron Dwarf', value: Race.DarkIronDwarf, faction: Faction.Alliance },
  { label: 'Kul Tiran', value: Race.KulTiran, faction: Faction.Alliance },
  { label: 'Mechagnome', value: Race.Mechagnome, faction: Faction.Alliance },
  { label: 'Dracthyr', value: Race.Dracthyr, faction: Faction.Alliance },

  // Horde Races
  { label: 'Orc', value: Race.Orc, faction: Faction.Horde },
  { label: 'Undead', value: Race.Undead, faction: Faction.Horde },
  { label: 'Tauren', value: Race.Tauren, faction: Faction.Horde },
  { label: 'Troll', value: Race.Troll, faction: Faction.Horde },
  { label: 'Blood Elf', value: Race.BloodElf, faction: Faction.Horde },
  { label: 'Goblin', value: Race.Goblin, faction: Faction.Horde },
  { label: 'Nightborne', value: Race.Nightborne, faction: Faction.Horde },
  { label: 'Highmountain Tauren', value: Race.HighmountainTauren, faction: Faction.Horde },
  { label: "Mag'har Orc", value: Race.MagharOrc, faction: Faction.Horde },
  { label: 'Zandalari Troll', value: Race.ZandalariTroll, faction: Faction.Horde },
  { label: 'Vulpera', value: Race.Vulpera, faction: Faction.Horde },
  { label: 'Dracthyr', value: Race.Dracthyr, faction: Faction.Horde }
];

export const CLASS_OPTIONS: ClassOption[] = [
  {
    label: 'Death Knight',
    value: CharacterClass.DeathKnight,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Draenei, Race.Worgen, Race.VoidElf, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.KulTiran, Race.Mechagnome,
      Race.Orc, Race.Undead, Race.Tauren, Race.Troll, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.HighmountainTauren, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  },
  {
    label: 'Demon Hunter',
    value: CharacterClass.DemonHunter,
    availableRaces: [Race.NightElf, Race.BloodElf]
  },
  {
    label: 'Druid',
    value: CharacterClass.Druid,
    availableRaces: [Race.NightElf, Race.Worgen, Race.KulTiran, Race.Tauren, Race.Troll, Race.HighmountainTauren, Race.ZandalariTroll]
  },
  {
    label: 'Evoker',
    value: CharacterClass.Evoker,
    availableRaces: [Race.Dracthyr]
  },
  {
    label: 'Hunter',
    value: CharacterClass.Hunter,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Draenei, Race.Worgen, Race.VoidElf, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.KulTiran, Race.Mechagnome,
      Race.Orc, Race.Undead, Race.Tauren, Race.Troll, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.HighmountainTauren, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  },
  {
    label: 'Mage',
    value: CharacterClass.Mage,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Draenei, Race.Worgen, Race.VoidElf, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.KulTiran, Race.Mechagnome,
      Race.Orc, Race.Undead, Race.Troll, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  },
  {
    label: 'Monk',
    value: CharacterClass.Monk,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Draenei, Race.VoidElf, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.KulTiran,
      Race.Orc, Race.Undead, Race.Tauren, Race.Troll, Race.BloodElf, Race.Nightborne, Race.HighmountainTauren, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  },
  {
    label: 'Paladin',
    value: CharacterClass.Paladin,
    availableRaces: [Race.Human, Race.Dwarf, Race.Draenei, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.BloodElf, Race.Tauren, Race.ZandalariTroll]
  },
  {
    label: 'Priest',
    value: CharacterClass.Priest,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Draenei, Race.Worgen, Race.VoidElf, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.KulTiran,
      Race.Undead, Race.Tauren, Race.Troll, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.HighmountainTauren, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  },
  {
    label: 'Rogue',
    value: CharacterClass.Rogue,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Worgen, Race.VoidElf, Race.DarkIronDwarf, Race.KulTiran, Race.Mechagnome,
      Race.Orc, Race.Undead, Race.Troll, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  },
  {
    label: 'Shaman',
    value: CharacterClass.Shaman,
    availableRaces: [Race.Dwarf, Race.Draenei, Race.DarkIronDwarf, Race.KulTiran, Race.Orc, Race.Tauren, Race.Troll, Race.Goblin, Race.HighmountainTauren, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera]
  },
  {
    label: 'Warlock',
    value: CharacterClass.Warlock,
    availableRaces: [Race.Human, Race.Gnome, Race.Worgen, Race.VoidElf, Race.DarkIronDwarf, Race.Orc, Race.Undead, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.MagharOrc, Race.Vulpera]
  },
  {
    label: 'Warrior',
    value: CharacterClass.Warrior,
    availableRaces: [
      Race.Human, Race.Dwarf, Race.NightElf, Race.Gnome, Race.Draenei, Race.Worgen, Race.VoidElf, Race.LightforgedDraenei, Race.DarkIronDwarf, Race.KulTiran, Race.Mechagnome,
      Race.Orc, Race.Undead, Race.Tauren, Race.Troll, Race.BloodElf, Race.Goblin, Race.Nightborne, Race.HighmountainTauren, Race.MagharOrc, Race.ZandalariTroll, Race.Vulpera
    ]
  }
];

export const SPECIALIZATION_OPTIONS: SpecializationOption[] = [
  // Death Knight
  { label: 'Blood', value: 'Blood', characterClass: CharacterClass.DeathKnight },
  { label: 'Frost', value: 'Frost', characterClass: CharacterClass.DeathKnight },
  { label: 'Unholy', value: 'Unholy', characterClass: CharacterClass.DeathKnight },

  // Demon Hunter
  { label: 'Havoc', value: 'Havoc', characterClass: CharacterClass.DemonHunter },
  { label: 'Vengeance', value: 'Vengeance', characterClass: CharacterClass.DemonHunter },

  // Druid
  { label: 'Balance', value: 'Balance', characterClass: CharacterClass.Druid },
  { label: 'Feral', value: 'Feral', characterClass: CharacterClass.Druid },
  { label: 'Guardian', value: 'Guardian', characterClass: CharacterClass.Druid },
  { label: 'Restoration', value: 'Restoration', characterClass: CharacterClass.Druid },

  // Evoker
  { label: 'Devastation', value: 'Devastation', characterClass: CharacterClass.Evoker },
  { label: 'Preservation', value: 'Preservation', characterClass: CharacterClass.Evoker },
  { label: 'Augmentation', value: 'Augmentation', characterClass: CharacterClass.Evoker },

  // Hunter
  { label: 'Beast Mastery', value: 'Beast Mastery', characterClass: CharacterClass.Hunter },
  { label: 'Marksmanship', value: 'Marksmanship', characterClass: CharacterClass.Hunter },
  { label: 'Survival', value: 'Survival', characterClass: CharacterClass.Hunter },

  // Mage
  { label: 'Arcane', value: 'Arcane', characterClass: CharacterClass.Mage },
  { label: 'Fire', value: 'Fire', characterClass: CharacterClass.Mage },
  { label: 'Frost', value: 'Frost', characterClass: CharacterClass.Mage },

  // Monk
  { label: 'Brewmaster', value: 'Brewmaster', characterClass: CharacterClass.Monk },
  { label: 'Mistweaver', value: 'Mistweaver', characterClass: CharacterClass.Monk },
  { label: 'Windwalker', value: 'Windwalker', characterClass: CharacterClass.Monk },

  // Paladin
  { label: 'Holy', value: 'Holy', characterClass: CharacterClass.Paladin },
  { label: 'Protection', value: 'Protection', characterClass: CharacterClass.Paladin },
  { label: 'Retribution', value: 'Retribution', characterClass: CharacterClass.Paladin },

  // Priest
  { label: 'Discipline', value: 'Discipline', characterClass: CharacterClass.Priest },
  { label: 'Holy', value: 'Holy', characterClass: CharacterClass.Priest },
  { label: 'Shadow', value: 'Shadow', characterClass: CharacterClass.Priest },

  // Rogue
  { label: 'Assassination', value: 'Assassination', characterClass: CharacterClass.Rogue },
  { label: 'Outlaw', value: 'Outlaw', characterClass: CharacterClass.Rogue },
  { label: 'Subtlety', value: 'Subtlety', characterClass: CharacterClass.Rogue },

  // Shaman
  { label: 'Elemental', value: 'Elemental', characterClass: CharacterClass.Shaman },
  { label: 'Enhancement', value: 'Enhancement', characterClass: CharacterClass.Shaman },
  { label: 'Restoration', value: 'Restoration', characterClass: CharacterClass.Shaman },

  // Warlock
  { label: 'Affliction', value: 'Affliction', characterClass: CharacterClass.Warlock },
  { label: 'Demonology', value: 'Demonology', characterClass: CharacterClass.Warlock },
  { label: 'Destruction', value: 'Destruction', characterClass: CharacterClass.Warlock },

  // Warrior
  { label: 'Arms', value: 'Arms', characterClass: CharacterClass.Warrior },
  { label: 'Fury', value: 'Fury', characterClass: CharacterClass.Warrior },
  { label: 'Protection', value: 'Protection', characterClass: CharacterClass.Warrior }
];

export const PROFESSION_OPTIONS: DropdownOption[] = [
  { label: 'Alchemy', value: Profession.Alchemy },
  { label: 'Blacksmithing', value: Profession.Blacksmithing },
  { label: 'Enchanting', value: Profession.Enchanting },
  { label: 'Engineering', value: Profession.Engineering },
  { label: 'Herbalism', value: Profession.Herbalism },
  { label: 'Inscription', value: Profession.Inscription },
  { label: 'Jewelcrafting', value: Profession.Jewelcrafting },
  { label: 'Leatherworking', value: Profession.Leatherworking },
  { label: 'Mining', value: Profession.Mining },
  { label: 'Skinning', value: Profession.Skinning },
  { label: 'Tailoring', value: Profession.Tailoring }
];


export const PROFESSION_CONSTRAINTS = {
  MAX_PROFESSIONS: 2
} as const;