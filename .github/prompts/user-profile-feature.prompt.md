---
agent: agent
description: Implements the User Profile Management feature for rb9k using Angular standalone components, Angular Material, MockDataService, and Cucumber step definitions.
tools: [execute, read, edit, search, todo]
---

# User Profile Management — Implementation Prompt

## Context

- **Workspace**: `c:\Development\rb9k-angular-frontend\rb9k-angular-frontend`
- **Angular version**: 21
- **Branch**: `feat/user-profile`
- **Requirements layer**: Cucumber feature file at `e2e/features/03-user_profile_management.feature`
- **Style guide**: [John Papa Angular Style Guide](https://angular.io/guide/styleguide)
- **Pattern reference**: Follow the standalone component pattern already used in `features/career-history/` and `features/landing/`

## Architecture Decisions

| Concern | Decision |
|---|---|
| Module strategy | **Standalone components** (consistent with existing career-history and landing features) |
| UI library | **Angular Material v21** (MDC components) |
| Data layer | In-memory `MockDataService` — no HTTP calls |
| Auth | Out of scope — single mock user (`userId: 1`) is always current user |
| Photo upload | Simulated in-memory as a `string` (filename); no real file I/O |
| Privacy enforcement | In-memory flag on profile object; "second user perspective" Cucumber steps use a helper that queries through privacy filters |
| Password | Stored as a plain `string` on the mock profile; no hashing (mock only) |
| Completeness indicator | Computed property in `UserProfileService` counting non-null tracked fields |
| Routing | Lazy-loaded standalone component at `/profile` |

## Module Structure

```
src/app/
  core/
    models/
      user.model.ts              ← extend with optional profile fields (see Domain Models)
      user-profile.model.ts      ← new: extended profile + privacy flags
    services/
      user-profile.service.ts    ← new: profile CRUD + completeness + privacy
      mock-data.service.ts       ← add seed profile for userId: 1
  features/
    user-profile/
      user-profile.component.ts
      user-profile.component.html
      user-profile.component.scss
      profile-form/
        profile-form.component.ts
        profile-form.component.html
        profile-form.component.scss
      change-password/
        change-password.component.ts
        change-password.component.html
        change-password.component.scss
      photo-settings/
        photo-settings.component.ts
        photo-settings.component.html
        photo-settings.component.scss
      privacy-settings/
        privacy-settings.component.ts
        privacy-settings.component.html
        privacy-settings.component.scss
e2e/
  step-definitions/
    user-profile.steps.ts        ← new: all @create @edit @view @validation @completeness @privacy @privacy-enforcement steps
```

## Routes

Add to `app.routes.ts`:

```
/profile   →  UserProfileComponent   (lazy-loaded standalone)
```

## Domain Models — Key Fields

### `UserProfile` (new model: `user-profile.model.ts`)

```ts
export interface UserProfile {
  userId: number;

  // Basic
  email: string;
  password: string;           // mock only — plain string
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;

  // Extended
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  professionalSummary?: string;

  // Media
  photoFilename?: string;     // simulated — just the filename string

  // Privacy
  privacy: {
    contactDetails: 'Everyone' | 'Connections' | 'Only me';
    summary: 'Everyone' | 'Connections' | 'Only me';
  };
}
```

### Completeness — tracked fields (12 total)

These 12 fields count toward the completeness percentage:
`firstName`, `lastName`, `email`, `phone`, `location`, `address`, `city`, `state`, `linkedInUrl`, `portfolioUrl`, `professionalSummary`, `photoFilename`

### Update `user.model.ts`

No change needed — `UserProfile` replaces it as the richer runtime type.
`User` can remain as a lightweight auth/ID type.

## Mock Seed Data (MockDataService)

Add one `UserProfile` record for `userId: 1`:

```ts
{
  userId: 1,
  email: 'alex@example.com',
  password: 'MockPass!1',
  firstName: 'Alex',
  lastName: 'Morgan',
  phone: '+1 415 555 0100',
  location: 'San Francisco, CA',
  privacy: { contactDetails: 'Everyone', summary: 'Everyone' }
}
```

All optional extended fields (`address`, `city`, etc.) start as `undefined` so completeness starts at 6/12 = 50%.

## Task Execution Order

Execute each task in order. After each task, run `get_errors` on the modified files before proceeding.

### Task 1 — Domain model

1. Create `src/app/core/models/user-profile.model.ts` with the `UserProfile` interface above.
2. Add `TRACKED_PROFILE_FIELDS` constant (string array of the 12 field names) to the same file.

### Task 2 — UserProfileService

Create `src/app/core/services/user-profile.service.ts`:

- `getProfile(userId: number): UserProfile` — returns record from `MockDataService`
- `updateProfile(userId: number, changes: Partial<UserProfile>): UserProfile` — merges changes; throws `Error('Email already in use')` if `email` conflicts with another record
- `updatePassword(userId: number, current: string, newPassword: string): void` — validates current password match; throws if mismatch; validates min length 8
- `setPhoto(userId: number, filename: string | null): void` — sets `photoFilename`
- `setPrivacy(userId: number, privacy: UserProfile['privacy']): void`
- `getCompleteness(userId: number): { filled: number; total: number; percent: number }` — counts non-null/non-undefined tracked fields
- `isFieldVisible(viewerUserId: number, ownerId: number, field: keyof UserProfile['privacy']): boolean` — returns `false` if `'Only me'` and viewer ≠ owner; `true` for `'Everyone'`; for `'Connections'` return `true` (connections concept out of scope, treat as visible)

Add the seed profile array to `MockDataService` and expose `getProfiles(): UserProfile[]` from it.

### Task 3 — Route

In `src/app/app.routes.ts`, add:

```ts
{
  path: 'profile',
  loadComponent: () =>
    import('./features/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
},
```

### Task 4 — UserProfileComponent (shell)

Create `src/app/features/user-profile/user-profile.component.ts`:

- Standalone, imports `MatTabsModule`, `MatProgressBarModule`, child form components
- On init loads current user profile (`userId: 1`)
- Displays `MatTabGroup` with tabs: **Profile**, **Password**, **Photo**, **Privacy**
- Shows completeness `MatProgressBar` at the top (value = `percent` from `getCompleteness()`)
- Each tab hosts its respective child component (passed profile as `@Input`)

### Task 5 — ProfileFormComponent

Create `src/app/features/user-profile/profile-form/`:

- Reactive form (`FormBuilder`) with all `UserProfile` fields
- Required validators: `email` (pattern), `firstName`, `lastName`
- URL validators on `linkedInUrl` and `portfolioUrl` (must start with `https://`)
- `email` async-style validator (synchronous mock): checks `UserProfileService` for duplicate on blur
- On submit calls `UserProfileService.updateProfile()` and emits `profileUpdated` output
- Shows `MatFormField` error messages: `"Email is already in use"`, `"Enter a valid email address"`, `"Enter a valid URL (https)"`

### Task 6 — ChangePasswordComponent

Create `src/app/features/user-profile/change-password/`:

- Three fields: `currentPassword`, `newPassword`, `confirmPassword`
- `newPassword` validator: min length 8 → error `"Password must be at least 8 characters"`
- Cross-field validator: `newPassword === confirmPassword` → error `"Passwords do not match"`
- On submit calls `UserProfileService.updatePassword()`; catches service error for wrong current password
- Shows `MatSnackBar` confirmation on success

### Task 7 — PhotoSettingsComponent

Create `src/app/features/user-profile/photo-settings/`:

- Displays current photo filename or default avatar placeholder
- "Upload" `<input type="file">` (accept `.jpg,.jpeg,.png`; max 5 MB enforced in component)
- "Remove" button sets photo to `null` → shows default avatar
- Calls `UserProfileService.setPhoto()` on change

### Task 8 — PrivacySettingsComponent

Create `src/app/features/user-profile/privacy-settings/`:

- Two `MatSelect` fields: contact details visibility, summary visibility
- Options: `'Everyone'`, `'Connections'`, `'Only me'`
- On save calls `UserProfileService.setPrivacy()`
- Shows `MatSnackBar` confirmation on save

### Task 9 — Cucumber step definitions

Create `e2e/step-definitions/user-profile.steps.ts` covering all scenarios in `03-user_profile_management.feature`.

Group steps by tag:

| Tag | Steps to implement |
|---|---|
| `@create` | Profile creation with table data, registration page context |
| `@edit` | `updateProfile`, `updatePassword`, `setPhoto`, links, summary |
| `@validation` | Email duplicate, email format, URL format, password too short, password mismatch, required fields |
| `@view` | Completeness sections table assertion |
| `@completeness` | `getCompleteness()` with outline examples |
| `@privacy` | `setPrivacy()` save; second-user visibility via `isFieldVisible()` |

Each step calls service methods directly (no DOM).
Add `// TODO: replace with Playwright page.xxx()` at every step that implies UI interaction.

Use the shared `World` class pattern from `e2e/step-definitions/world.ts`.

### Task 10 — Nav link

Add a **Profile** link to the navigation toolbar in `src/app/app.html` pointing to `/profile`.

## Validation after completion

1. `npm run build` — zero errors
2. `npm test` — all existing specs still pass; new `user-profile.service.spec.ts` passes
3. Run Cucumber manually against `03-user_profile_management.feature` — all 26 scenarios pass

## Review request

After all tasks pass validation, open a pull request and request a **Copilot code review**:

1. Push the feature branch:
   ```sh
   git push origin feat/user-profile
   ```
2. Create a PR titled `feat: implement user profile management` targeting `main`.
3. In the PR description include:
   - Link to `e2e/features/03-user_profile_management.feature`
   - Summary of the 26 scenarios covered
   - Note any scenarios marked `// TODO: Playwright` in the step definitions
4. Request a Copilot review by going to the PR on **github.com**, opening the **Reviewers** panel, and selecting **Copilot** from the reviewer picker.
   Copilot will analyse the diff and post inline comments automatically.
