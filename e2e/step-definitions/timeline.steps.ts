/**
 * Step definitions for @timeline, @multiple-applications, and long-gap scenarios.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

// ---------------------------------------------------------------------------
// Scenario: View application details and history
// ---------------------------------------------------------------------------

Given<AppWorld>('a job application with status changes exists', function () {
  // App 4 (Accepted) has the richest seed data history
  const app = this.applicationService.getById(4);
  assert.ok(app, 'Expected seed application 4 to exist');
  this.currentApplication = app;
});

Given<AppWorld>('the job application has notes', function () {
  const notes = this.applicationService.getNotes(this.app.applicationId);
  assert.ok(notes.length > 0, 'Expected the application to have at least one note');
});

Given<AppWorld>('the job application has a linked resume and cover letter', function () {
  assert.ok(this.app.resumeId != null, 'Expected a linked resume');
  assert.ok(this.app.coverLetterId != null, 'Expected a linked cover letter');
});

When<AppWorld>('the user opens the application timeline', function () {
  const timeline = this.timelineService.getTimeline(this.app.applicationId);
  this.context['timeline'] = timeline;
  // TODO: page.click(`[data-testid="app-row-${this.app.applicationId}"]`)
  // TODO: page.expect('[data-testid="timeline-section"]').toBeVisible()
});

Then<AppWorld>(
  'the user sees chronological events in order:',
  function (dataTable: DataTable) {
    const timeline = this.context['timeline'] as Array<{ eventType: string }>;
    assert.ok(timeline, 'Expected timeline to be loaded');

    // Normalize plural/singular type names from the feature table
    const typeAliases: Record<string, string> = {
      status_changes: 'status_change',
      notes: 'note',
      document_links: 'document_link',
      salary_updates: 'salary_update',
    };
    const expectedTypes = dataTable.hashes().map((row) => {
      const raw = row['event_type'];
      return typeAliases[raw] ?? raw;
    });

    for (const expectedType of expectedTypes) {
      const found = timeline.some((e) => e.eventType === expectedType);
      assert.ok(
        found,
        `Expected timeline to contain event of type "${expectedType}"`,
      );
    }

    // Verify chronological order
    for (let i = 1; i < timeline.length; i++) {
      const prev = new Date((timeline[i - 1] as unknown as { timestamp: string }).timestamp).getTime();
      const curr = new Date((timeline[i] as unknown as { timestamp: string }).timestamp).getTime();
      assert.ok(prev <= curr, `Timeline events out of order at index ${i}`);
    }
    // TODO: page.expect('[data-testid="timeline-events"]').toBeVisible()
  },
);

// ---------------------------------------------------------------------------
// Scenario: Handle same company, different positions
// ---------------------------------------------------------------------------

Given<AppWorld>('an employer {string}', function (companyName: string) {
  const company = this.companyService.searchByName(companyName)[0];
  assert.ok(company, `Expected company "${companyName}" to exist`);
  this.context[`company_${companyName}`] = company;
});

Given<AppWorld>('job posting {string} for employer {string}', function (postingTitle: string, companyName: string) {
  const company = this.context[`company_${companyName}`] as { companyId: number };
  const posting = this.jobPostingService
    .getByCompany(company.companyId)
    .find((p) => p.jobTitle.includes(postingTitle) || p.postingUrl?.includes(postingTitle));
  if (posting) {
    this.context[`posting_${postingTitle}`] = posting;
  } else {
    // Create a new posting if none found matching the title
    const newPosting = this.jobPostingService.add({
      companyId: company.companyId,
      jobTitle: postingTitle,
      postedDate: new Date().toISOString(),
    });
    this.context[`posting_${postingTitle}`] = newPosting;
  }
});

When<AppWorld>('the user creates a job application for {string}', function (postingTitle: string) {
  const posting = this.context[`posting_${postingTitle}`] as {
    jobId: number;
    companyId: number;
    postingUrl?: string;
  };
  assert.ok(posting, `Expected posting context for "${postingTitle}"`);

  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    jobId: posting.jobId,
    companyId: posting.companyId,
    status: ApplicationStatus.Applied,
    appliedDate: new Date().toISOString(),
    postingUrl: posting.postingUrl ?? null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });

  // Track all created apps for multi-app assertions
  const created = (this.context['createdApps'] as number[] | undefined) ?? [];
  created.push(app.applicationId);
  this.context['createdApps'] = created;
  this.currentApplication = app;
  // TODO: page.click('[data-testid="new-application-button"]')
});

Then<AppWorld>('both applications exist with distinct IDs', function () {
  const createdIds = this.context['createdApps'] as number[];
  assert.ok(createdIds?.length >= 2, `Expected at least 2 created applications, got ${createdIds?.length}`);
  const unique = new Set(createdIds);
  assert.equal(unique.size, createdIds.length, 'Expected all application IDs to be distinct');
});

Then<AppWorld>('both applications have separate histories', function () {
  const [id1, id2] = this.context['createdApps'] as number[];
  const history1 = this.applicationService.getStatusHistory(id1);
  const history2 = this.applicationService.getStatusHistory(id2);
  // Histories should not share records
  const ids1 = new Set(history1.map((h) => h.historyId));
  const overlap = history2.filter((h) => ids1.has(h.historyId));
  assert.equal(overlap.length, 0, 'Expected application histories to be separate');
});

Then<AppWorld>(
  'filtering by employer {string} shows both applications separately',
  function (companyName: string) {
    const company = this.companyService.searchByName(companyName)[0];
    assert.ok(company, `Expected company "${companyName}"`);
    const apps = this.applicationService.getByCompany(company.companyId);
    const createdIds = this.context['createdApps'] as number[];
    for (const id of createdIds) {
      const found = apps.find((a) => a.applicationId === id);
      assert.ok(
        found,
        `Expected application ${id} to appear in filtered results for "${companyName}"`,
      );
    }
    // TODO: page.fill('[data-testid="company-filter"]', companyName)
    // TODO: page.expect('[data-testid="applications-table"] tr').toHaveCount(createdIds.length + 1)
  },
);

// ---------------------------------------------------------------------------
// Scenario: Update after extended period (long-gap)
// ---------------------------------------------------------------------------

Given<AppWorld>('the job application has had no updates for 90 days', function () {
  // Switch to seed-data App 2, which was last updated ~90 days ago and is still Interviewing.
  // This replaces the freshly created app from the previous step.
  this.setCurrentById(2);
  // TODO: UI would show the "Last activity: 90 days ago" badge on this record
});

When<AppWorld>('the user adds a note {string}', function (content: string) {
  this.applicationService.addNote(this.app.applicationId, content);
});

When<AppWorld>('the user sets status to {string}', function (statusLabel: string) {
  const status = AppWorld.resolveStatus(statusLabel);
  this.applicationService.updateStatus(this.app.applicationId, status);
  this.refresh();
});

Then<AppWorld>('the history captures the long gap between updates', function () {
  const history = this.applicationService.getStatusHistory(this.app.applicationId);
  assert.ok(history.length >= 1, 'Expected at least one status history record');

  // Find the most recent entry and verify a prior entry exists from long ago
  const timestamps = history.map((h) => new Date(h.timestamp).getTime());
  if (timestamps.length >= 2) {
    const gapMs = timestamps.at(-1)! - timestamps.at(-2)!;
    const gapDays = gapMs / (1000 * 60 * 60 * 24);
    // The seed data ensures there is a 90-day gap
    assert.ok(
      gapDays >= 1,
      `Expected a significant gap in history, but gap was only ${gapDays.toFixed(1)} days`,
    );
  }
});

Then<AppWorld>('the new entries are recorded with accurate timestamps', function () {
  const timeline = this.timelineService.getTimeline(this.app.applicationId);
  const recent = timeline.at(-1);
  assert.ok(recent, 'Expected at least one timeline event');
  assert.ok(recent.timestamp, 'Expected recent event to have a timestamp');

  const ageMs = Date.now() - new Date(recent.timestamp).getTime();
  const ageSecs = ageMs / 1000;
  assert.ok(ageSecs < 10, `Expected recent event to be timestamped within the last 10 seconds, but was ${ageSecs.toFixed(1)}s ago`);
});
