# WoW Character Manager - Context & Todo List

## Project Objective
Angular application using localStorage to manage World of Warcraft characters with their daily and weekly activities.

## Main Features

### Character Management
- **Basic Information**: Name, Race, Class, Specialization
- **Professions**: Character professions/crafting skills
- **CRUD Operations**: Add, edit, delete characters

### Activity Tracking
- **Daily/Weekly Content**:
  - Number of M+ (Mythic+) completed
  - Number of raid bosses killed
  - World bosses
  - Weekly quests
  - Weekly profession knowledge points

### User Interface
- **Summary Page**: Overview of all characters
- **Summary Table**: Global statistics
- **Activity Interface**: Manage activities per character

## Detailed Todo List

### Phase 1: Basic Structure
1. Create TypeScript models (Character, Activity, Profession)
2. Define enums for Race, Class, Specialization
3. Create localStorage service for data persistence
4. Implement character management service

### Phase 2: Character CRUD Interface
5. Create character list component
6. Create character add form
7. Create character edit form
8. Implement deletion with confirmation

### Phase 3: Activity Management
9. Create activity tracking component
10. Implement counters for M+, raids, world bosses
11. Add weekly quest management
12. Add profession knowledge tracking

### Phase 4: Summary Interface
13. Create dashboard/summary page
14. Implement summary table
15. Add global statistics
16. Create charts/visualizations (optional)

### Phase 5: Enhancements
17. Add form validation
18. Implement weekly reset system
19. Add data export/import
20. Optimize user interface
21. Add filters and search functionality

### Phase 6: Final Touches
22. Unit tests
23. User documentation
24. Deployment

### Future Enhancements (v2)
25. M+ crest tracking (weekly caps for item upgrades)
26. Advanced reward calculations
27. Item upgrade tracking

## WoW Game Mechanics

### Great Vault System
**Raid Vault Requirements:**
- 2/4/6 raid bosses killed = 1/2/3 vault reward slots
- Heroic raid bosses → Heroic items in raid vault
- Mythic raid bosses → Mythic items in raid vault

**M+ Vault Requirements:**
- 1/4/8 M+ dungeons = 1/2/3 vault reward slots
- Keys < 10 → Heroic items in vault
- Keys ≥ 10 → Mythic items in vault

**Note:** M+ also provides crests (weekly capped) for item upgrades, but this is not priority for v1

### Race/Faction Handling
- Neutral races (Pandaren, Dracthyr) should appear in both Alliance and Horde faction lists
- No need for separate neutral faction - simplifies UI/UX

### Weekly Content Tracking
- Each character has 2 professions → 2 profession quests per week
- Weekly events rotate (Timewalking, M+ bonus, etc.) - content may change with expansions
- World boss: 1 per week (code prepared for variation)
- Spark quest: 1 spark fragment per week (accumulates to full spark every 2 weeks)
- Need flexible system for future expansion changes

## Technical Questions to Clarify
- ✅ Races, classes, and specializations (see wow_factions_races_classes.md)
- ✅ Raid bosses: Just track number killed for vault progress (no need for specific raid boss counts)
- ✅ Weekly reset: Wednesday for Europe
- ✅ Weekly quests: World boss, Spark quest (half spark/week for crafting), Profession quests (2 per character for knowledge points), Weekly events (Timewalking, M+ bonus, etc.)
- ✅ Profession knowledge points: Weekly quest (1/week), Harvesting (weekly capped points - customizable), Collectible items (1/expansion), Buyable items (1/expansion) - details in profession_knowledge.md
- ✅ Professions: 11 total (see wow_professions.md) - 3 gathering, 8 crafting - each character has 2 professions
- ✅ Item level/gear tracking: Future v2 feature

## Planned Technical Structure
```
src/
├── app/
│   ├── models/          # TypeScript interfaces
│   ├── services/        # Angular services
│   ├── components/      # Angular components
│   │   ├── character-list/
│   │   ├── character-form/
│   │   ├── activity-tracker/
│   │   └── dashboard/
│   └── shared/          # Shared components
```

## Technologies
- Angular 18
- TypeScript
- SCSS
- LocalStorage
- Angular Reactive Forms
- Angular Router