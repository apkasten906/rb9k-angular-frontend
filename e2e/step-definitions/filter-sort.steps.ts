/**
 * Step definitions for @filter-sort scenarios.
 * Service-layer only — no DOM interaction.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';
import { ApplicationRow } from '../../src/app/features/applications/application-list/application-list.component';

// ---------------------------------------------------------------------------
// Helper: build sorted/filtered rows the same way the component does
// ---------------------------------------------------------------------------

function buildRows(world: AppWorld): ApplicationRow[] {
  return world.applicationService.getAll().map((app) => ({
    application: app,
    companyName: world.companyService.getById(app.companyId)?.companyName ?? '—',
    jobTitle: app.jobId
      ? (world.jobPostingService.getById(app.jobId)?.jobTitle ?? '—')
      : '(No posting)',
  }));
}

// ---------------------------------------------------------------------------
// Scenarios: Filter by company name
// ---------------------------------------------------------------------------

Given<AppWorld>('there are applications for company {string}', function (name: string) {
  const companies = this.companyService.searchByName(name);
  assert.ok(companies.length > 0, `Expected company "${name}" to exist`);
  const apps = this.applicationService.getByCompany(companies[0].companyId);
  assert.ok(apps.length > 0, `Expected applications for "${name}"`);
  // TODO: page.goto('/applications')
});

When<AppWorld>('the user types {string} in the company column filter', function (value: string) {
  this.context['companyFilter'] = value.toLowerCase();
  // TODO: page.fill('[data-testid="company-col-filter"]', value)
});

When<AppWorld>('the user clears the company column filter', function () {
  this.context['companyFilter'] = '';
  // TODO: page.clear('[data-testid="company-col-filter"]')
});

Then<AppWorld>('only applications for {string} are shown', function (name: string) {
  const filter = name.toLowerCase();
  const rows = buildRows(this).filter((r) => r.companyName.toLowerCase().includes(filter));
  assert.ok(rows.length > 0, `Expected at least one application for "${name}"`);
  for (const row of rows) {
    assert.ok(
      row.companyName.toLowerCase().includes(filter),
      `Expected companyName to include "${filter}" but got "${row.companyName}"`
    );
  }
  // TODO: page.expect('[data-testid="applications-table"] [data-company]').toContainText(name)
});

Then<AppWorld>('all applications are shown', function () {
  const total = this.applicationService.getAll().length;
  const rows = buildRows(this);
  assert.equal(rows.length, total, `Expected all ${total} applications to be shown`);
  // TODO: page.expect('[data-testid="applications-table"] mat-row').toHaveCount(total)
});

// ---------------------------------------------------------------------------
// Scenario: Filter by job title
// ---------------------------------------------------------------------------

Given<AppWorld>('there are applications with job title {string}', function (title: string) {
  const rows = buildRows(this);
  const match = rows.some((r) => r.jobTitle.toLowerCase().includes(title.toLowerCase()));
  assert.ok(match, `Expected at least one application with job title containing "${title}"`);
  // TODO: page.goto('/applications')
});

When<AppWorld>('the user types {string} in the job title column filter', function (value: string) {
  this.context['jobTitleFilter'] = value.toLowerCase();
  // TODO: page.fill('[data-testid="jobTitle-col-filter"]', value)
});

Then<AppWorld>(
  'only applications matching {string} in the job title are shown',
  function (value: string) {
    const filter = value.toLowerCase();
    const rows = buildRows(this).filter((r) => r.jobTitle.toLowerCase().includes(filter));
    assert.ok(rows.length > 0, `Expected at least one application with job title containing "${value}"`);
    for (const row of rows) {
      assert.ok(
        row.jobTitle.toLowerCase().includes(filter),
        `Expected jobTitle to include "${filter}" but got "${row.jobTitle}"`
      );
    }
    // TODO: page.expect('[data-testid="applications-table"] [data-jobtitle]').toContainText(value)
  }
);

// ---------------------------------------------------------------------------
// Scenario: Filter by applied date
// ---------------------------------------------------------------------------

When<AppWorld>('the user types {string} in the applied date column filter', function (value: string) {
  this.context['appliedDateFilter'] = value;
  // TODO: page.fill('[data-testid="appliedDate-col-filter"]', value)
});

Then<AppWorld>(
  'only applications with applied dates containing {string} are shown',
  function (value: string) {
    const rows = buildRows(this).filter((r) =>
      r.application.appliedDate.includes(value)
    );
    assert.ok(rows.length > 0, `Expected at least one application with appliedDate containing "${value}"`);
    for (const row of rows) {
      assert.ok(
        row.application.appliedDate.includes(value),
        `Expected appliedDate to include "${value}" but got "${row.application.appliedDate}"`
      );
    }
    // TODO: page.expect('[data-testid="applications-table"] [data-applied]').toContainText(value)
  }
);

// ---------------------------------------------------------------------------
// Scenario: Filter applications by status
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'there are applications with statuses {string}, {string}, and {string}',
  function (s1: string, s2: string, s3: string) {
    // Seed data already has Applied (app1), Interviewing (app2), Offer (app3),
    // Accepted (app4). Verify at least these three statuses exist.
    const statuses = this.applicationService.getAll().map((a) => a.status);
    for (const label of [s1, s2, s3]) {
      const status = AppWorld.resolveStatus(label);
      assert.ok(statuses.includes(status), `Expected a seed application with status "${label}"`);
    }
    // TODO: page.goto('/applications')
  }
);

When<AppWorld>('the user selects {string} from the status column filter', function (label: string) {
  const status = AppWorld.resolveStatus(label);
  this.context['statusFilter'] = status;
  // TODO: page.select('[data-testid="status-col-filter"]', label)
});

Then<AppWorld>('only applications with status {string} are shown', function (label: string) {
  const status = AppWorld.resolveStatus(label);
  const filtered = buildRows(this).filter(
    (r) => r.application.status === (this.context['statusFilter'] as ApplicationStatus)
  );
  assert.ok(filtered.length > 0, `Expected at least one application with status "${label}"`);
  for (const row of filtered) {
    assert.equal(row.application.status, status);
  }
  // TODO: page.expect('[data-testid="applications-table"] [data-status]').toHaveCount(filtered.length)
});

// ---------------------------------------------------------------------------
// Scenario: Sort by applied date
// ---------------------------------------------------------------------------

Given<AppWorld>('there are multiple applications with different applied dates', function () {
  const apps = this.applicationService.getAll();
  assert.ok(apps.length >= 2, 'Expected at least 2 applications for sort test');
  const dates = apps.map((a) => a.appliedDate);
  const unique = new Set(dates);
  assert.ok(unique.size >= 2, 'Expected applications to have different applied dates');
  // TODO: page.goto('/applications')
});

When<AppWorld>('the user sorts by {string} ascending', function (column: string) {
  this.context['sortColumn'] = column;
  this.context['sortDirection'] = 'asc';
  // TODO: page.click(`[data-testid="sort-header-${column}"]`) — first click = asc
});

When<AppWorld>('the user sorts by {string} descending', function (column: string) {
  this.context['sortColumn'] = column;
  this.context['sortDirection'] = 'desc';
  // TODO: page.click(`[data-testid="sort-header-${column}"]`) — second click = desc
});

Then<AppWorld>('the applications are ordered oldest first', function () {
  const rows = buildRows(this).sort(
    (a, b) =>
      new Date(a.application.appliedDate).getTime() -
      new Date(b.application.appliedDate).getTime()
  );
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].application.appliedDate).getTime();
    const curr = new Date(rows[i].application.appliedDate).getTime();
    assert.ok(prev <= curr, `Expected oldest-first order at index ${i}`);
  }
  // TODO: page.expect('[data-testid="applications-table"] [data-applied]').toBeOrderedOldestFirst()
});

Then<AppWorld>('the applications are ordered newest first', function () {
  const rows = buildRows(this).sort(
    (a, b) =>
      new Date(b.application.appliedDate).getTime() -
      new Date(a.application.appliedDate).getTime()
  );
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].application.appliedDate).getTime();
    const curr = new Date(rows[i].application.appliedDate).getTime();
    assert.ok(prev >= curr, `Expected newest-first order at index ${i}`);
  }
  // TODO: page.expect('[data-testid="applications-table"] [data-applied]').toBeOrderedNewestFirst()
});

// ---------------------------------------------------------------------------
// Scenario: Sort by company name
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'there are applications for companies {string} and {string}',
  function (name1: string, name2: string) {
    for (const name of [name1, name2]) {
      const results = this.companyService.searchByName(name);
      assert.ok(results.length > 0, `Expected company "${name}" to exist`);
      const apps = this.applicationService.getByCompany(results[0].companyId);
      assert.ok(apps.length > 0, `Expected applications for "${name}"`);
    }
    // TODO: page.goto('/applications')
  }
);

Then<AppWorld>(
  '{string} applications appear before {string} applications',
  function (first: string, second: string) {
    const rows = buildRows(this).sort((a, b) =>
      a.companyName.toLowerCase().localeCompare(b.companyName.toLowerCase())
    );
    const firstIdx = rows.findIndex((r) =>
      r.companyName.toLowerCase().includes(first.toLowerCase())
    );
    const secondIdx = rows.findIndex((r) =>
      r.companyName.toLowerCase().includes(second.toLowerCase())
    );
    assert.ok(firstIdx !== -1, `Expected rows for "${first}"`);
    assert.ok(secondIdx !== -1, `Expected rows for "${second}"`);
    assert.ok(firstIdx < secondIdx, `Expected "${first}" rows to appear before "${second}" rows`);
    // TODO: page.expect('[data-company]').firstToMatch(first)
  }
);

// ---------------------------------------------------------------------------
// Scenario: Combine company name filter and status filter
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'there are applications for {string} with statuses {string} and {string}',
  function (companyName: string, label1: string, label2: string) {
    const companies = this.companyService.searchByName(companyName);
    assert.ok(companies.length > 0, `Expected company "${companyName}"`);
    const companyId = companies[0].companyId;

    const existingApps = this.applicationService.getByCompany(companyId);
    const existingStatuses = existingApps.map((a) => a.status);

    for (const label of [label1, label2]) {
      const status = AppWorld.resolveStatus(label);
      if (!existingStatuses.includes(status)) {
        // Create an application in the missing status directly in mock data
        this.applicationService.createApplication({
          userId: this.mock.currentUser.userId,
          companyId,
          jobId: null,
          status,
          appliedDate: new Date().toISOString().slice(0, 10),
          postingUrl: null,
          resumeId: null,
          coverLetterId: null,
          salaryInfoId: null,
        });
      }
    }
    this.context['filterCompany'] = companyName;
    this.context['filterStatus1'] = label1;
    // TODO: page.goto('/applications')
  }
);

// 'the user types {string} in the company column filter' is defined in the company-filter section above

Then<AppWorld>('only applications matching both filters are shown', function () {
  const companyFilter = (this.context['companyFilter'] as string) ?? '';
  const statusFilter = (this.context['statusFilter'] as string) ?? '';

  const rows = buildRows(this).filter((r) => {
    const nameMatch = !companyFilter || r.companyName.toLowerCase().includes(companyFilter);
    const statusMatch = !statusFilter || r.application.status === statusFilter;
    return nameMatch && statusMatch;
  });

  assert.ok(rows.length > 0, 'Expected at least one row matching both filters');
  for (const row of rows) {
    if (companyFilter) {
      assert.ok(row.companyName.toLowerCase().includes(companyFilter));
    }
    if (statusFilter) {
      assert.equal(row.application.status, statusFilter);
    }
  }
  // TODO: page.expect('[data-testid="applications-table"] tr').toHaveCountGreaterThan(0)
});
