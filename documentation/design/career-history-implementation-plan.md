# Career History Management — Implementation Plan Prompt

## Context

**Branch:** `feat/career-history-management`
**Feature file:** `e2e/features/02-career_history.feature`
**Stack:** Angular 21 standalone components, Angular Material, MockDataService pattern (no HTTP), Jest unit tests, Cucumber e2e.

### Existing conventions to follow

- All components are standalone (`standalone: true` is the default in Angular 21, no NgModule)
- Services inject `MockDataService` as the single in-memory data store
- `MockDataService` contains arrays and a `nextIds` counter object for generating IDs
- `now()` on `MockDataService` is a replaceable clock function
- Routes use `loadComponent` lazy-loading in `app.routes.ts`
- Angular Material is used for all UI (cards, tables, forms, dialogs, icons, chips)
- Path: `src/app/features/<feature-name>/` for feature modules, `src/app/core/` for models + services

---

## Scenarios to implement (all 10)

| Tag                 | Scenario                                           |
| ------------------- | -------------------------------------------------- |
| `@create`           | Creating a career entry                            |
| `@responsibilities` | Adding responsibilities to a career entry          |
| `@achievements`     | Adding achievements with impact metrics            |
| `@edit`             | Editing a career entry                             |
| `@delete`           | Deleting a career entry cascades related items     |
| `@timeline`         | Viewing career timeline in chronological order     |
| `@overlap`          | Managing overlapping roles                         |
| `@relevance`        | ~~Calculating relevance scores against a job posting~~ *(deferred — see `e2e/features/03-relevance-scoring.feature`)* |
| `@filter`           | Filtering by role category                         |
| `@gaps`             | Career gap handling                                |

---

## Step 1 — Data models (`src/app/core/models/`)

### `career-entry.model.ts`

```ts
export interface CareerEntry {
  careerEntryId: number;
  userId: number;
  employer: string;
  jobTitle: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD or null if current role */
  endDate: string | null;
  location: string | null;
  description: string | null;
  /** Derived/set externally — does not cascade delete via this flag */
  category: string; // mirrors jobTitle for role category filtering
}
```

### `career-responsibility.model.ts`

```ts
export interface CareerResponsibility {
  responsibilityId: number;
  careerEntryId: number;
  text: string;
  // relevanceScore removed — deferred to feat/relevance-scoring
}
```

### `career-achievement.model.ts`

```ts
export interface CareerAchievement {
  achievementId: number;
  careerEntryId: number;
  text: string;
  impactMetric: string | null;
  // relevanceScore removed — deferred to feat/relevance-scoring
}
```

---

## Step 2 — MockDataService additions (`src/app/core/services/mock-data.service.ts`)

Add to the `MockDataService` class:

```ts
import { CareerEntry } from '../models/career-entry.model';
import { CareerResponsibility } from '../models/career-responsibility.model';
import { CareerAchievement } from '../models/career-achievement.model';

// Inside class:
careerEntries: CareerEntry[] = [
  {
    careerEntryId: 1, userId: 1,
    employer: 'Beta Systems', jobTitle: 'Junior Analyst',
    startDate: '2017-01-01', endDate: '2019-05-31',
    location: 'Chicago, USA', description: 'Entry-level analytics role.',
    category: 'Junior Analyst',
  },
  {
    careerEntryId: 2, userId: 1,
    employer: 'DataVision Inc', jobTitle: 'Data Analyst',
    startDate: '2019-03-01', endDate: '2019-05-31', // overlaps with entry 1
    location: 'Remote', description: 'Part-time contract overlap.',
    category: 'Data Analyst',
  },
  {
    careerEntryId: 3, userId: 1,
    employer: 'CloudWorks', jobTitle: 'Senior Analyst',
    startDate: '2021-01-01', endDate: '2023-06-30',
    // gap > 2 months between entry 2 end (2019-05-31) and this start (2021-01-01)
    location: 'Seattle, USA', description: 'Led data platform migrations.',
    category: 'Senior Analyst',
  },
];

careerResponsibilities: CareerResponsibility[] = [
  { responsibilityId: 1, careerEntryId: 3, text: 'Built SQL dashboards for stakeholder communication' },
  { responsibilityId: 2, careerEntryId: 3, text: 'Managed cross-functional analytics initiatives' },
];

careerAchievements: CareerAchievement[] = [
  { achievementId: 1, careerEntryId: 3, text: 'Reduced query runtime by 60%', impactMetric: '60% faster queries' },
];

// In nextIds:
nextIds = {
  // ...existing keys...
  careerEntry: 4,
  responsibility: 3,
  achievement: 2,
};
```

---

## Step 3 — `CareerService` (`src/app/core/services/career.service.ts`)

```ts
@Injectable({ providedIn: 'root' })
export class CareerService {
  constructor(private readonly mock: MockDataService) {}

  // --- Career Entries ---
  getAllByUser(userId: number): CareerEntry[];
  getById(id: number): CareerEntry | undefined;
  create(data: Omit<CareerEntry, 'careerEntryId'>): CareerEntry;
  update(id: number, changes: Partial<Omit<CareerEntry, 'careerEntryId' | 'userId'>>): CareerEntry;
  delete(id: number): void; // also deletes all responsibilities + achievements for this entry

  // --- Responsibilities ---
  getResponsibilities(careerEntryId: number): CareerResponsibility[];
  addResponsibility(careerEntryId: number, text: string): CareerResponsibility;
  deleteResponsibility(id: number): void;

  // --- Achievements ---
  getAchievements(careerEntryId: number): CareerAchievement[];
  addAchievement(
    careerEntryId: number,
    text: string,
    impactMetric: string | null,
  ): CareerAchievement;
  deleteAchievement(id: number): void;

  // --- Timeline helpers ---
  /** Returns entries sorted by startDate ascending */
  getTimelineByUser(userId: number): CareerEntry[];

  /** Returns entries grouped into concurrent clusters (sets of overlapping date ranges) */
  getOverlapGroups(userId: number): CareerEntry[][];

  /** Returns gaps > 2 months between consecutive non-overlapping entries, sorted by startDate */
  getCareerGaps(userId: number): Array<{ gapStart: string; gapEnd: string; durationDays: number }>;

  // --- Filter ---
  filterByCategory(
    userId: number,
    category: string,
  ): {
    entries: CareerEntry[];
    responsibilities: CareerResponsibility[];
    achievements: CareerAchievement[];
  };

  // --- AI Relevance scoring (synchronous mock) ---
  /** Scores all responsibilities and achievements for a given userId against provided keywords.
   *  Sets relevanceScore (0–100) on each item based on keyword overlap.
   *  Returns { topResponsibilities, topAchievements } sorted descending by score (top 3 each). */
  scoreRelevance(
    userId: number,
    keywords: string[],
  ): {
    topResponsibilities: CareerResponsibility[];
    topAchievements: CareerAchievement[];
  };
}
```

**Overlap detection logic:**
Two entries overlap if `entry1.startDate <= entry2.endDate && entry2.startDate <= entry1.endDate`. Group overlapping entries using a union-find or simple interval-merge scan.

**Gap detection logic:**
Sort entries by `startDate`. After merging overlapping intervals, find consecutive pairs where `gapEndDate - gapStartDate > 60 days` (approximately 2 months).

**Relevance scoring logic (mock AI):**
For each responsibility/achievement text, count how many of the provided keywords appear (case-insensitive). Score = `Math.min(100, matchCount / keywords.length * 100)` rounded to integer. If zero match, score = 0. This is deterministic and testable without an API call.

---

## Step 4 — Feature components (`src/app/features/career-history/`)

### 4a. `career-history-list/career-history-list.component`

- **Route:** `/career-history`
- Shows all career entries for the current user as a sorted timeline (startDate ASC)
- Displays career gaps inline (gap banner between entries: dates + "Add explanation" prompt)
- Displays overlapping entries as side-by-side or visually grouped
- Filter chip/dropdown for role category
- "Add new role" button → navigates to `career-history/new`
- Each entry row/card → link to `career-history/:id`

### 4b. `career-history-form/career-history-form.component`

- **Routes:** `/career-history/new` and `/career-history/:id/edit`
- Reactive form with: employer, jobTitle, startDate (datepicker), endDate (datepicker, optional), location, description
- On save → `CareerService.create()` or `CareerService.update()`
- Validates startDate < endDate when both provided

### 4c. `career-history-detail/career-history-detail.component`

- **Route:** `/career-history/:id`
- Shows entry details (employer, title, dates, location, description)
- "Edit" button → navigates to edit form
- "Delete" button → confirms then calls `CareerService.delete()`, navigates back to list
- **Responsibilities section:**
  - Lists all responsibilities
  - "Add responsibility" inline text input + save button
  - Each responsibility shows its `relevanceScore` badge if not null (color-coded: green ≥70, amber 40–69, red <40)
- **Achievements section:**
  - Lists all achievements with `impactMetric`
  - "Add achievement" inline form (text + impactMetric inputs) + save button
  - Each achievement shows its `relevanceScore` badge if not null
- **Relevance scoring panel:**
  - Input for comma-separated keywords (or select from a linked job posting's requirements)
  - "Score Relevance" button → calls `CareerService.scoreRelevance()`
  - Displays top matches highlighted with score badges

---

## Step 5 — Routing additions (`src/app/app.routes.ts`)

```ts
{
  path: 'career-history',
  children: [
    {
      path: '',
      loadComponent: () =>
        import('./features/career-history/career-history-list/career-history-list.component')
          .then(m => m.CareerHistoryListComponent),
    },
    {
      path: 'new',
      loadComponent: () =>
        import('./features/career-history/career-history-form/career-history-form.component')
          .then(m => m.CareerHistoryFormComponent),
    },
    {
      path: ':id',
      loadComponent: () =>
        import('./features/career-history/career-history-detail/career-history-detail.component')
          .then(m => m.CareerHistoryDetailComponent),
    },
    {
      path: ':id/edit',
      loadComponent: () =>
        import('./features/career-history/career-history-form/career-history-form.component')
          .then(m => m.CareerHistoryFormComponent),
    },
  ],
},
```

Also add a "Career History" nav link in `app.html`.

---

## Step 6 — Shared subcomponent: `career-gap-banner`

A small standalone component at `src/app/shared/components/career-gap-banner/`:

```ts
@Input() gapStart: string;
@Input() gapEnd: string;
@Input() durationDays: number;
@Output() addExplanation = new EventEmitter<void>();
```

Renders: `"Gap: [gapStart] → [gapEnd] (N months) — Add explanation"`

---

## Step 7 — Cucumber e2e step definitions (`e2e/step-definitions/`)

Create `e2e/step-definitions/career-history.steps.ts` implementing all steps from `02-career_history.feature`:

- **Background steps:** reuse `shared.steps.ts` (`the user is signed in`, `the current timestamp is ...`)
- **@create:** `addCareerEntry(table)` → `CareerService.create()`; assert entry appears in `mock.careerEntries`
- **@responsibilities:** setup via `Given` seeding, `addResponsibilities(table)` → `CareerService.addResponsibility()`; assert attached
- **@achievements:** similar to responsibilities, with `impactMetric` column
- **@edit:** seed entry, call `CareerService.update()`, assert new values
- **@delete:** seed entry with responsibilities + achievements, call `CareerService.delete()`, assert all three arrays are empty of that entry
- **@timeline:** seed multiple entries, call `CareerService.getTimelineByUser()`, assert sorted ascending by startDate
- **@overlap:** seed overlapping entries, call `CareerService.getOverlapGroups()`, assert overlapping entries appear in same group
- **@relevance:** seed job posting with keywords, seed responsibilities/achievements with matching text, call `CareerService.scoreRelevance()`, assert all scores 0–100 and top matches are highest
- **@filter:** seed mixed data, call `CareerService.filterByCategory('Data Analyst')`, assert only matching entries/responsibilities/achievements returned
- **@gaps:** seed entries with a >2-month gap, call `CareerService.getCareerGaps()`, assert gap appears with correct dates and duration

---

## Step 8 — Unit tests

Create Jest unit test files alongside each service/component:

- `career.service.spec.ts` — test all service methods including overlap groups, gap detection, relevance scoring edge cases
- `career-history-list.component.spec.ts` — test filtering, gap banner rendering
- `career-history-form.component.spec.ts` — test form validation (end > start), create vs edit mode
- `career-history-detail.component.spec.ts` — test add responsibility, add achievement, delete cascade confirmation, relevance score display

---

## Implementation order

1. Models (Step 1)
2. MockDataService additions (Step 2)
3. CareerService (Step 3)
4. CareerService unit tests (Step 8 partial)
5. Feature components (Step 4)
6. Routing (Step 5)
7. Shared gap-banner component (Step 6)
8. Cucumber step definitions (Step 7)
9. Component unit tests (Step 8 remaining)
10. Wire nav link in `app.html`
11. Run `npm test -- --runInBand` → all green
12. Run `npm run cucumber` → all scenarios green
13. Run `npm run build` → clean build

---

## Key constraints

- No HTTP calls — all data is in-memory via `MockDataService`
- Relevance scoring must be deterministic (mock keyword-match algorithm, no external API)
- Overlap display does NOT merge overlapping roles — they are shown as concurrent
- Gap threshold is **> 2 months (> 60 days)** between non-overlapping consecutive roles
- Career entry delete **cascades** to responsibilities and achievements in MockDataService arrays
- `category` on `CareerEntry` mirrors `jobTitle` for filtering purposes (can be set equal to `jobTitle` on create)
- All components must be standalone (no NgModule)
- Use Angular Material consistently (Mat components for all forms, lists, dialogs)
