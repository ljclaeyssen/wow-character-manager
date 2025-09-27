import { Profession, ProfessionType } from '../enums/profession.enum';

// Base profession interface
export interface ProfessionInfo {
  id: Profession;
  name: string;
  type: ProfessionType;
}

// Profession knowledge tracking
export interface ProfessionKnowledge {
  professionId: Profession;
  characterId: string;
  weekStartDate: Date;

  // Weekly quest progress
  weeklyQuestDone: boolean;

  // Harvesting points (for gathering professions only)
  harvestingPoints: number;
  harvestingCap: number; // Weekly cap - customizable per profession

  // One-time per expansion items
  collectiblesObtained: string[]; // IDs of collectible items obtained
  buyablesObtained: string[]; // IDs of buyable items obtained

  // Metadata
  lastUpdated: Date;
}

// Character profession combination
export interface CharacterProfession {
  characterId: string;
  profession: ProfessionInfo;
  knowledge: ProfessionKnowledge;

  // Additional character-specific profession data
  skillLevel: number; // Current skill level (1-100)
  maxSkillLevel: number; // Maximum skill level for current expansion

  // Profession specialization choices (if applicable)
  specializations: string[]; // Profession-specific specialization paths chosen

  lastUpdated: Date;
}

// Weekly profession progress summary
export interface WeeklyProfessionProgress {
  characterId: string;
  weekStartDate: Date;
  professions: CharacterProfession[]; // Max 2 professions per character

  // Summary stats
  totalKnowledgePointsEarned: number;
  questsCompleted: number;
  harvestingProgress: {
    [professionId: string]: {
      current: number;
      cap: number;
      percentage: number;
    };
  };

  lastUpdated: Date;
}