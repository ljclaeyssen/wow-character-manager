import { Race } from '../enums/race.enum';
import { Faction } from '../enums/faction.enum';
import { CharacterClass } from '../enums/class.enum';
import { Profession } from '../enums/profession.enum';

export interface Character {
  id: string;
  name: string;
  race: Race;
  faction: Faction;
  characterClass: CharacterClass;
  specialization: string;
  professions: Profession[]; // Max 2 professions
  server: string; // Required server/realm name for Blizzard API integration
  lastApiUpdateAt?: Date; // Last time character data was fetched from Raider.io API
  createdAt: Date;
  updatedAt: Date;
}