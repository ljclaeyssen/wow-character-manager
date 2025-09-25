# WoW Character Manager - Development Action Plan

## Development Guidelines
- Follow Angular v20+ best practices from guidelines.md
- Use PrimeNG v20 components following primeng_v20_guidelines.md
- Use NgRx Signal Store following ngrx_signalstore_guidelines.md
- Use standalone components, signals, modern control flow
- **ALWAYS use HTML template files - NEVER inline templates in TS**
- Each component MUST have tests (not enums/interfaces)
- Keep tasks small for context memory management
- Mark completed tasks to avoid duplication

## Phase 1: Setup & Foundation
### Task 1.1: Project Dependencies & Configuration ⏳
- [ ] Install PrimeNG v20: `npm install primeng @primeuix/themes primeicons`
- [ ] Install NgRx Signal Store: `npm install @ngrx/signals @ngrx/operators`
- [ ] Configure app.config.ts with PrimeNG theme (Aura preset) and provideAnimationsAsync
- [ ] Update styles.scss with PrimeNG imports and CSS layers
- [ ] Create basic app shell with PrimeNG theme

### Task 1.2: TypeScript Models & Enums ⏳
- [ ] Create `src/app/models/character.model.ts` with Character interface
- [ ] Create `src/app/models/activity.model.ts` with Activity interfaces
- [ ] Create `src/app/models/profession.model.ts` with Profession interfaces
- [ ] Create `src/app/enums/race.enum.ts` (based on wow_factions_races_classes.md)
- [ ] Create `src/app/enums/class.enum.ts` with specializations
- [ ] Create `src/app/enums/profession.enum.ts` (based on wow_professions.md)
- [ ] Create `src/app/enums/faction.enum.ts`

## Phase 2: Core Signal Stores & Services
### Task 2.1: NgRx Signal Stores ⏳
- [ ] Create `src/app/store/character.store.ts` with SignalStore (withEntities, withState, withMethods, withComputed)
- [ ] Create `src/app/store/activity.store.ts` with SignalStore for weekly activity tracking
- [ ] Create `src/app/store/profession.store.ts` with SignalStore for profession knowledge
- [ ] Implement CRUD operations using withEntities pattern
- [ ] Add rxMethod for async operations with localStorage
- [ ] Write comprehensive unit tests for all stores

### Task 2.2: Core Services ⏳
- [ ] Create `src/app/services/storage.service.ts` with localStorage operations
- [ ] Create `src/app/services/reset.service.ts` for Wednesday weekly reset
- [ ] Create `src/app/services/notification.service.ts` with PrimeNG MessageService
- [ ] Write unit tests for all services

## Phase 3: Character Management Components
### Task 3.1: Character List & Form Components ⏳
- [ ] Create `src/app/components/character-list/character-list.component.ts`
- [ ] Create `src/app/components/character-list/character-list.component.html`
- [ ] Create `src/app/components/character-form/character-form.component.ts`
- [ ] Create `src/app/components/character-form/character-form.component.html`
- [ ] Use PrimeNG Table, Button, Dialog components
- [ ] Implement Reactive Forms with PrimeNG form controls
- [ ] Add faction/race/class/spec dropdowns using PrimeNG Dropdown
- [ ] Add profession selection (2 max per character) with PrimeNG MultiSelect
- [ ] Inject character store using inject() function
- [ ] Write component tests for both components

### Task 3.2: Character Detail & Management Components ⏳
- [ ] Create `src/app/components/character-detail/character-detail.component.ts`
- [ ] Create `src/app/components/character-detail/character-detail.component.html`
- [ ] Create `src/app/components/character-delete/character-delete.component.ts`
- [ ] Create `src/app/components/character-delete/character-delete.component.html`
- [ ] Use PrimeNG ConfirmationService for delete confirmation
- [ ] Implement character editing with PrimeNG components
- [ ] Use standalone components with OnPush change detection
- [ ] Write component tests

## Phase 4: Activity Tracking Components
### Task 4.1: Activity Service & Main Tracker ⏳
- [ ] Create `src/app/services/activity.service.ts` with Great Vault calculations
- [ ] Create `src/app/components/activity-tracker/activity-tracker.component.ts`
- [ ] Create `src/app/components/activity-tracker/activity-tracker.component.html`
- [ ] Use PrimeNG Card, Panel, ProgressBar for activity display
- [ ] Implement weekly activity tracking with SignalStore integration
- [ ] Use computed() for vault progress calculations
- [ ] Write unit tests for service and component

### Task 4.2: Activity Sub-Components ⏳
- [ ] Create `src/app/components/mythic-plus/mythic-plus.component.ts`
- [ ] Create `src/app/components/mythic-plus/mythic-plus.component.html`
- [ ] Create `src/app/components/raid-progress/raid-progress.component.ts`
- [ ] Create `src/app/components/raid-progress/raid-progress.component.html`
- [ ] Create `src/app/components/weekly-quest/weekly-quest.component.ts`
- [ ] Create `src/app/components/weekly-quest/weekly-quest.component.html`
- [ ] Use PrimeNG InputNumber, Dropdown, Badge, Tag components
- [ ] Implement M+ counter with keystone level, raid boss counter with difficulty
- [ ] Add world boss, spark fragment (show X/2), profession quest tracking
- [ ] Use computed() signals for vault progress display with PrimeNG ProgressBar
- [ ] Write component tests for all three components

## Phase 5: Dashboard & Summary Components
### Task 5.1: Dashboard Components ⏳
- [ ] Create `src/app/components/dashboard/dashboard.component.ts`
- [ ] Create `src/app/components/dashboard/dashboard.component.html`
- [ ] Create `src/app/components/summary-table/summary-table.component.ts`
- [ ] Create `src/app/components/summary-table/summary-table.component.html`
- [ ] Use PrimeNG Panel, Splitter, DataView, Card for layout
- [ ] Use PrimeNG Table with sorting, filtering, pagination
- [ ] Display all characters overview with modern @if/@for control flow
- [ ] Show vault progress summary and statistics
- [ ] Add weekly reset countdown using PrimeNG Tag/Badge
- [ ] Integrate with SignalStore for reactive data
- [ ] Write component tests for both components

### Task 5.2: Navigation & Shell Components ⏳
- [ ] Update `src/app/app.component.ts` for app shell
- [ ] Update `src/app/app.component.html` with PrimeNG layout components
- [ ] Create `src/app/components/navigation/navigation.component.ts`
- [ ] Create `src/app/components/navigation/navigation.component.html`
- [ ] Use PrimeNG MenuBar, Sidebar, or TabMenu for navigation
- [ ] Update `src/app/app.routes.ts` with lazy loading
- [ ] Implement responsive design with PrimeNG Flex utilities
- [ ] Write component tests

## Phase 6: Weekly Reset & Data Management
### Task 6.1: Reset System Components ⏳
- [ ] Create `src/app/components/reset-notification/reset-notification.component.ts`
- [ ] Create `src/app/components/reset-notification/reset-notification.component.html`
- [ ] Use PrimeNG Toast, Message components for notifications
- [ ] Integrate reset service with activity SignalStore
- [ ] Add reset warnings and countdown display
- [ ] Use rxMethod in store for scheduled reset operations
- [ ] Write unit tests for service and component

### Task 6.2: Data Management Components ⏳
- [ ] Create `src/app/components/data-export/data-export.component.ts`
- [ ] Create `src/app/components/data-export/data-export.component.html`
- [ ] Create `src/app/components/data-import/data-import.component.ts`
- [ ] Create `src/app/components/data-import/data-import.component.html`
- [ ] Use PrimeNG FileUpload, Button, ProgressSpinner
- [ ] Add export/import functionality with SignalStore integration
- [ ] Add backup/restore capabilities using withLocalStorage pattern
- [ ] Write component tests

## Phase 7: Error Handling & Polish
### Task 7.1: Error Handling Components ⏳
- [ ] Create `src/app/components/error-display/error-display.component.ts`
- [ ] Create `src/app/components/error-display/error-display.component.html`
- [ ] Create `src/app/components/loading/loading.component.ts`
- [ ] Create `src/app/components/loading/loading.component.html`
- [ ] Use PrimeNG Message, ProgressSpinner, Skeleton components
- [ ] Implement comprehensive error boundaries
- [ ] Add loading states throughout application using SignalStore loading state
- [ ] Write component tests

### Task 7.2: Final Polish & Testing ⏳
- [ ] Implement responsive design using PrimeNG Flex/Grid
- [ ] Add accessibility attributes following PrimeNG guidelines
- [ ] Optimize change detection performance with OnPush
- [ ] Add computed() optimizations in stores
- [ ] Add comprehensive integration tests
- [ ] Write end-to-end tests
- [ ] Documentation and deployment preparation

## Progress Tracking
### Completed Tasks ✅
- Context and documentation setup
- WoW mechanics research and documentation

### Current Task ⏳
Ready to start Task 1.1: Project Dependencies & Configuration

### Notes for Context Management
- Each task groups related work to fit within token limits
- Reference files: context.md, guidelines.md, primeng_v20_guidelines.md, ngrx_signalstore_guidelines.md, wow_*.md files
- Always use separate HTML template files - NEVER inline templates
- Use NgRx Signal Stores with withEntities, withMethods, withComputed, rxMethod patterns
- Use PrimeNG v20 components with proper theming and accessibility
- Run tests after each component group creation
- Mark tasks as completed to avoid duplication
- Keep implementation focused on current task group only
- Use inject() function instead of constructor injection