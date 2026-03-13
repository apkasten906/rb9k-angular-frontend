---
agent: agent
description: Implements the Application Tracking feature for rb9k using Angular Material, NgModules, mock data services, and Cucumber step definitions.
tools: [execute, read, edit, search, todo]
---

# Application Tracking Feature — Implementation Prompt

## Context

- **Workspace**: `c:\Development\rb9k-angular-frontend\rb9k-angular-frontend`
- **Angular version**: 21
- **Branch**: `feat/application-tracking`
- **Requirements layer**: Cucumber feature file at `e2e/features/01-application_tracking.feature`
- **ERD**: `documentation/design/erd/job_tracker_erd.md`
- **Style guide**: [John Papa Angular Style Guide](https://angular.io/guide/styleguide)

## Architecture Decisions

| Concern | Decision |
|---|---|
| Module strategy | **NgModule-based feature modules** (not standalone) |
| UI library | **Angular Material v21** (MDC components) |
| Data layer | In-memory `MockDataService` — no HTTP calls |
| Company intelligence | Manual entry form only |
| Salary intelligence | Manual entry form only |
| Auth | Out of scope — single mock user constant |
| Cucumber step backing | Service-layer (no DOM); Playwright page-object hooks stubbed with comments |

## Status State Machine

```
Applied ──► Interviewing ──► Offer ──► Accepted         (terminal)
  │              │             ├──► Offer Declined       (terminal)
  │              │             └──► Offer Rescinded      (terminal)
  ├──► Rejected ◄┘  (Applied or Interviewing ONLY — never from Offer)
  └── Withdrawn reachable from: Applied, Interviewing, Offer  (terminal)
```

Enforced by `APPLICATION_STATUS_TRANSITIONS` map in `application-status-machine.ts`.

## Module Structure

```
src/app/
  core/
    core.module.ts
    models/
      application-status.enum.ts
      application-status-machine.ts
      user.model.ts
      company.model.ts
      job-posting.model.ts
      job-application.model.ts
      application-status-history.model.ts
      application-note.model.ts
      salary-info.model.ts
      resume.model.ts
      cover-letter.model.ts
      timeline-event.model.ts
    services/
      mock-data.service.ts
      application.service.ts
      company.service.ts
      job-posting.service.ts
      resume.service.ts
      cover-letter.service.ts
      salary.service.ts
      timeline.service.ts
  shared/
    shared.module.ts            ← re-exports all Angular Material modules needed
    components/
      status-badge/
        status-badge.component.ts
        status-badge.component.html
        status-badge.component.scss
      timeline/
        timeline.component.ts
        timeline.component.html
        timeline.component.scss
  features/
    applications/
      applications.module.ts
      applications-routing.module.ts
      application-list/
        application-list.component.ts
        application-list.component.html
        application-list.component.scss
      application-form/
        application-form.component.ts
        application-form.component.html
        application-form.component.scss
      application-detail/
        application-detail.component.ts
        application-detail.component.html
        application-detail.component.scss
        salary-form/
          salary-form.component.ts
          salary-form.component.html
          salary-form.component.scss
        document-linker/
          document-linker.component.ts     ← MatDialog
          document-linker.component.html
          document-linker.component.scss
  app.module.ts
  app-routing.module.ts
  app.ts                        ← keep existing, convert to use AppModule
  app.html
  app.scss
```

## Routes

```
/applications            →  ApplicationListComponent      (lazy via ApplicationsModule)
/applications/new        →  ApplicationFormComponent
/applications/:id        →  ApplicationDetailComponent
```

## Domain Models — Key Fields

### `ApplicationStatus` enum
```
Applied | Interviewing | Offer | Accepted | OfferDeclined | OfferRescinded | Rejected | Withdrawn
```

### `JobApplication`
```ts
applicationId: number
userId: number
jobId: number | null        // null when no posting available
companyId: number
status: ApplicationStatus
appliedDate: string         // ISO timestamp
postingUrl: string | null
resumeId: number | null
coverLetterId: number | null
salaryInfoId: number | null
```

### `ApplicationStatusHistory`
```ts
historyId: number
applicationId: number
from: ApplicationStatus
to: ApplicationStatus
timestamp: string
```

### `ApplicationNote`
```ts
noteId: number
applicationId: number
content: string
author: string
createdAt: string
```

### `SalaryInfo`
All three salary values are nullable (supports partial-data scenario):
```ts
salaryId: number
applicationId: number
companyOfferedSalary: number | null
userExpectedSalary: number | null
industryAverageSalary: number | null
currency: string | null
region: string | null
```

### `Resume`
```ts
resumeId: number
userId: number
jobId: number | null
title: string
version: number
parentResumeId: number | null
status: 'active' | 'deleted'
createdDate: string
lastModified: string | null
```

### `TimelineEvent`
```ts
eventType: 'creation' | 'status_change' | 'note' | 'document_link' | 'salary_update'
applicationId: number
details: string
author: string
timestamp: string
```

## Mock Seed Data (MockDataService)

- **1 User**: `{ userId: 1, firstName: 'Alex', lastName: 'Morgan', email: 'alex@example.com' }`
- **3 Companies**: Acme Corp, DataVision Inc, CloudWorks
- **5 Job Postings**: 2 × Acme, 2 × DataVision, 1 × CloudWorks
- **4 Applications**:
  1. Acme / Data Analyst — status: `Applied`
  2. DataVision / Senior Engineer — status: `Interviewing` (last update 90 days ago for long-gap scenario)
  3. CloudWorks / PM — status: `Offer` (with salary data)
  4. Acme / UX Lead — status: `Accepted` (with full timeline history and linked documents)
- **2 Resumes**: R1 (active), R1v2 (active, parentResumeId → R1)
- **1 Cover Letter**: C1 (active)

## Task Execution Order

Execute each task in order. After each task, run `get_errors` on the modified files before proceeding.

### Task 1 — Install Angular Material
```sh
cd c:\Development\rb9k-angular-frontend\rb9k-angular-frontend
ng add @angular/material --theme=indigo-pink --typography=true --animations=enabled --skip-confirmation
```

### Task 2 — Domain models
Create all files under `src/app/core/models/` as described above.
Start with the enum and state machine, then the rest in dependency order.

### Task 3 — CoreModule + services
1. Create `src/app/core/core.module.ts` (declares nothing, exports nothing — services are `providedIn: 'root'`)
2. Create `MockDataService` with seed data arrays
3. Create remaining services injecting `MockDataService`

### Task 4 — SharedModule
1. Create `src/app/shared/shared.module.ts`
2. Create `StatusBadgeComponent` — `MatChip` coloured by status group:
   - active: `primary` (Applied, Interviewing, Offer)
   - terminal-success: `accent` (Accepted)
   - terminal-declined: `warn` (OfferDeclined, OfferRescinded, Rejected, Withdrawn)
3. Create `TimelineComponent` — renders `TimelineEvent[]` as `MatList` with icons per `eventType`

### Task 5 — ApplicationsModule + routing
1. `applications-routing.module.ts` with the three routes
2. `applications.module.ts` importing `SharedModule` and declaring the three feature components

### Task 6 — ApplicationListComponent
- `MatTable` with columns: Company, Job Title, Status (StatusBadge), Applied Date, actions
- Filter by company name (input bound to `MatTableDataSource`)
- "New Application" button → `/applications/new`
- Row click → `/applications/:id`

### Task 7 — ApplicationFormComponent
- Reactive form with `FormBuilder`
- Company selector (MatSelect from CompanyService)
- Job Posting selector filtered by selected company (MatSelect from JobPostingService); "none available" option sets `jobId: null`
- Posting URL input (optional)
- Status defaults to `Applied`
- Submit calls `ApplicationService.createApplication()`
- Navigates to `/applications/:id` on success

### Task 8 — ApplicationDetailComponent
- Displays application header: company, job title, current status (StatusBadge), applied date, posting URL (clickable link)
- Status transition panel: `MatSelect` showing only valid next states from state machine; on change calls `ApplicationService.updateStatus()`
- Notes section: list of `ApplicationNote` + add-note form
- Hosts `<app-timeline>`, `<app-salary-form>`, and "Link Documents" button (opens `DocumentLinkerComponent` dialog)

### Task 9 — TimelineComponent (SharedModule)
- Input: `TimelineEvent[]`
- Renders as `MatList`, sorted chronologically ascending
- Each item shows: icon (by eventType), details text, author, formatted timestamp
- Handles long-gap display: if gap between consecutive events > 30 days, insert a visual divider "X days gap"

### Task 10 — SalaryFormComponent
- Reactive form for `SalaryInfo`
- Three nullable decimal fields: expected, offered, industry average
- Currency (MatSelect: USD, GBP, EUR, CAD, AUD)
- Region (text input)
- On save calls `SalaryService.setSalaryInfo()` which also appends a `salary_update` timeline event

### Task 11 — DocumentLinkerComponent (MatDialog)
- Lists available resumes and cover letters for current user
- Shows version info; flags deleted documents with "missing" chip
- On confirm calls `ApplicationService.linkDocuments()` which appends `document_link` timeline event
- If linked cover letter is deleted, shows "cover letter missing — relink" warning chip on detail view

### Task 12 — Wire AppModule + routing
- Convert `app.ts` to use `AppModule`
- `app-routing.module.ts`: default redirect `/` → `/applications`, lazy-load `ApplicationsModule`
- Add `MatToolbar` nav to `app.html` with "Applications" link

### Task 13 — Cucumber step definitions
Create step files under `e2e/step-definitions/` grouped by tag:
- `create-application.steps.ts`  → `@create` scenarios
- `status-workflow.steps.ts`     → `@status` scenarios (including state-machine enforcement)
- `document-linking.steps.ts`    → `@documents` scenarios
- `salary.steps.ts`              → `@salary` scenarios
- `timeline.steps.ts`            → `@timeline` scenarios

Each step file uses a shared `World` class that holds service instances.
Steps call service methods directly (no DOM). Add `// TODO: replace with Playwright page.xxx()` comments at every UI-interaction step so Playwright migration is clearly marked.

## Validation after completion

1. `npm run build` — zero errors
2. `npm test` — existing `app.spec.ts` still passes
3. `npm run cucumber` — all 16 scenarios pass (11 original + 5 new offer/withdrawal scenarios)
