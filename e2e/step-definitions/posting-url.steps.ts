/**
 * Step definitions for @posting-url scenarios.
 * Service-layer only — no DOM interaction.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

// ---------------------------------------------------------------------------
// Scenario: URL entered during new-posting creation is saved on both records
// ---------------------------------------------------------------------------

When<AppWorld>(
  'the user creates an application linked to the posting {string} for company {string}',
  function (postingTitle: string, companyName: string) {
    const company = this.companyService.searchByName(companyName)[0];
    assert.ok(company, `Expected company "${companyName}" to exist`);

    const posting = this.jobPostingService
      .getByCompany(company.companyId)
      .find((p) => p.jobTitle === postingTitle);
    assert.ok(posting, `Expected posting "${postingTitle}" to exist for "${companyName}"`);

    const d = new Date();
    const todayStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    const app = this.applicationService.createApplication({
      userId: this.mock.currentUser.userId,
      companyId: company.companyId,
      jobId: posting.jobId,
      status: ApplicationStatus.Applied,
      appliedDate: todayStr,
      postingUrl: posting.postingUrl ?? null,
      resumeId: null,
      coverLetterId: null,
      salaryInfoId: null,
    });
    this.currentApplication = app;
    // TODO: page.select('[data-testid="company-select"]', companyName)
    // TODO: page.select('[data-testid="job-select"]', postingTitle)
    // TODO: page.click('[data-testid="submit-application"]')
  }
);

Then<AppWorld>('the application posting URL is {string}', function (url: string) {
  assert.ok(this.currentApplication, 'Expected a current application');
  assert.equal(
    this.app.postingUrl,
    url,
    `Expected postingUrl "${url}" but got "${this.app.postingUrl}"`
  );
  // TODO: page.expect('[data-testid="posting-url"]').toHaveAttribute('href', url)
});

Then<AppWorld>('the job posting URL is {string}', function (url: string) {
  assert.ok(this.currentApplication, 'Expected a current application');
  const posting = this.jobPostingService.getById(this.app.jobId!);
  assert.ok(posting, 'Expected a linked job posting');
  assert.equal(
    posting.postingUrl,
    url,
    `Expected posting.postingUrl "${url}" but got "${posting.postingUrl}"`
  );
  // TODO: (implicit — URL shown on the form is already asserted via the application)
});

// ---------------------------------------------------------------------------
// Scenario: Edit posting URL on an existing application
// ---------------------------------------------------------------------------

Given<AppWorld>('a job application exists with no posting URL', function () {
  const app = this.applicationService.getById(1);
  assert.ok(app, 'Expected seed application 1 to exist');
  app.postingUrl = null;
  this.currentApplication = app;
  // TODO: page.goto(`/applications/${app.applicationId}`)
});

Given<AppWorld>('a job application exists with posting URL {string}', function (url: string) {
  const app = this.applicationService.getById(1);
  assert.ok(app, 'Expected seed application 1 to exist');
  app.postingUrl = url;
  this.currentApplication = app;
  // TODO: page.goto(`/applications/${app.applicationId}`)
});

When<AppWorld>('the user sets the posting URL to {string}', function (url: string) {
  assert.ok(this.currentApplication, 'Expected a current application');
  this.applicationService.updatePostingUrl(this.app.applicationId, url);
  this.refresh();
  // TODO: page.click('[data-testid="edit-posting-url-btn"]')
  // TODO: page.fill('[data-testid="posting-url-input"]', url)
  // TODO: page.click('[data-testid="save-posting-url-btn"]')
});

When<AppWorld>('the user clears the posting URL', function () {
  assert.ok(this.currentApplication, 'Expected a current application');
  this.applicationService.updatePostingUrl(this.app.applicationId, null);
  this.refresh();
  // TODO: page.click('[data-testid="edit-posting-url-btn"]')
  // TODO: page.clear('[data-testid="posting-url-input"]')
  // TODO: page.click('[data-testid="save-posting-url-btn"]')
});

Then<AppWorld>('the application has no posting URL', function () {
  assert.ok(this.currentApplication, 'Expected a current application');
  assert.equal(
    this.app.postingUrl,
    null,
    `Expected postingUrl to be null but got "${this.app.postingUrl}"`
  );
  // TODO: page.expect('[data-testid="posting-url"]').not.toBeVisible()
});
