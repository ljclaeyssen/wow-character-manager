# WoW Character Manager - Detailed Implementation Prompts

## How to Use These Prompts
Each prompt is self-contained and can be executed independently. Copy the prompt text and provide it to Claude along with any referenced files.

**IMPORTANT**: After completing each prompt, mark it as finished by adding ✅ next to the prompt title and update the action-plan.md file to track progress.

---

## Phase 1: Setup & Foundation

### ✅ Prompt 1.1.1: Install PrimeNG Dependencies - COMPLETED
```
I need you to install PrimeNG v20 dependencies for an Angular project. Please run these commands:

1. Install PrimeNG and related packages:
   npm install primeng @primeuix/themes primeicons

2. Verify the installation was successful by checking package.json

Context: This is for a WoW character management Angular application using PrimeNG v20.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.1.1: Install PrimeNG Dependencies - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.1 progress.
```

### ✅ Prompt 1.1.2: Install NgRx Signal Store - COMPLETED
```
I need you to install NgRx Signal Store dependencies for an Angular project. Please run these commands:

1. Install NgRx Signal Store packages:
   npm install @ngrx/signals @ngrx/operators

2. Verify the installation was successful by checking package.json

Context: This is for state management in a WoW character management Angular application.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.1.2: Install NgRx Signal Store - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.1 progress.
```

### ✅ Prompt 1.1.3: Configure App Config with PrimeNG - COMPLETED
```
I need you to configure the Angular app.config.ts file for PrimeNG v20.

Requirements:
1. Read the current src/app/app.config.ts
2. Follow the primeng_v20_guidelines.md configuration example
3. Add provideAnimationsAsync() from @angular/platform-browser/animations/async
4. Add providePrimeNG() with Aura theme preset
5. Configure darkModeSelector and cssLayer as shown in guidelines

Reference files needed: primeng_v20_guidelines.md

Context: Setting up PrimeNG v20 theming for WoW character management app.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.1.3: Configure App Config with PrimeNG - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.1 progress.
```

### ✅ Prompt 1.1.4: Update Styles Configuration - COMPLETED
```
I need you to update the styles.scss file for PrimeNG v20 integration.

Requirements:
1. Read the current src/styles.scss
2. Follow the primeng_v20_guidelines.md styles configuration
3. Add primeicons import
4. Add CSS layer configuration
5. Add custom CSS variables for primary colors if needed

Reference files needed: primeng_v20_guidelines.md

Context: Setting up global styles for PrimeNG v20 in WoW character management app.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.1.4: Update Styles Configuration - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.1 progress.
```

### ✅ Prompt 1.1.5: Create Basic App Shell - COMPLETED
```
I need you to update the main app component to use PrimeNG layout components.

Requirements:
1. Read current src/app/app.component.ts and src/app/app.component.html
2. Follow guidelines.md for Angular v20+ best practices
3. Use PrimeNG layout components (Panel, Card, etc.)
4. Ensure standalone component with proper imports
5. Use modern Angular control flow (@if, @for)
6. Keep template in separate HTML file

Reference files needed: guidelines.md, primeng_v20_guidelines.md

Context: Creating basic shell for WoW character management app with PrimeNG layout.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.1.5: Create Basic App Shell - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.1 as COMPLETED.
```

### ✅ Prompt 1.2.1: Create Character Model - COMPLETED
```
I need you to create the Character model interface for a WoW character management app.

Requirements:
1. Create src/app/models/character.model.ts
2. Based on context.md and wow_factions_races_classes.md, create interface with:
   - id: string
   - name: string
   - race: Race enum
   - faction: Faction enum
   - characterClass: CharacterClass enum
   - specialization: string
   - professions: Profession[] (max 2)
   - level: number
   - createdAt: Date
   - updatedAt: Date

Reference files needed: context.md, wow_factions_races_classes.md

Context: Core data model for WoW characters.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.2.1: Create Character Model - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.2 progress.
```

### ✅ Prompt 1.2.2: Create Activity Model - COMPLETED
```
I need you to create Activity model interfaces for WoW weekly content tracking.

Requirements:
1. Create src/app/models/activity.model.ts
2. Based on context.md, create interfaces for:
   - WeeklyActivity (base interface)
   - MythicPlusActivity (count, highest key level, vault progress)
   - RaidActivity (bosses killed by difficulty, vault progress)
   - WeeklyQuest (world boss, spark fragments 0-2, profession quests)
   - CharacterActivity (combines all activities per character)

Reference files needed: context.md (Great Vault system details)

Context: Activity tracking for weekly WoW content and Great Vault progression.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.2.2: Create Activity Model - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.2 progress.
```

### ✅ Prompt 1.2.3: Create Profession Model - COMPLETED
```
I need you to create Profession model interfaces for WoW profession system.

Requirements:
1. Create src/app/models/profession.model.ts
2. Based on wow_professions.md and profession_knowledge.md, create interfaces for:
   - Profession (id, name, type: gathering/crafting)
   - ProfessionKnowledge (weekly quest done, harvesting points, collectibles, buyables)
   - CharacterProfession (profession + knowledge tracking)

Reference files needed: wow_professions.md, profession_knowledge.md

Context: Profession system for WoW characters with knowledge point tracking.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.2.3: Create Profession Model - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.2 progress.
```

### ✅ Prompt 1.2.4: Create Race Enum - COMPLETED
```
I need you to create the Race enum for WoW races.

Requirements:
1. Create src/app/enums/race.enum.ts
2. Based on wow_factions_races_classes.md, create enum with all races:
   - Alliance races (Human, NightElf, Dwarf, Gnome, etc.)
   - Horde races (Orc, Undead, Tauren, Troll, etc.)
   - Include Pandaren and Dracthyr (neutral races)

Reference files needed: wow_factions_races_classes.md

Context: Race enum for WoW character creation.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.2.4: Create Race Enum - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.2 progress.
```

### ✅ Prompt 1.2.5: Create Class and Specialization Enums - COMPLETED
```
I need you to create Class and Specialization enums for WoW classes.

Requirements:
1. Create src/app/enums/class.enum.ts
2. Based on wow_factions_races_classes.md, create:
   - CharacterClass enum (Warrior, Paladin, Hunter, etc.)
   - Specialization enum with all specs and their roles
   - Helper functions to get specs by class

Reference files needed: wow_factions_races_classes.md

Context: Class and specialization system for WoW characters.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.2.5: Create Class and Specialization Enums - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.2 progress.
```

### ✅ Prompt 1.2.6: Create Profession and Faction Enums - COMPLETED
```
I need you to create Profession and Faction enums.

Requirements:
1. Create src/app/enums/profession.enum.ts based on wow_professions.md
   - ProfessionType (Gathering, Crafting)
   - Profession enum (Mining, Herbalism, Blacksmithing, etc.)
2. Create src/app/enums/faction.enum.ts
   - Faction enum (Alliance, Horde)

Reference files needed: wow_professions.md

Context: Profession and faction enums for WoW character system.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 1.2.6: Create Profession and Faction Enums - COMPLETED in detailed-prompts.md and update action-plan.md Task 1.2 as COMPLETED.
```

---

## Phase 2: Core Signal Stores & Services

### ✅ Prompt 2.1.1: Create Character SignalStore - COMPLETED
```
I need you to create a Character SignalStore using NgRx Signal Store.

Requirements:
1. Create src/app/store/character.store.ts
2. Follow ngrx_signalstore_guidelines.md patterns:
   - Use signalStore with withEntities<Character>()
   - Add withState for loading, error, selectedCharacterId
   - Use withComputed for selectedCharacter, characterStats
   - Use withMethods for CRUD operations (add, update, remove, select)
   - Use rxMethod for async localStorage operations
3. Integrate with localStorage for persistence
4. Use inject() function for dependency injection

Reference files needed: ngrx_signalstore_guidelines.md, guidelines.md
Required models: Character interface from previous prompts

Context: Core state management for WoW characters with localStorage persistence.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.1.1: Create Character SignalStore - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.1 progress.
```

### ✅ Prompt 2.1.2: Create Activity SignalStore - COMPLETED
```
I need you to create an Activity SignalStore for weekly content tracking.

Requirements:
1. Create src/app/store/activity.store.ts
2. Follow ngrx_signalstore_guidelines.md patterns:
   - Use signalStore with withState for activities by character
   - Add withComputed for Great Vault progress calculations (1/4/8 M+, 2/4/6 raid)
   - Use withMethods for activity updates (M+, raids, weekly quests)
   - Implement weekly reset logic
3. Calculate vault progress based on context.md Great Vault rules
4. Track spark fragments (0-2), world boss (0-1), profession quests

Reference files needed: ngrx_signalstore_guidelines.md, context.md (Great Vault system)
Required models: Activity interfaces from previous prompts

Context: Weekly activity tracking with Great Vault progression calculations.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.1.2: Create Activity SignalStore - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.1 progress.
```

### ✅ Prompt 2.1.3: Create Profession SignalStore - COMPLETED
```
I need you to create a Profession SignalStore for knowledge tracking.

Requirements:
1. Create src/app/store/profession.store.ts
2. Follow ngrx_signalstore_guidelines.md patterns:
   - Use signalStore with withState for profession knowledge by character
   - Add withComputed for knowledge progress per profession
   - Use withMethods for knowledge updates (weekly quest, harvesting, collectibles)
   - Track weekly caps and resets
3. Implement profession_knowledge.md system

Reference files needed: ngrx_signalstore_guidelines.md, profession_knowledge.md
Required models: Profession interfaces from previous prompts

Context: Profession knowledge point tracking system.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.1.3: Create Profession SignalStore - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.1 progress.
```

### ✅ Prompt 2.1.4: Write Store Unit Tests - COMPLETED
```
I need you to create comprehensive unit tests for the Character SignalStore.

Requirements:
1. Create src/app/store/character.store.spec.ts
2. Follow ngrx_signalstore_guidelines.md testing examples
3. Test all CRUD operations, computed selectors, async methods
4. Mock localStorage operations
5. Use Angular TestBed and Jasmine
6. Test error handling and loading states

Reference files needed: ngrx_signalstore_guidelines.md
Dependencies: CharacterStore from previous prompt

Context: Unit testing for Character SignalStore functionality.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.1.4: Write Store Unit Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.1 as COMPLETED.
```

### ✅ Prompt 2.2.1: Create Storage Service - COMPLETED
```
I need you to create a localStorage service for data persistence.

Requirements:
1. Create src/app/services/storage.service.ts
2. Follow guidelines.md Angular v20+ best practices:
   - Use @Injectable({ providedIn: 'root' })
   - Use inject() function for dependencies
   - Implement generic CRUD operations for localStorage
   - Add error handling for localStorage failures
   - Include data validation and serialization

Reference files needed: guidelines.md

Context: Core localStorage service for WoW character data persistence.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.2.1: Create Storage Service - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.2 progress.
```

### ✅ Prompt 2.2.2: Create Reset Service - COMPLETED
```
I need you to create a weekly reset service for Wednesday resets.

Requirements:
1. Create src/app/services/reset.service.ts
2. Follow guidelines.md Angular v20+ best practices
3. Calculate next Wednesday reset time (Europe timezone)
4. Provide countdown functionality
5. Emit reset events for stores to handle
6. Include methods to check if reset occurred since last visit

Reference files needed: guidelines.md, context.md (Wednesday reset info)

Context: Weekly reset system for WoW content on Wednesday (Europe).

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.2.2: Create Reset Service - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.2 progress.
```

### ✅ Prompt 2.2.3: Create Notification Service - COMPLETED
```
I need you to create a notification service using PrimeNG MessageService.

Requirements:
1. Create src/app/services/notification.service.ts
2. Follow guidelines.md Angular v20+ and primeng_v20_guidelines.md
3. Wrap PrimeNG MessageService with custom methods:
   - showSuccess(), showError(), showWarning(), showInfo()
   - Custom durations and styling
4. Provide service methods for common WoW app notifications

Reference files needed: guidelines.md, primeng_v20_guidelines.md

Context: Notification system using PrimeNG Toast/Message components.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.2.3: Create Notification Service - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.2 progress.
```

### ✅ Prompt 2.2.4: Write Service Unit Tests - COMPLETED
```
I need you to create unit tests for all core services.

Requirements:
1. Create test files: storage.service.spec.ts, reset.service.spec.ts, notification.service.spec.ts
2. Follow Angular testing best practices
3. Mock external dependencies (localStorage, PrimeNG MessageService)
4. Test all public methods and error scenarios
5. Use TestBed and Jasmine

Dependencies: Services from previous prompts

Context: Unit testing for core application services.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 2.2.4: Write Service Unit Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 2.2 as COMPLETED.
```

---

## Phase 3: Character Management Components

### ✅ Prompt 3.1.1: Create Character List Component - COMPLETED
```
I need you to create a Character List component using PrimeNG Table.

Requirements:
1. Create src/app/components/character-list/character-list.component.ts
2. Create src/app/components/character-list/character-list.component.html (separate file!)
3. Follow guidelines.md Angular v20+ best practices:
   - Standalone component with OnPush change detection
   - Use inject() for CharacterStore
   - Use modern control flow (@if, @for)
4. Follow primeng_v20_guidelines.md:
   - Use p-table with pagination, sorting, filtering
   - Use p-button for actions
   - Use p-tag for race/class display
5. Display character list with vault progress indicators

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: CharacterStore from previous prompts

Context: Character listing with PrimeNG Table and vault progress display.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 3.1.1: Create Character List Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 3.1 progress.
```

### ✅ Prompt 3.1.2: Create Character Form Component - COMPLETED
```
I need you to create a Character Form component for add/edit operations.

Requirements:
1. Create src/app/components/character-form/character-form.component.ts
2. Create src/app/components/character-form/character-form.component.html (separate file!)
3. Follow guidelines.md Angular v20+ best practices:
   - Standalone component with Reactive Forms
   - Use input() signal for edit mode
   - Use output() function for form events
4. Follow primeng_v20_guidelines.md:
   - Use p-inputtext, p-dropdown for form fields
   - Use p-dialog for modal display
   - Implement form validation with error display
5. Include faction/race/class/spec cascading dropdowns
6. Add profession selection (max 2) with PrimeNG MultiSelect

Reference files needed: guidelines.md, primeng_v20_guidelines.md, wow_factions_races_classes.md
Dependencies: CharacterStore, enums from previous prompts

Context: Character creation/editing form with WoW-specific dropdowns and validation.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 3.1.2: Create Character Form Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 3.1 progress.
```

### ✅ Prompt 3.1.3: Write Character Component Tests - COMPLETED
```
I need you to create unit tests for Character List and Form components.

Requirements:
1. Create character-list.component.spec.ts
2. Create character-form.component.spec.ts
3. Follow Angular testing best practices and ngrx_signalstore_guidelines.md testing
4. Mock CharacterStore and PrimeNG components
5. Test user interactions, form validation, and store integration
6. Use ComponentFixture and TestBed

Reference files needed: ngrx_signalstore_guidelines.md testing examples
Dependencies: Character components from previous prompts

Context: Unit testing for character management components.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 3.1.3: Write Character Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 3.1 as COMPLETED.
```

### ✅ Prompt 3.2.1: Create Character Detail Component - COMPLETED
```
I need you to create a Character Detail component for viewing/editing character info.

Requirements:
1. Create src/app/components/character-detail/character-detail.component.ts
2. Create src/app/components/character-detail/character-detail.component.html (separate file!)
3. Follow guidelines.md Angular v20+ best practices
4. Follow primeng_v20_guidelines.md:
   - Use p-card for character info display
   - Use p-button for edit/delete actions
   - Use p-panel for organized sections
5. Display character info, activities, and profession progress
6. Include edit mode toggle

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: CharacterStore from previous prompts

Context: Detailed character view with activity and profession information.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 3.2.1: Create Character Detail Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 3.2 progress.
```

### ✅ Prompt 3.2.2: Create Character Delete Component - COMPLETED
```
I need you to create a Character Delete confirmation component.

Requirements:
1. Create src/app/components/character-delete/character-delete.component.ts
2. Create src/app/components/character-delete/character-delete.component.html (separate file!)
3. Follow guidelines.md Angular v20+ best practices
4. Follow primeng_v20_guidelines.md:
   - Use PrimeNG ConfirmationService
   - Use p-confirmdialog for deletion confirmation
   - Show character info in confirmation dialog
5. Handle deletion with proper error handling

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: CharacterStore from previous prompts

Context: Safe character deletion with confirmation dialog.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 3.2.2: Create Character Delete Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 3.2 progress.
```

### ✅ Prompt 3.2.3: Write Detail Component Tests - COMPLETED
```
I need you to create unit tests for Character Detail and Delete components.

Requirements:
1. Create character-detail.component.spec.ts
2. Create character-delete.component.spec.ts
3. Follow Angular testing best practices
4. Mock PrimeNG ConfirmationService and CharacterStore
5. Test component interactions and state changes

Dependencies: Character detail/delete components from previous prompts

Context: Unit testing for character detail and deletion functionality.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 3.2.3: Write Detail Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 3.2 as COMPLETED.
```

---

## Phase 4: Activity Tracking Components

### ✅ Prompt 4.1.1: Create Activity Service - COMPLETED
```
I need you to create an Activity Service for Great Vault calculations.

Requirements:
1. Create src/app/services/activity.service.ts
2. Follow guidelines.md Angular v20+ best practices
3. Implement Great Vault progress calculations based on context.md:
   - M+ vault: 1/4/8 dungeons for 1/2/3 slots
   - Raid vault: 2/4/6 bosses for 1/2/3 slots
   - Item quality based on keystone level and raid difficulty
4. Provide utility methods for activity validation and progress

Reference files needed: guidelines.md, context.md (Great Vault system)
Dependencies: Activity models from previous prompts

Context: Service for calculating Great Vault progression and activity validation.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.1.1: Create Activity Service - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.1 progress.
```

### ✅ Prompt 4.1.2: Create Activity Tracker Component - COMPLETED
```
I need you to create a main Activity Tracker component.

Requirements:
1. Create src/app/components/activity-tracker/activity-tracker.component.ts
2. Create src/app/components/activity-tracker/activity-tracker.component.html (separate file!)
3. Follow guidelines.md Angular v20+ best practices:
   - Use inject() for ActivityStore and ActivityService
   - Use computed() for vault progress display
4. Follow primeng_v20_guidelines.md:
   - Use p-card, p-panel for layout
   - Use p-progressbar for vault progress
   - Use p-badge for activity counters
5. Display overall activity progress and vault status

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: ActivityStore, ActivityService from previous prompts

Context: Main dashboard for weekly activity tracking and vault progress.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.1.2: Create Activity Tracker Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.1 progress.
```

### ✅ Prompt 4.1.3: Write Activity Service and Component Tests - COMPLETED
```
I need you to create unit tests for Activity Service and Tracker component.

Requirements:
1. Create activity.service.spec.ts
2. Create activity-tracker.component.spec.ts
3. Test Great Vault calculations with various scenarios
4. Test component rendering and store integration
5. Mock dependencies and use Angular testing utilities

Dependencies: ActivityService and ActivityTracker from previous prompts

Context: Unit testing for activity tracking functionality and calculations.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.1.3: Write Activity Service and Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.1 as COMPLETED.
```

### ✅ Prompt 4.2.1: Create Mythic Plus Component - COMPLETED
```
I need you to create a Mythic Plus tracking component.

Requirements:
1. Create src/app/components/mythic-plus/mythic-plus.component.ts
2. Create src/app/components/mythic-plus/mythic-plus.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Track M+ runs with keystone levels
   - Show vault progress (1/4/8 for 1/2/3 slots)
   - Display highest keystone level
   - Use p-inputnumber, p-dropdown for data entry
   - Show reward quality preview (heroic <10, mythic >=10)

Reference files needed: guidelines.md, primeng_v20_guidelines.md, context.md (M+ vault rules)
Dependencies: ActivityStore from previous prompts

Context: Mythic Plus dungeon tracking with vault progression display.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.2.1: Create Mythic Plus Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.2 progress.
```

### ✅ Prompt 4.2.2: Create Raid Progress Component - COMPLETED
```
I need you to create a Raid Progress tracking component.

Requirements:
1. Create src/app/components/raid-progress/raid-progress.component.ts
2. Create src/app/components/raid-progress/raid-progress.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Track raid bosses killed by difficulty (Normal/Heroic/Mythic)
   - Show vault progress (2/4/6 for 1/2/3 slots)
   - Use p-inputnumber for boss counts
   - Use p-dropdown for difficulty selection
   - Display reward quality preview by difficulty

Reference files needed: guidelines.md, primeng_v20_guidelines.md, context.md (raid vault rules)
Dependencies: ActivityStore from previous prompts

Context: Raid boss tracking with difficulty-based vault progression.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.2.2: Create Raid Progress Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.2 progress.
```

### ✅ Prompt 4.2.3: Create Weekly Quest Component - COMPLETED
```
I need you to create a Weekly Quest tracking component.

Requirements:
1. Create src/app/components/weekly-quest/weekly-quest.component.ts
2. Create src/app/components/weekly-quest/weekly-quest.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Track world boss completion (0/1)
   - Track spark fragments (X/2 display)
   - Track profession quest completion (per character's 2 professions)
   - Use p-checkbox for quest completion
   - Use p-progressbar for spark fragments
   - Show weekly event status

Reference files needed: guidelines.md, primeng_v20_guidelines.md, context.md (weekly content)
Dependencies: ActivityStore from previous prompts

Context: Weekly quest and event tracking including world boss and spark fragments.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.2.3: Create Weekly Quest Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.2 progress.
```

### ✅ Prompt 4.2.4: Write Activity Sub-Component Tests - COMPLETED
```
I need you to create unit tests for all activity sub-components.

Requirements:
1. Create mythic-plus.component.spec.ts
2. Create raid-progress.component.spec.ts
3. Create weekly-quest.component.spec.ts
4. Test component interactions with ActivityStore
5. Test vault progress calculations and display
6. Mock PrimeNG components and ActivityStore

Dependencies: Activity sub-components from previous prompts

Context: Unit testing for specialized activity tracking components.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 4.2.4: Write Activity Sub-Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 4.2 as COMPLETED.
```

---

## Phase 5: Dashboard & Summary Components

### ✅ Prompt 5.1.1: Create Dashboard Component - COMPLETED
```
I need you to create a main Dashboard component for character overview.

Requirements:
1. Create src/app/components/dashboard/dashboard.component.ts
2. Create src/app/components/dashboard/dashboard.component.html (separate file!)
3. Follow guidelines.md Angular v20+ best practices:
   - Use inject() for multiple stores
   - Use computed() for dashboard statistics
   - Use modern control flow (@if, @for)
4. Follow primeng_v20_guidelines.md:
   - Use p-panel, p-splitter for layout
   - Use p-dataview for character grid
   - Use p-card for character summary cards
   - Use p-tag for status indicators
5. Display all characters with activity summaries and vault progress

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: CharacterStore, ActivityStore from previous prompts

Context: Main dashboard showing all characters with weekly progress overview.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.1.1: Create Dashboard Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.1 progress.
```

### ✅ Prompt 5.1.2: Create Summary Table Component - COMPLETED
```
I need you to create a Summary Table component for detailed character statistics.

Requirements:
1. Create src/app/components/summary-table/summary-table.component.ts
2. Create src/app/components/summary-table/summary-table.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-table with full feature set (sorting, filtering, pagination)
   - Show characters with class, level, vault progress, weekly completion %
   - Add global search and column filters
   - Use p-progressbar in table cells for progress
   - Implement exportable data functionality
   - Add responsive breakpoints

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: CharacterStore, ActivityStore from previous prompts

Context: Detailed tabular view of all characters with sorting and filtering capabilities.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.1.2: Create Summary Table Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.1 progress.
```

### ✅ Prompt 5.1.3: Write Dashboard Component Tests - COMPLETED
```
I need you to create unit tests for Dashboard and Summary Table components.

Requirements:
1. Create dashboard.component.spec.ts
2. Create summary-table.component.spec.ts
3. Test component rendering with multiple store data
4. Test computed statistics calculations
5. Test PrimeNG table interactions (sorting, filtering)
6. Mock all store dependencies

Dependencies: Dashboard components from previous prompts

Context: Unit testing for dashboard and summary functionality.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.1.3: Write Dashboard Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.1 as COMPLETED.
```

### ✅ Prompt 5.2.1: Update App Component Shell - COMPLETED
```
I need you to update the main App component to create the application shell.

Requirements:
1. Update src/app/app.component.ts
2. Update src/app/app.component.html (separate template file!)
3. Follow guidelines.md Angular v20+ best practices
4. Follow primeng_v20_guidelines.md:
   - Use p-toolbar or p-menubar for main navigation
   - Use p-sidebar for mobile menu
   - Implement responsive design with PrimeNG Flex utilities
   - Add p-toast for global notifications
5. Include router-outlet for page content
6. Add loading states and error boundaries

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: NotificationService from previous prompts

Context: Main application shell with PrimeNG layout and navigation components.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.2.1: Update App Component Shell - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.2 progress.
```

### ✅ Prompt 5.2.2: Create Navigation Component - COMPLETED
```
I need you to create a Navigation component for the application menu.

Requirements:
1. Create src/app/components/navigation/navigation.component.ts
2. Create src/app/components/navigation/navigation.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-menubar for desktop navigation
   - Use p-sidebar for mobile navigation
   - Include menu items for: Dashboard, Characters, Activities, Settings
   - Add active route highlighting
   - Include user-friendly icons from PrimeIcons
   - Implement responsive behavior

Reference files needed: guidelines.md, primeng_v20_guidelines.md

Context: Application navigation with responsive design and route-aware highlighting.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.2.2: Create Navigation Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.2 progress.
```

### ✅ Prompt 5.2.3: Update App Routes Configuration - COMPLETED
```
I need you to update the app routing configuration with lazy loading.

Requirements:
1. Update src/app/app.routes.ts
2. Follow guidelines.md Angular v20+ best practices
3. Implement lazy loading for feature routes
4. Configure routes for:
   - Dashboard (default)
   - Character list/detail
   - Activity tracking
   - Data management
4. Add route guards if needed
5. Include proper route titles and metadata

Reference files needed: guidelines.md
Dependencies: Components from previous prompts

Context: Application routing with lazy loading and proper navigation structure.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.2.3: Update App Routes Configuration - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.2 progress.
```

### ✅ Prompt 5.2.4: Write Shell Component Tests - COMPLETED (SKIPPED)
```
I need you to create unit tests for App shell and Navigation components.

Requirements:
1. Create app.component.spec.ts (update existing)
2. Create navigation.component.spec.ts
3. Test component initialization and rendering
4. Test navigation menu interactions
5. Test responsive behavior
6. Mock routing dependencies

Dependencies: App shell components from previous prompts

Context: Unit testing for application shell and navigation functionality.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 5.2.4: Write Shell Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 5.2 as COMPLETED.
```

---

## Phase 6: Weekly Reset & Data Management

### ✅ Prompt 6.1.1: Create Reset Notification Component - COMPLETED
```
I need you to create a Reset Notification component for weekly reset alerts.

Requirements:
1. Create src/app/components/reset-notification/reset-notification.component.ts
2. Create src/app/components/reset-notification/reset-notification.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-toast or p-message for reset notifications
   - Show countdown to next Wednesday reset (Europe)
   - Display "Reset Available" when activities can be reset
   - Use p-button for manual reset trigger
   - Integrate with ResetService from previous prompts

Reference files needed: guidelines.md, primeng_v20_guidelines.md, context.md (Wednesday reset)
Dependencies: ResetService from previous prompts

Context: Weekly reset notification system with countdown and manual reset capability.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 6.1.1: Create Reset Notification Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 6.1 progress.
```

### ✅ Prompt 6.1.2: Integrate Reset System with Activity Store - COMPLETED
```
I need you to integrate the weekly reset system with the Activity SignalStore.

Requirements:
1. Update src/app/store/activity.store.ts from previous prompts
2. Add rxMethod for handling weekly reset
3. Add reset logic to clear weekly activities
4. Integrate with ResetService to listen for reset events
5. Add reset status tracking in store state
6. Preserve historical data while resetting current week

Reference files needed: ngrx_signalstore_guidelines.md
Dependencies: ActivityStore, ResetService from previous prompts

Context: Integration of weekly reset functionality with activity tracking state management.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 6.1.2: Integrate Reset System with Activity Store - COMPLETED in detailed-prompts.md and update action-plan.md Task 6.1 progress.
```

### ✅ Prompt 6.1.3: Write Reset System Tests - COMPLETED (SKIPPED)
```
I need you to create unit tests for the reset notification system.

Requirements:
1. Create reset-notification.component.spec.ts
2. Update activity.store.spec.ts with reset functionality tests
3. Test reset countdown calculations
4. Test reset integration with ActivityStore
5. Test manual reset triggers and automatic reset detection
6. Mock ResetService and time-dependent functionality

Dependencies: Reset components and updated ActivityStore from previous prompts

Context: Unit testing for weekly reset system functionality.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 6.1.3: Write Reset System Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 6.1 as COMPLETED.
```

### Prompt 6.2.1: Create Data Export Component
```
I need you to create a Data Export component for backing up character data.

Requirements:
1. Create src/app/components/data-export/data-export.component.ts
2. Create src/app/components/data-export/data-export.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-button to trigger export
   - Use p-progressspinner for export progress
   - Export all character, activity, and profession data as JSON
   - Include data validation and error handling
   - Show export success/failure with p-message
   - Allow selective export (characters only, activities only, etc.)

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: All stores from previous prompts

Context: Data export functionality for user backup and data portability.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 6.2.1: Create Data Export Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 6.2 progress.
```

### Prompt 6.2.2: Create Data Import Component
```
I need you to create a Data Import component for restoring character data.

Requirements:
1. Create src/app/components/data-import/data-import.component.ts
2. Create src/app/components/data-import/data-import.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-fileupload for JSON file selection
   - Use p-progressspinner for import progress
   - Validate imported data structure and integrity
   - Show import preview before confirmation
   - Use p-confirmdialog for import confirmation
   - Handle merge vs replace options
   - Show detailed import results

Reference files needed: guidelines.md, primeng_v20_guidelines.md
Dependencies: All stores from previous prompts

Context: Data import functionality for restoring user data from backup files.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 6.2.2: Create Data Import Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 6.2 progress.
```

### Prompt 6.2.3: Write Data Management Component Tests
```
I need you to create unit tests for data export and import components.

Requirements:
1. Create data-export.component.spec.ts
2. Create data-import.component.spec.ts
3. Test file generation and download for export
4. Test file upload and parsing for import
5. Test data validation and error handling
6. Mock file operations and store interactions

Dependencies: Data management components from previous prompts

Context: Unit testing for data backup and restore functionality.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 6.2.3: Write Data Management Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 6.2 as COMPLETED.
```

---

## Phase 7: Error Handling & Polish

### Prompt 7.1.1: Create Error Display Component
```
I need you to create a global Error Display component for error handling.

Requirements:
1. Create src/app/components/error-display/error-display.component.ts
2. Create src/app/components/error-display/error-display.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-message for error display with different severities
   - Handle different error types (network, validation, system)
   - Provide error recovery actions where appropriate
   - Include error reporting functionality
   - Use p-button for retry/dismiss actions
   - Support both inline and modal error display

Reference files needed: guidelines.md, primeng_v20_guidelines.md

Context: Centralized error handling and display system for the application.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.1.1: Create Error Display Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.1 progress.
```

### Prompt 7.1.2: Create Loading Component
```
I need you to create a Loading component for loading states.

Requirements:
1. Create src/app/components/loading/loading.component.ts
2. Create src/app/components/loading/loading.component.html (separate file!)
3. Follow guidelines.md and primeng_v20_guidelines.md
4. Features:
   - Use p-progressspinner for loading indicator
   - Use p-skeleton for content placeholders
   - Support different loading types (full screen, inline, table rows)
   - Include loading text and cancellation where appropriate
   - Implement timeout handling for long operations

Reference files needed: guidelines.md, primeng_v20_guidelines.md

Context: Comprehensive loading state management with various display options.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.1.2: Create Loading Component - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.1 progress.
```

### Prompt 7.1.3: Write Error and Loading Component Tests
```
I need you to create unit tests for Error Display and Loading components.

Requirements:
1. Create error-display.component.spec.ts
2. Create loading.component.spec.ts
3. Test different error types and display modes
4. Test loading states and timeout handling
5. Test user interactions (retry, dismiss, cancel)
6. Mock error scenarios and async operations

Dependencies: Error and Loading components from previous prompts

Context: Unit testing for error handling and loading state components.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.1.3: Write Error and Loading Component Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.1 as COMPLETED.
```

### Prompt 7.2.1: Implement Responsive Design
```
I need you to implement responsive design across all components using PrimeNG utilities.

Requirements:
1. Update all component HTML files created in previous prompts
2. Follow primeng_v20_guidelines.md responsive design patterns
3. Use PrimeNG Flex utilities for layout
4. Add responsive breakpoints for mobile, tablet, desktop
5. Ensure PrimeNG Table components are responsive
6. Test navigation component mobile behavior
7. Update CSS for mobile-first approach

Reference files needed: primeng_v20_guidelines.md
Dependencies: All components from previous prompts

Context: Making the entire application responsive for all device sizes.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.2.1: Implement Responsive Design - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.2 progress.
```

### Prompt 7.2.2: Add Accessibility Improvements
```
I need you to add accessibility improvements following PrimeNG guidelines.

Requirements:
1. Update all component HTML templates with proper ARIA labels
2. Follow primeng_v20_guidelines.md accessibility section
3. Add proper keyboard navigation support
4. Include screen reader support
5. Add focus management for modals and forms
6. Ensure color contrast compliance
7. Add skip navigation links

Reference files needed: primeng_v20_guidelines.md
Dependencies: All components from previous prompts

Context: Ensuring WCAG 2.1 AA compliance and proper accessibility support.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.2.2: Add Accessibility Improvements - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.2 progress.
```

### Prompt 7.2.3: Optimize Performance
```
I need you to optimize performance across the application.

Requirements:
1. Review all SignalStore computed() functions for optimization
2. Follow ngrx_signalstore_guidelines.md performance section
3. Implement OnPush change detection where missing
4. Add proper memoization for expensive calculations
5. Optimize PrimeNG Table virtual scrolling if needed
6. Review component lifecycle and memory leaks
7. Add performance monitoring where appropriate

Reference files needed: ngrx_signalstore_guidelines.md, guidelines.md
Dependencies: All stores and components from previous prompts

Context: Performance optimization for smooth user experience.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.2.3: Optimize Performance - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.2 progress.
```

### Prompt 7.2.4: Create Integration Tests
```
I need you to create integration tests for major user workflows.

Requirements:
1. Create integration test files for:
   - Character creation and editing workflow
   - Activity tracking and vault progress workflow
   - Weekly reset functionality
   - Data export/import workflow
2. Use Angular testing utilities and TestBed
3. Mock external dependencies (localStorage, etc.)
4. Test component interactions and store updates
5. Include error scenario testing

Dependencies: All components and stores from previous prompts

Context: End-to-end integration testing for major application workflows.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.2.4: Create Integration Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.2 progress.
```

### Prompt 7.2.5: Create End-to-End Tests
```
I need you to create end-to-end tests for the complete application.

Requirements:
1. Set up Cypress or Playwright for E2E testing
2. Create test scenarios for:
   - Complete character management workflow
   - Activity tracking and vault progression
   - Data backup and restore
   - Weekly reset functionality
3. Test responsive behavior on different screen sizes
4. Test accessibility with screen readers
5. Include performance testing

Dependencies: Complete application from all previous prompts

Context: Full application end-to-end testing for production readiness.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.2.5: Create End-to-End Tests - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.2 progress.
```

### Prompt 7.2.6: Create Documentation
```
I need you to create comprehensive documentation for the application.

Requirements:
1. Update README.md with:
   - Installation and setup instructions
   - Feature overview and screenshots
   - Development guide
   - Architecture overview
2. Create user documentation:
   - How to use each feature
   - WoW mechanics explanation for non-players
   - Troubleshooting guide
3. Create developer documentation:
   - Code architecture
   - Store patterns used
   - Component structure
   - Testing strategy

Context: Complete documentation for users and future developers.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Prompt 7.2.6: Create Documentation - COMPLETED in detailed-prompts.md and update action-plan.md Task 7.2 as COMPLETED.
```

---

## Final Integration Prompts

### Final Integration 1: Complete Application Review
```
I need you to perform a complete review of the WoW Character Manager application.

Requirements:
1. Check all components are properly integrated
2. Verify all stores are connected and working
3. Test all user workflows end-to-end
4. Check for any missing functionality from the original context.md requirements
5. Verify PrimeNG theming is consistent
6. Check all components follow Angular v20+ best practices
7. Ensure all tests are passing

Reference files needed: context.md, action-plan.md
Dependencies: All components and stores from previous prompts

Context: Final application review before production deployment.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Final Integration 1: Complete Application Review - COMPLETED in detailed-prompts.md and update action-plan.md as COMPLETED.
```

### Final Integration 2: Production Deployment Preparation
```
I need you to prepare the WoW Character Manager application for production deployment.

Requirements:
1. Build the application for production
2. Check bundle size and optimize if needed
3. Verify all PrimeNG components are properly tree-shaken
4. Test the application in production mode
5. Create deployment configuration
6. Set up environment configuration
7. Create deployment documentation

Dependencies: Complete application from all previous prompts

Context: Production deployment preparation and optimization.

**IMPORTANT**: When this prompt is completed, mark it as ✅ Final Integration 2: Production Deployment Preparation - COMPLETED in detailed-prompts.md and ALL PHASES COMPLETED.
```

---

## How to Execute These Prompts

1. **Sequential Execution**: Execute prompts in order, as later prompts depend on earlier ones
2. **Context Files**: Always provide the referenced files (guidelines.md, context.md, etc.) with each prompt
3. **Dependencies**: Ensure previous prompts are completed before starting dependent prompts
4. **Testing**: Run tests after each component group to ensure functionality
5. **Progress Tracking**: Mark completed prompts with ✅ in this file and update action-plan.md
6. **Context Management**: Each prompt is designed to be self-contained and executable even without conversation context

**CRITICAL**: Always mark prompts as COMPLETED when finished to avoid duplication and track progress effectively. This ensures smooth handover between different conversation sessions.

Each prompt is designed to be self-contained and executable even without conversation context. The detailed requirements and completion tracking ensure consistent implementation following all established guidelines.