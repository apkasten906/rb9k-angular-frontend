/**
 * Step definitions for @applied-date scenarios.
 * Service-layer only — no DOM interaction.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

// ---------------------------------------------------------------------------
// Scenario: Set a specific applied date when creating an application
// ---------------------------------------------------------------------------

Given<AppWorld>('the user selects company {string} for a new application', function (name: string) {
  const company = this.companyService.searchByName(name)[0];
  assert.ok(company, `Expected company "${name}" to exist`);
  this.context['selectedCompanyId'] = company.companyId;
  // TODO: page.goto('/applications/new')
  // TODO: page.select('[data-testid="company-select"]', name)
});

When<AppWorld>('the user sets the applied date to {string}', function (dateStr: string) {
  this.context['appliedDate'] = dateStr;
  // TODO: page.fill('[data-testid="applied-date-input"]', dateStr)
});

When<AppWorld>('the user submits the application form', function () {
  const companyId = this.context['selectedCompanyId'] as number;
  const appliedDate = (this.context['appliedDate'] as string | undefined) ?? (() => {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  })();

  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    companyId,
    jobId: null,
    status: ApplicationStatus.Applied,
    appliedDate,
    postingUrl: null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });
  this.currentApplication = app;
  // TODO: page.click('[data-testid="submit-application"]')
});

Then<AppWorld>('the application is saved with applied date {string}', function (dateStr: string) {
  assert.ok(this.currentApplication, 'Expected an application to be created');
  assert.equal(
    this.app.appliedDate,
    dateStr,
    `Expected applied date to be "${dateStr}" but got "${this.app.appliedDate}"`
  );
  // TODO: page.expect('[data-testid="applied-date"]').toContainText(dateStr)
});

Then<AppWorld>('the stored applied date contains no time component', function () {
  assert.ok(this.currentApplication, 'Expected an application to be created');
  assert.ok(
    !this.app.appliedDate.includes('T'),
    `Expected appliedDate to contain no time component but got "${this.app.appliedDate}"`
  );
  // TODO: page.expect('[data-testid="applied-date"]').not.toContainText('T')
});

// ---------------------------------------------------------------------------
// Scenario: Applied date defaults to today when not specified
// ---------------------------------------------------------------------------

When<AppWorld>('the user submits the application form without changing the applied date', function () {
  const companyId = this.context['selectedCompanyId'] as number;
  const d = new Date();
  const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');

  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    companyId,
    jobId: null,
    status: ApplicationStatus.Applied,
    appliedDate: today,
    postingUrl: null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });
  this.currentApplication = app;
  this.context['expectedAppliedDate'] = today;
  // TODO: page.click('[data-testid="submit-application"]')
});

Then<AppWorld>("the application is saved with today's applied date", function () {
  const expectedDate = this.context['expectedAppliedDate'] as string;
  assert.ok(this.currentApplication, 'Expected an application to be created');
  assert.equal(
    this.app.appliedDate,
    expectedDate,
    `Expected applied date to be today (${expectedDate}) but got "${this.app.appliedDate}"`
  );
  // TODO: page.expect('[data-testid="applied-date"]').toContainText(expectedDate)
});

// ---------------------------------------------------------------------------
// Scenario: Edit applied date after creation
// ---------------------------------------------------------------------------

Given<AppWorld>('a job application exists with applied date {string}', function (dateStr: string) {
  // Use seed application 1 (Applied) and forcibly set its applied date
  const app = this.applicationService.getById(1);
  assert.ok(app, 'Expected seed application 1 to exist');
  app.appliedDate = dateStr;
  this.currentApplication = app;
  // TODO: page.goto(`/applications/${app.applicationId}`)
});

When<AppWorld>('the user changes the applied date to {string}', function (dateStr: string) {
  assert.ok(this.currentApplication, 'Expected a current application');
  this.applicationService.updateAppliedDate(
    this.app.applicationId,
    dateStr
  );
  this.refresh();
  // TODO: page.click('[data-testid="edit-applied-date-btn"]')
  // TODO: page.fill('[data-testid="applied-date-input"]', dateStr)
  // TODO: page.click('[data-testid="save-applied-date-btn"]')
});

Then<AppWorld>('the application applied date is updated to {string}', function (dateStr: string) {
  assert.equal(
    this.app.appliedDate,
    dateStr,
    `Expected applied date "${dateStr}" but got "${this.app.appliedDate}"`
  );
  // TODO: page.expect('[data-testid="applied-date"]').toContainText(dateStr)
});

Then<AppWorld>('a date change event is recorded in the timeline', function () {
  const timeline = this.timelineService.getTimeline(this.app.applicationId);
  const dateChangeEvent = timeline.find((e) => e.eventType === 'date_change');
  assert.ok(dateChangeEvent, 'Expected a "date_change" event in the timeline');
  assert.ok(dateChangeEvent.details.includes('Applied date changed'));
  // TODO: page.expect('[data-testid="timeline-events"]').toContainText('Applied date changed')
});
