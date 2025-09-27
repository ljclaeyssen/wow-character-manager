export enum ProfessionType {
  Gathering = 'Gathering',
  Crafting = 'Crafting'
}

export enum Profession {
  // Gathering Professions
  Mining = 'Mining',
  Herbalism = 'Herbalism',
  Skinning = 'Skinning',

  // Crafting Professions
  Blacksmithing = 'Blacksmithing',
  Leatherworking = 'Leatherworking',
  Tailoring = 'Tailoring',
  Jewelcrafting = 'Jewelcrafting',
  Enchanting = 'Enchanting',
  Engineering = 'Engineering',
  Alchemy = 'Alchemy',
  Inscription = 'Inscription'
}

// Helper function to get profession type
export function getProfessionType(profession: Profession): ProfessionType {
  switch (profession) {
    case Profession.Mining:
    case Profession.Herbalism:
    case Profession.Skinning:
      return ProfessionType.Gathering;

    case Profession.Blacksmithing:
    case Profession.Leatherworking:
    case Profession.Tailoring:
    case Profession.Jewelcrafting:
    case Profession.Enchanting:
    case Profession.Engineering:
    case Profession.Alchemy:
    case Profession.Inscription:
      return ProfessionType.Crafting;

    default:
      return ProfessionType.Crafting;
  }
}

// Helper function to get all gathering professions
export function getGatheringProfessions(): Profession[] {
  return [Profession.Mining, Profession.Herbalism, Profession.Skinning];
}

// Helper function to get all crafting professions
export function getCraftingProfessions(): Profession[] {
  return [
    Profession.Blacksmithing,
    Profession.Leatherworking,
    Profession.Tailoring,
    Profession.Jewelcrafting,
    Profession.Enchanting,
    Profession.Engineering,
    Profession.Alchemy,
    Profession.Inscription
  ];
}