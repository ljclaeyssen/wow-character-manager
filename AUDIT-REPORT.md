# Rapport d'Audit Angular

**Projet** : wow-character-manager
**Date** : 25 fevrier 2026
**Version Angular** : 20.3.0
**Score global** : 67% — Note **C**

---

## Synthese

Le projet **wow-character-manager** est une application Angular 20 bien structuree qui exploite les fonctionnalites modernes du framework : composants standalone, signaux (91 usages), control flow moderne (`@if`, `@for`), injection via `inject()` et lazy loading systematique. L'architecture feature-based avec gestion d'etat via `@ngrx/signals` est coherente et bien organisee.

Cependant, trois problemes majeurs tirent le score vers le bas : **(1)** la suite de tests est entierement non fonctionnelle (echec de compilation, 0 tests executables), **(2)** l'absence totale de linting (ESLint non configure) degrade l'experience developpeur, et **(3)** des fuites memoire potentielles dans les composants qui souscrivent a des observables long-lived sans nettoyage.

---

## Scores par categorie

| Categorie | Score | Poids | Pondere | Statut |
|---|---|---|---|---|
| Performance | 45% | 15% | 6.75 | Echec |
| Securite | 90% | 15% | 13.50 | Bon |
| Bonnes pratiques Angular | 97% | 15% | 14.55 | Bon |
| Qualite du code | 57% | 15% | 8.55 | Echec |
| DX / Outillage | 56% | 15% | 8.40 | Echec |
| Architecture | 75% | 15% | 11.25 | Attention |
| Tests | 40% | 10% | 4.00 | Echec |
| **Global** | | **100%** | **67** | **C** |

Legende : Bon (>=80%) | Attention (60-79%) | Echec (<60%)

> **Note** : L'accessibilite est evaluee separement en annexe et n'affecte pas le score principal.

---

## Problemes critiques

Constats a fort impact. A traiter en priorite.

### 1. Suite de tests entierement non fonctionnelle

- **Severite** : Critique
- **Categorie** : Tests
- **Localisation** : `*.spec.ts` (16 fichiers)
- **Constat** : La compilation des tests echoue avant meme l'execution. Plusieurs fichiers spec contiennent des imports invalides, des references a des proprietes/methodes inexistantes et des mocks incomplets. Aucun des 303 tests declares ne peut etre execute.
- **Impact** : Zero couverture en pratique. Les regressions ne sont detectees qu'en production.
- **Correction suggeree** : Corriger les imports casses dans `character-detail.component.spec.ts` (propriete `server` manquante), `character-form.component.spec.ts` (imports invalides, methodes inexistantes), `character-list.component.spec.ts` (imports invalides), `great-vault-calculation.service.spec.ts` (proprietes inexistantes: `slotsEarned`, `slot1Reward`), `activity.service.spec.ts` (widening de type), `app.spec.ts` (contenu de template attendu incorrect). Valider avec `ng test`.

### 2. Fuites memoire potentielles dans les composants

- **Severite** : Critique
- **Categorie** : Performance
- **Localisation** : `character-form.component.ts`, `settings.component.ts`
- **Constat** : Des souscriptions a des observables long-lived (`valueChanges`, `statusChanges`) sont creees sans mecanisme de nettoyage. Ni `takeUntilDestroyed`, ni `DestroyRef`, ni `unsubscribe` ne sont utilises.
- **Impact** : Fuites memoire progressives lors de navigations repetees. Les callbacks continuent apres la destruction du composant.
- **Correction suggeree** : Injecter `DestroyRef` via `inject(DestroyRef)` et ajouter `takeUntilDestroyed(this.destroyRef)` dans le pipe de chaque souscription long-lived.

### 3. Absence totale d'ESLint

- **Severite** : Critique
- **Categorie** : DX / Outillage
- **Localisation** : `package.json`, racine du projet
- **Constat** : Aucune configuration ESLint n'est presente. Pas de fichier `eslint.config.js`, pas de `@angular-eslint`, pas de script `lint`.
- **Impact** : Les erreurs de style, imports inutilises et violations de conventions ne sont jamais detectes automatiquement.
- **Correction suggeree** : `ng add @angular-eslint/schematics` et ajouter `"lint": "ng lint"` dans `package.json`.

### 4. Usage systemique du type `any` dans le code de production

- **Severite** : Critique
- **Categorie** : Qualite du code
- **Localisation** : ~34 occurrences dans 14 fichiers
- **Constat** : Le type `any` est utilise dans les modeles API (`cached-api-data.model.ts`), les services (`api-cache.service.ts`, `vault-rewards-calculator.service.ts`) et les composants. Certains validateurs utilisent `typeof === 'object'` au lieu de type guards stricts.
- **Impact** : Annulation des benefices de TypeScript strict. Erreurs de type detectees uniquement a l'execution.
- **Correction suggeree** : Definir des interfaces typees pour les reponses API. Remplacer `any` par `unknown` + type guards ou types generiques.

### 5. Couverture de tests insuffisante (29% par fichier)

- **Severite** : Critique
- **Categorie** : Tests
- **Localisation** : `src/app/`
- **Constat** : 16 fichiers spec pour 55 fichiers source (29%). Services critiques sans tests : `blizzard-api.service.ts`, `api-cache.service.ts`, `weekly-progress.service.ts`.
- **Impact** : Les services metier essentiels ne sont pas proteges. Regressions silencieuses possibles.
- **Correction suggeree** : Prioriser les tests des services metier critiques. Viser 60% de couverture minimale.

---

## Avertissements

Points a corriger — non bloquants, mais impactants.

### 4 composants sans OnPush

- **Severite** : Attention
- **Categorie** : Performance
- **Localisation** : `settings.component.ts`, `vault-slot.component.ts`, `app-toolbar.component.ts`, `app.ts`
- **Description** : 10/14 composants utilisent `OnPush`. Les 4 restants declenchent des cycles complets. Ajouter `changeDetection: ChangeDetectionStrategy.OnPush`.

### 6 souscriptions manuelles dans les composants

- **Severite** : Attention
- **Categorie** : Performance
- **Localisation** : `character-form.component.ts`, `app-toolbar.component.ts`, `settings.component.ts`, `vault-progress-card.component.ts`
- **Description** : Appels `.subscribe()` directs au lieu du pipe `async` ou des signaux. Complique la gestion du cycle de vie.

### Pas de strategie de preloading configuree

- **Severite** : Attention
- **Categorie** : Performance
- **Localisation** : `app.config.ts`
- **Description** : Routes lazy-loaded sans preloading. Ajouter `withPreloading(PreloadAllModules)` dans `provideRouter()`.

### 34 instructions console.log/debug/info en production

- **Severite** : Attention
- **Categorie** : Securite / Qualite
- **Localisation** : `vault-rewards-calculator.service.ts` (8), `character-refresh.service.ts` (4), `store/*.ts` (11), etc.
- **Description** : 34 instructions de logging dans 11 fichiers. Exposent des details internes et polluent la console.

### 47 imports relatifs profonds (4+ niveaux)

- **Severite** : Attention
- **Categorie** : Architecture
- **Localisation** : Multiples fichiers dans `src/app/`
- **Description** : 47 imports avec 4+ niveaux de `../`. Pas d'alias de chemin dans `tsconfig.json`. Imports fragiles et difficiles a lire.

### Services dupliques : WeeklyResetService vs ResetService

- **Severite** : Attention
- **Categorie** : Architecture / Qualite
- **Localisation** : `weekly-reset.service.ts`, `reset.service.ts`
- **Description** : Deux services de reinitialisation hebdomadaire avec des heures differentes (15:00 UTC vs 10:00 locale). Incoherences possibles.

### Constante CLASS_COLORS dupliquee dans 3+ fichiers

- **Severite** : Attention
- **Categorie** : Qualite du code
- **Localisation** : Multiples fichiers
- **Description** : `CLASS_COLORS` definie dans 3+ emplacements avec des valeurs hex differentes. Centraliser dans `shared/constants/`.

### Absence de fichiers d'environnement

- **Severite** : Attention
- **Categorie** : DX / Outillage
- **Localisation** : `src/environments/`
- **Description** : Aucun fichier `environment.ts` ou `environment.prod.ts`. Gestion dev/prod difficile.

### Souscription vide dans blizzard-api.service.ts

- **Severite** : Attention
- **Categorie** : Qualite du code
- **Localisation** : `blizzard-api.service.ts:645`
- **Description** : `.subscribe()` sans arguments. Erreurs silencieusement ignorees. Ajouter un handler `error` ou `catchError`.

### Manipulation directe du DOM dans theme.service.ts

- **Severite** : Attention
- **Categorie** : Architecture
- **Localisation** : `theme.service.ts`
- **Description** : Acces direct au DOM. Peut causer des problemes SSR. Utiliser `Renderer2` ou `inject(DOCUMENT)`.

---

## Notes informatives

- **Code mort detecte** : `CharacterFormGroup` dans `forms/character-form-group.ts` est implementee mais jamais utilisee (remplacee par `SimpleCharacterFormGroup`). La methode `getDetailedVaultRewards()` dans `vault-rewards-calculator.service.ts` est deprecated et inutilisee.
- **Validateurs faibles dans api-cache.service.ts** : Verifications `typeof === 'object'` au lieu de type guards stricts.
- **skipLibCheck active** : `skipLibCheck: true` dans `tsconfig.json` masque les erreurs de type dans les dependances.
- **withInterceptorsFromDi utilise** : L'application utilise `withInterceptorsFromDi()` au lieu de `withInterceptors()`. Migrer vers les intercepteurs fonctionnels.
- **Pas de hooks pre-commit** : Ni `husky` ni `lint-staged` ne sont configures.
- **Formulaires bien types (point positif)** : Les classes `SimpleCharacterFormGroup` et `CharacterFormGroup` etendent `FormGroup` avec des types generiques.
- **Gestion d'erreur robuste (point positif)** : 62 occurrences de `catchError` / `catch` dans les services.

---

## Gains rapides

Corrections simples a fort impact. Commencez par la.

1. **Corriger les fichiers spec casses** — Restaurer une suite de tests fonctionnelle (+15 pts Tests)
2. **Ajouter ESLint avec @angular-eslint** — Ameliorer la qualite et l'outillage (+15 pts DX)
3. **Ajouter takeUntilDestroyed() aux souscriptions** — Eliminer les fuites memoire (+10 pts Performance)
4. **Ajouter OnPush aux 4 composants manquants** — Homogeneiser la detection de changement (+5 pts Performance)
5. **Supprimer les console.log** — Nettoyer la sortie de production (+3 pts Securite, +3 pts Qualite)

---

## Feuille de route

### Court terme (< 1 semaine)

1. Corriger les 6 fichiers spec en erreur de compilation
2. Ajouter `takeUntilDestroyed()` dans les composants avec souscriptions long-lived
3. Ajouter `OnPush` aux 4 composants manquants
4. Supprimer les 34 `console.log` du code de production
5. Supprimer le code mort (`CharacterFormGroup`, methode deprecated)

### Moyen terme (1-4 semaines)

1. Installer et configurer ESLint avec `@angular-eslint`
2. Configurer des alias de chemin (`@app/*`, `@shared/*`) dans tsconfig
3. Unifier les services de reset (WeeklyResetService / ResetService) en un seul
4. Centraliser la constante `CLASS_COLORS` dans `shared/constants/`
5. Remplacer les ~34 usages de `any` par des types stricts
6. Creer les fichiers d'environnement (dev, prod)
7. Ajouter `withPreloading(PreloadAllModules)` au routeur

### Long terme (1+ mois)

1. Augmenter la couverture de tests a 60%+ (priorite : services metier)
2. Configurer les hooks pre-commit (husky + lint-staged)
3. Migrer vers les intercepteurs fonctionnels (`withInterceptors`)
4. **Considerer une Clean Architecture** : le projet a une logique metier non triviale (gestion de coffre-fort, calculs de recompenses, progression hebdomadaire) actuellement couplee a l'infrastructure Angular. Separer la logique domaine du framework ameliorerait la testabilite et la maintenabilite. Le skill `angular-clean-arch-scaffold` peut aider a restructurer le projet.

---

## Resultats detailles

| # | Fichier | Categorie | Severite | Probleme | Suggestion |
|---|---|---|---|---|---|
| 1 | `*.spec.ts (16 fichiers)` | Tests | Critique | Suite de tests non fonctionnelle : echec de compilation | Corriger imports, mocks et references |
| 2 | `character-form.component.ts` | Performance | Critique | Souscription `valueChanges` sans nettoyage | Ajouter `takeUntilDestroyed()` |
| 3 | `settings.component.ts` | Performance | Critique | 2 souscriptions sans nettoyage | Ajouter `takeUntilDestroyed()` |
| 4 | `package.json, racine` | DX / Outillage | Critique | ESLint non configure | `ng add @angular-eslint/schematics` |
| 5 | `~14 fichiers production` | Qualite | Critique | ~34 usages de `any` | Types stricts, `unknown` + type guards |
| 6 | `src/app/ (16/55)` | Tests | Critique | Couverture 29%, services critiques non testes | Tests services metier prioritaires |
| 7 | `settings, vault-slot, app-toolbar, app` | Performance | Attention | 4 composants sans `OnPush` | Ajouter `OnPush` |
| 8 | `4 fichiers composant` | Performance | Attention | 6 `.subscribe()` manuels | Pipe `async` ou signaux |
| 9 | `app.config.ts` | Performance | Attention | Pas de preloading | `withPreloading(PreloadAllModules)` |
| 10 | `11 fichiers source` | Securite / Qualite | Attention | 34 `console.log/debug/info` | Supprimer ou service de logging |
| 11 | `Multiples fichiers` | Architecture | Attention | 47 imports profonds (4+ `../`) | Configurer `paths` dans tsconfig |
| 12 | `weekly-reset.service.ts, reset.service.ts` | Architecture | Attention | Services dupliques (heures differentes) | Fusionner en un seul service |
| 13 | `3+ fichiers` | Qualite | Attention | `CLASS_COLORS` dupliquee | Centraliser dans `shared/constants/` |
| 14 | `src/environments/` | DX / Outillage | Attention | Pas de fichiers d'environnement | Creer `environment.ts` et `environment.prod.ts` |
| 15 | `blizzard-api.service.ts:645` | Qualite | Attention | `.subscribe()` vide | Ajouter handler `error` ou `catchError` |
| 16 | `theme.service.ts` | Architecture | Attention | Manipulation directe du DOM | `Renderer2` ou `inject(DOCUMENT)` |
| 17 | `forms/character-form-group.ts` | Qualite | Info | Code mort : `CharacterFormGroup` inutilisee | Supprimer le fichier |
| 18 | `vault-rewards-calculator.service.ts` | Qualite | Info | Methode deprecated inutilisee | Supprimer la methode |
| 19 | `tsconfig.json` | DX / Outillage | Info | `skipLibCheck: true` | Desactiver si possible |
| 20 | `app.config.ts` | Angular | Info | `withInterceptorsFromDi()` au lieu de `withInterceptors()` | Migrer vers intercepteurs fonctionnels |
| 21 | `package.json` | DX / Outillage | Info | Pas de hooks pre-commit | Installer `husky` + `lint-staged` |

---

## Annexe : Rapport d'accessibilite (Bonus — non score)

Cette section evalue l'accessibilite separement et n'affecte pas le score principal.

### Resume

L'accessibilite du projet est **insuffisante**. Aucun attribut `aria-*` ni `role` n'est utilise dans les templates. Les 8 images presentes n'ont pas d'attribut `alt`. Aucune strategie de navigation au clavier ou d'annonce de changement de route n'a ete detectee.

### Constats

| # | Fichier | Verification | Severite | Probleme | Suggestion |
|---|---|---|---|---|---|
| 1 | Templates HTML (8 images) | A11Y-01 | Attention | 8 `<img>` sans attribut `alt` | Ajouter `alt="description"` ou `alt=""` pour les decoratives |
| 2 | Templates HTML | A11Y-13/14 | Attention | Aucun attribut `aria-*` ni `role` | Ajouter ARIA aux elements interactifs et `aria-live` aux zones dynamiques |
| 3 | `app.routes.ts` | A11Y-17 | Attention | Aucune strategie de titre de route | Ajouter `title` aux routes ou configurer `TitleStrategy` |

---

*Rapport genere par **angular-audit** -- 25 fevrier 2026*
