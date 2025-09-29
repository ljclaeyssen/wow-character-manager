# Helper Services

This folder contains reusable helper services that provide common functionality across the application.

## RaiderIoMapperHelper

A helper service for mapping Raider.IO API data to our application models.

### Usage Examples

```typescript
import { RaiderIoMapperHelper } from './services/helpers/raider-io-mapper.helper';

@Component({...})
export class SomeComponent {
  private readonly mapper = inject(RaiderIoMapperHelper);
  private readonly raiderIoService = inject(RaiderIoApiService);

  // Example: Create character from API profile
  createCharacterFromApi(profile: RaiderIoCharacterProfile) {
    const character = this.mapper.mapProfileToCharacter(
      profile,
      [Profession.Mining, Profession.Blacksmithing], // user-selected professions
      { server: 'Stormrage' } // any overrides
    );

    this.characterStore.addCharacter(character);
  }

  // Example: Update existing character with fresh API data
  refreshCharacterFromApi(character: Character) {
    this.raiderIoService.getCharacterProfile('eu', character.server, character.name)
      .subscribe(profile => {
        const updatedCharacter = this.mapper.updateCharacterWithApiData(character, profile);
        this.characterStore.updateCharacter(character.id, updatedCharacter);
      });
  }

  // Example: Check if character data needs refresh
  checkDataFreshness(profile: RaiderIoCharacterProfile) {
    const isRecent = this.mapper.isApiDataRecent(profile, 12); // 12 hours threshold
    const description = this.mapper.getDataFreshnessDescription(profile);

    console.log(`Data is ${isRecent ? 'recent' : 'stale'}: ${description}`);
  }

  // Example: Get character stats
  displayCharacterStats(profile: RaiderIoCharacterProfile) {
    const stats = this.mapper.getCharacterStats(profile);
    console.log(`Item Level: ${stats.itemLevel}, M+ Score: ${stats.mythicPlusScore}`);
  }

  // Example: Get just progression data
  checkProgression(profile: RaiderIoCharacterProfile) {
    const progression = this.mapper.getCharacterProgression(profile);
    console.log(`iLvl: ${progression.itemLevel}, RIO: ${progression.rioScore}`);
  }
}
```

### Available Methods

#### Core Mapping
- `mapProfileToCharacter()` - Convert API profile to Character model
- `updateCharacterWithApiData()` - Update existing character with API data

#### Individual Field Mapping
- `mapFactionFromApi()` - Convert API faction string to Faction enum
- `mapRaceFromApi()` - Convert API race string to Race enum
- `mapClassFromApi()` - Convert API class string to CharacterClass enum

#### Utility Methods
- `getCharacterStats()` - Extract useful stats from profile (ilvl, rio score, achievements, etc.)
- `getCharacterProgression()` - Get just item level and RIO score
- `isApiDataRecent()` - Check if data is within threshold
- `getDataFreshnessDescription()` - Human-readable freshness status

### Benefits

1. **Reusable** - Use across multiple components/services
2. **Centralized** - One place for all API mapping logic
3. **Testable** - Easy to unit test mapping logic
4. **Maintainable** - Single source of truth for API transformations
5. **Extensible** - Easy to add new mapping methods as needed