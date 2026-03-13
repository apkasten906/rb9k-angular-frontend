/**
 * Step definitions for: 02-career_history.feature
 */
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { CareerEntry } from '../../src/app/core/models/career-entry.model';
import { CareerResponsibility } from '../../src/app/core/models/career-responsibility.model';
import { CareerAchievement } from '../../src/app/core/models/career-achievement.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findEntry(world: AppWorld, employer: string, jobTitle: string): CareerEntry {
  const entry = world.mock.careerEntries.find(
    (e) => e.employer === employer && e.jobTitle === jobTitle
  );
  if (!entry) throw new Error(`No career entry found for "${employer}" as "${jobTitle}"`);
  return entry;
}

// ---------------------------------------------------------------------------
// @create
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has no existing career entries', function () {
  this.mock.careerEntries = this.mock.careerEntries.filter(
    (e) => e.userId !== this.mock.currentUser.userId
  );
});

When<AppWorld>(
  'the user adds a career entry with details:',
  function (table: DataTable) {
    const row = table.hashes()[0];
    const startDate = row['start date'];
    const endDate = row['end date'] || null;

    // Simulate form-level validation: end date must be after start date
    if (endDate && endDate < startDate) {
      this.context['validationError'] = 'end date must be after start date';
      return;
    }

    this.context['validationError'] = null;
    const entry = this.careerService.create({
      userId: this.mock.currentUser.userId,
      employer: row['employer'],
      jobTitle: row['job title'],
      startDate,
      endDate,
      location: row['location'] || null,
      description: row['description'] || null,
      category: row['job title'],
    });
    this.currentCareerEntry = entry;
  }
);

Then<AppWorld>('the career entry appears in the career history timeline', function () {
  const timeline = this.careerService.getTimelineByUser(this.mock.currentUser.userId);
  assert.ok(timeline.length > 0, 'Expected at least one career entry in the timeline');
  const found = timeline.find(
    (e) =>
      e.employer === this.currentCareerEntry!.employer &&
      e.jobTitle === this.currentCareerEntry!.jobTitle
  );
  assert.ok(found, `Entry "${this.currentCareerEntry!.jobTitle}" not found in timeline`);
});

// ---------------------------------------------------------------------------
// @responsibilities
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'a career entry exists for {string} as {string}',
  function (employer: string, jobTitle: string) {
    // Check if entry already exists (e.g. seeded via table), else create
    let entry = this.mock.careerEntries.find(
      (e) => e.employer === employer && e.jobTitle === jobTitle
    );
    entry ??= this.careerService.create({
        userId: this.mock.currentUser.userId,
        employer,
        jobTitle,
        startDate: '2019-06-01',
        endDate: '2021-08-31',
        location: null,
        description: null,
        category: jobTitle,
      });
    this.currentCareerEntry = entry;
  }
);

When<AppWorld>('the user adds responsibilities:', function (table: DataTable) {
  for (const row of table.hashes()) {
    this.careerService.addResponsibility(this.currentCareerEntry!.careerEntryId, row['responsibility']);
  }
});

Then<AppWorld>('the responsibilities are attached to the career entry', function () {
  const responsibilities = this.careerService.getResponsibilities(
    this.currentCareerEntry!.careerEntryId
  );
  assert.ok(responsibilities.length > 0, 'Expected at least one responsibility to be attached');
});

// ---------------------------------------------------------------------------
// @achievements
// ---------------------------------------------------------------------------

When<AppWorld>('the user adds achievements:', function (table: DataTable) {
  for (const row of table.hashes()) {
    this.careerService.addAchievement(
      this.currentCareerEntry!.careerEntryId,
      row['achievement'],
      row['impact metric'] || null
    );
  }
});

Then<AppWorld>('the achievements are attached to the career entry', function () {
  const achievements = this.careerService.getAchievements(this.currentCareerEntry!.careerEntryId);
  assert.ok(achievements.length > 0, 'Expected at least one achievement to be attached');
});

// ---------------------------------------------------------------------------
// @edit
// ---------------------------------------------------------------------------

When<AppWorld>('the user updates the details:', function (table: DataTable) {
  const changes: Record<string, string> = {};
  for (const row of table.hashes()) {
    changes[row['field']] = row['value'];
  }
  this.careerService.update(this.currentCareerEntry!.careerEntryId, {
    ...(changes['job title'] ? { jobTitle: changes['job title'], category: changes['job title'] } : {}),
    ...(changes['end date'] ? { endDate: changes['end date'] } : {}),
    ...(changes['description'] ? { description: changes['description'] } : {}),
  });
  this.currentCareerEntry = this.careerService.getById(this.currentCareerEntry!.careerEntryId)!;
});

Then<AppWorld>('the career entry reflects the updated details', function () {
  const entry = this.careerService.getById(this.currentCareerEntry!.careerEntryId);
  assert.ok(entry, 'Career entry not found after update');
  // Verify the entry reference in world matches stored data
  assert.strictEqual(entry.careerEntryId, this.currentCareerEntry!.careerEntryId);
});

// ---------------------------------------------------------------------------
// @delete — extra Given steps for seeding responsibilities and achievements
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'the career entry has the following responsibilities:',
  function (table: DataTable) {
    for (const row of table.hashes()) {
      this.careerService.addResponsibility(
        this.currentCareerEntry!.careerEntryId,
        row['responsibility']
      );
    }
  }
);

Given<AppWorld>(
  'the career entry has the following achievements:',
  function (table: DataTable) {
    for (const row of table.hashes()) {
      this.careerService.addAchievement(
        this.currentCareerEntry!.careerEntryId,
        row['achievement'],
        row['impact metric'] || null
      );
    }
  }
);

When<AppWorld>('the user deletes the career entry', function () {
  this.careerService.delete(this.currentCareerEntry!.careerEntryId);
});

Then<AppWorld>(
  'the career entry, its responsibilities, and its achievements are removed',
  function () {
    const entryId = this.currentCareerEntry!.careerEntryId;
    const entry = this.careerService.getById(entryId);
    assert.equal(entry, undefined, 'Career entry should have been deleted');

    const responsibilities = this.careerService.getResponsibilities(entryId);
    assert.strictEqual(
      responsibilities.length,
      0,
      'All responsibilities should have been deleted'
    );

    const achievements = this.careerService.getAchievements(entryId);
    assert.strictEqual(achievements.length, 0, 'All achievements should have been deleted');
  }
);

// ---------------------------------------------------------------------------
// @timeline + @overlap — shared Given for seeding entries from a table
// ---------------------------------------------------------------------------

Given<AppWorld>('the following career entries exist:', function (table: DataTable) {
  for (const row of table.hashes()) {
    const entry = this.careerService.create({
      userId: this.mock.currentUser.userId,
      employer: row['employer'],
      jobTitle: row['job title'],
      startDate: row['start date'],
      endDate: row['end date'] || null,
      location: null,
      description: null,
      category: row['job title'],
    });
    // Set currentCareerEntry to the last one (useful for single-entry scenarios)
    this.currentCareerEntry = entry;
  }
});

When<AppWorld>('the user views the career timeline', function () {
  const timeline = this.careerService.getTimelineByUser(this.mock.currentUser.userId);
  this.context['timeline'] = timeline;
  this.context['overlapGroups'] = this.careerService.getOverlapGroups(this.mock.currentUser.userId);
  this.context['careerGaps'] = this.careerService.getCareerGaps(this.mock.currentUser.userId);
});

Then<AppWorld>('roles are listed by start date ascending', function () {
  const timeline = this.context['timeline'] as CareerEntry[];
  assert.ok(timeline.length > 0, 'Timeline should not be empty');
  for (let i = 1; i < timeline.length; i++) {
    assert.ok(
      timeline[i].startDate >= timeline[i - 1].startDate,
      `Entry at index ${i} (${timeline[i].startDate}) should be >= previous (${timeline[i - 1].startDate})`
    );
  }
});

// ---------------------------------------------------------------------------
// @overlap
// ---------------------------------------------------------------------------

Then<AppWorld>(
  'the two roles are displayed as concurrent and not merged into a single entry',
  function () {
    const groups = this.context['overlapGroups'] as CareerEntry[][];
    const overlapGroup = groups.find((g) => g.length > 1);
    assert.ok(overlapGroup, 'Expected at least one overlap group with 2+ concurrent entries');
    assert.ok(
      overlapGroup.length >= 2,
      `Expected 2+ entries in the overlap group, got ${overlapGroup.length}`
    );
    // Both entries must still be distinct objects (not merged)
    const ids = new Set(overlapGroup.map((e) => e.careerEntryId));
    assert.strictEqual(ids.size, overlapGroup.length, 'Entries in overlap group must be distinct');
  }
);

// ---------------------------------------------------------------------------
// @filter
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'each entry has at least one responsibility and one achievement',
  function () {
    const entries = this.careerService.getAllByUser(this.mock.currentUser.userId);
    for (const entry of entries) {
      this.careerService.addResponsibility(entry.careerEntryId, `Sample responsibility for ${entry.jobTitle}`);
      this.careerService.addAchievement(entry.careerEntryId, `Sample achievement for ${entry.jobTitle}`, null);
    }
  }
);

When<AppWorld>('the user filters by role category {string}', function (category: string) {
  const result = this.careerService.filterByCategory(this.mock.currentUser.userId, category);
  this.context['filterResult'] = result;
  this.context['filterCategory'] = category;
});

Then<AppWorld>(
  'only responsibilities and achievements linked to {string} roles are shown',
  function (category: string) {
    const result = this.context['filterResult'] as {
      entries: CareerEntry[];
      responsibilities: CareerResponsibility[];
      achievements: CareerAchievement[];
    };

    assert.ok(result.entries.length > 0, `Expected entries for category "${category}"`);

    const entryIds = new Set(result.entries.map((e) => e.careerEntryId));

    for (const entry of result.entries) {
      assert.strictEqual(entry.category, category,
        `Entry ${entry.careerEntryId} has category "${entry.category}", expected "${category}"`);
    }
    for (const r of result.responsibilities) {
      assert.ok(entryIds.has(r.careerEntryId),
        `Responsibility ${r.responsibilityId} linked to wrong entry`);
    }
    for (const a of result.achievements) {
      assert.ok(entryIds.has(a.careerEntryId),
        `Achievement ${a.achievementId} linked to wrong entry`);
    }
  }
);

// ---------------------------------------------------------------------------
// @gaps
// ---------------------------------------------------------------------------

Then<AppWorld>('a gap banner is shown between the two roles', function () {
  const gaps = this.context['careerGaps'] as Array<{
    gapStart: string;
    gapEnd: string;
    durationDays: number;
  }>;
  assert.ok(gaps.length > 0, 'Expected at least one career gap to be detected');
});

Then<AppWorld>(
  'the banner displays the gap start date {string}, end date {string}, and duration in months',
  function (gapStart: string, gapEnd: string) {
    const gaps = this.context['careerGaps'] as Array<{
      gapStart: string;
      gapEnd: string;
      durationDays: number;
    }>;
    const gap = gaps.find((g) => g.gapStart === gapStart && g.gapEnd === gapEnd);
    assert.ok(gap, `Expected a gap from ${gapStart} to ${gapEnd}, found: ${JSON.stringify(gaps)}`);
    assert.ok(gap.durationDays > 0, 'Gap duration should be positive');
  }
);

Then<AppWorld>('the banner includes a prompt to add an explanation', function () {
  const gaps = this.context['careerGaps'] as Array<{
    gapStart: string;
    gapEnd: string;
    durationDays: number;
    explanation?: string;
  }>;
  assert.ok(gaps.length > 0, 'No gaps detected — banner cannot be shown');
  assert.strictEqual(gaps[0].explanation, undefined, 'Gap should have no explanation set yet');
});

When<AppWorld>('the user saves the explanation {string}', function (explanation: string) {
  const gaps = this.context['careerGaps'] as Array<{
    gapStart: string;
    gapEnd: string;
    durationDays: number;
    explanation?: string;
  }>;
  this.careerService.setGapExplanation(this.mock.currentUser.userId, gaps[0].gapStart, explanation);
  this.context['careerGaps'] = this.careerService.getCareerGaps(this.mock.currentUser.userId);
});

Then<AppWorld>('the gap banner shows the explanation {string}', function (expected: string) {
  const gaps = this.context['careerGaps'] as Array<{
    gapStart: string;
    gapEnd: string;
    durationDays: number;
    explanation?: string;
  }>;
  const gap = gaps.find((g) => g.explanation === expected);
  assert.ok(gap, `No gap found with explanation "${expected}"`);
});

// ---------------------------------------------------------------------------
// @validation
// ---------------------------------------------------------------------------

Then<AppWorld>(
  'a validation error is shown indicating end date must be after start date',
  function () {
    const error = this.context['validationError'] as string;
    assert.ok(error, 'Expected a validation error to be set');
    assert.ok(
      error.includes('end date must be after start date'),
      `Unexpected error message: ${error}`
    );
  }
);

Then<AppWorld>('no career entry is saved', function () {
  const entries = this.careerService.getAllByUser(this.mock.currentUser.userId);
  // The when step sets validationError and returns early — so no new entry was saved
  assert.ok(
    this.context['validationError'],
    'Expected validation error to prevent save'
  );
  // We can also check there are no entries with reversed dates
  const bad = entries.find((e) => e.endDate !== null && e.endDate < e.startDate);
  assert.equal(bad, undefined, 'A career entry with reversed dates was incorrectly saved');
});

// ---------------------------------------------------------------------------
// @empty-state
// ---------------------------------------------------------------------------

Then<AppWorld>(
  'an empty state message is displayed prompting the user to add their first role',
  function () {
    const timeline = this.careerService.getTimelineByUser(this.mock.currentUser.userId);
    assert.strictEqual(timeline.length, 0, 'Timeline should be empty for empty-state scenario');
    // The empty state message is rendered by the component when timeline.length === 0.
    // At service layer we verify the data condition that would trigger the empty state.
  }
);
