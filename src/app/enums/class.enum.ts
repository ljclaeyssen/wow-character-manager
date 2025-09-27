export enum CharacterClass {
  Warrior = 'Warrior',
  Paladin = 'Paladin',
  Hunter = 'Hunter',
  Rogue = 'Rogue',
  Priest = 'Priest',
  DeathKnight = 'Death Knight',
  Shaman = 'Shaman',
  Mage = 'Mage',
  Warlock = 'Warlock',
  Monk = 'Monk',
  Druid = 'Druid',
  DemonHunter = 'Demon Hunter',
  Evoker = 'Evoker'
}

export enum Specialization {
  // Warrior
  Arms = 'Arms',
  Fury = 'Fury',
  ProtectionWarrior = 'Protection (Warrior)',

  // Paladin
  Holy = 'Holy',
  ProtectionPaladin = 'Protection (Paladin)',
  Retribution = 'Retribution',

  // Hunter
  BeastMastery = 'Beast Mastery',
  Marksmanship = 'Marksmanship',
  Survival = 'Survival',

  // Rogue
  Assassination = 'Assassination',
  Outlaw = 'Outlaw',
  Subtlety = 'Subtlety',

  // Priest
  Discipline = 'Discipline',
  HolyPriest = 'Holy (Priest)',
  Shadow = 'Shadow',

  // Death Knight
  Blood = 'Blood',
  FrostDK = 'Frost (Death Knight)',
  Unholy = 'Unholy',

  // Shaman
  Elemental = 'Elemental',
  Enhancement = 'Enhancement',
  Restoration = 'Restoration',

  // Mage
  Arcane = 'Arcane',
  Fire = 'Fire',
  FrostMage = 'Frost (Mage)',

  // Warlock
  Affliction = 'Affliction',
  Demonology = 'Demonology',
  Destruction = 'Destruction',

  // Monk
  Brewmaster = 'Brewmaster',
  Mistweaver = 'Mistweaver',
  Windwalker = 'Windwalker',

  // Druid
  Balance = 'Balance',
  Feral = 'Feral',
  Guardian = 'Guardian',
  RestorationDruid = 'Restoration (Druid)',

  // Demon Hunter
  Havoc = 'Havoc',
  Vengeance = 'Vengeance',

  // Evoker
  Devastation = 'Devastation',
  Preservation = 'Preservation',
  Augmentation = 'Augmentation'
}

export enum Role {
  Tank = 'Tank',
  Healer = 'Healer',
  DPS = 'DPS',
  Support = 'Support'
}

// Helper functions to get specializations by class
export function getSpecializationsByClass(characterClass: CharacterClass): Specialization[] {
  switch (characterClass) {
    case CharacterClass.Warrior:
      return [Specialization.Arms, Specialization.Fury, Specialization.ProtectionWarrior];
    case CharacterClass.Paladin:
      return [Specialization.Holy, Specialization.ProtectionPaladin, Specialization.Retribution];
    case CharacterClass.Hunter:
      return [Specialization.BeastMastery, Specialization.Marksmanship, Specialization.Survival];
    case CharacterClass.Rogue:
      return [Specialization.Assassination, Specialization.Outlaw, Specialization.Subtlety];
    case CharacterClass.Priest:
      return [Specialization.Discipline, Specialization.HolyPriest, Specialization.Shadow];
    case CharacterClass.DeathKnight:
      return [Specialization.Blood, Specialization.FrostDK, Specialization.Unholy];
    case CharacterClass.Shaman:
      return [Specialization.Elemental, Specialization.Enhancement, Specialization.Restoration];
    case CharacterClass.Mage:
      return [Specialization.Arcane, Specialization.Fire, Specialization.FrostMage];
    case CharacterClass.Warlock:
      return [Specialization.Affliction, Specialization.Demonology, Specialization.Destruction];
    case CharacterClass.Monk:
      return [Specialization.Brewmaster, Specialization.Mistweaver, Specialization.Windwalker];
    case CharacterClass.Druid:
      return [Specialization.Balance, Specialization.Feral, Specialization.Guardian, Specialization.RestorationDruid];
    case CharacterClass.DemonHunter:
      return [Specialization.Havoc, Specialization.Vengeance];
    case CharacterClass.Evoker:
      return [Specialization.Devastation, Specialization.Preservation, Specialization.Augmentation];
    default:
      return [];
  }
}

// Helper function to get role by specialization
export function getRoleBySpecialization(spec: Specialization): Role {
  switch (spec) {
    // Tank specs
    case Specialization.ProtectionWarrior:
    case Specialization.ProtectionPaladin:
    case Specialization.Blood:
    case Specialization.Brewmaster:
    case Specialization.Guardian:
    case Specialization.Vengeance:
      return Role.Tank;

    // Healer specs
    case Specialization.Holy:
    case Specialization.HolyPriest:
    case Specialization.Discipline:
    case Specialization.Restoration:
    case Specialization.Mistweaver:
    case Specialization.RestorationDruid:
    case Specialization.Preservation:
      return Role.Healer;

    // Support specs
    case Specialization.Augmentation:
      return Role.Support;

    // DPS specs (all others)
    default:
      return Role.DPS;
  }
}