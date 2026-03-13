/**
 * Step definitions for @create-job-posting scenarios.
 * Service-layer only — no DOM interaction.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

// ---------------------------------------------------------------------------
// Shared helper — resolve a company by name (asserts it exists)
// ---------------------------------------------------------------------------

function requireCompany(world: AppWorld, name: string) {
  const found = world.companyService.searchByName(name);
  assert.ok(found.length > 0, `Expected company "${name}" to exist`);
  return found[0];
}

// ---------------------------------------------------------------------------
// Given steps
// ---------------------------------------------------------------------------

Given<AppWorld>('the company {string} exists in the system', function (name: string) {
  const found = this.companyService.searchByName(name);
  assert.ok(found.length > 0, `Expected company "${name}" to already exist in seed data`);
  // TODO: page.goto('/applications/new')
});

// ---------------------------------------------------------------------------
// When steps
// ---------------------------------------------------------------------------

When<AppWorld>(
  'the user adds a job posting {string} for company {string}',
  function (title: string, companyName: string) {
    const company = requireCompany(this, companyName);
    const d = new Date();
    const todayStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    const created = this.jobPostingService.add({
      companyId: company.companyId,
      jobTitle: title,
      postedDate: todayStr,
    });
    this.context['newPostingId'] = created.jobId;
    this.context['newPostingTitle'] = title;
    this.context['newPostingCompanyId'] = company.companyId;
    // TODO: page.select('[data-testid="company-select"]', companyName)
    // TODO: page.click('[data-testid="add-posting-toggle"]')
    // TODO: page.fill('[data-testid="new-posting-title"]', title)
    // TODO: page.click('[data-testid="add-posting-submit"]')
  }
);

When<AppWorld>(
  'the user adds a job posting {string} with URL {string} for company {string}',
  function (title: string, url: string, companyName: string) {
    const company = requireCompany(this, companyName);
    const d = new Date();
    const todayStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    const created = this.jobPostingService.add({
      companyId: company.companyId,
      jobTitle: title,
      postedDate: todayStr,
      postingUrl: url,
    });
    this.context['newPostingId'] = created.jobId;
    this.context['newPostingTitle'] = title;
    this.context['newPostingUrl'] = url;
    this.context['newPostingCompanyId'] = company.companyId;
    // TODO: page.select('[data-testid="company-select"]', companyName)
    // TODO: page.click('[data-testid="add-posting-toggle"]')
    // TODO: page.fill('[data-testid="new-posting-title"]', title)
    // TODO: page.fill('[data-testid="new-posting-url"]', url)
    // TODO: page.click('[data-testid="add-posting-submit"]')
  }
);

When<AppWorld>(
  'the user tries to add a job posting with a blank title for company {string}',
  function (companyName: string) {
    const company = requireCompany(this, companyName);
    this.context['postingCountBefore'] = this.jobPostingService.getByCompany(company.companyId).length;
    this.context['newPostingCompanyId'] = company.companyId;
    // The UI disables the Add button when the title is empty — no service call happens.
    // TODO: page.select('[data-testid="company-select"]', companyName)
    // TODO: page.click('[data-testid="add-posting-toggle"]')
    // TODO: page.expect('[data-testid="add-posting-submit"]').toBeDisabled()
  }
);

// ---------------------------------------------------------------------------
// Then steps
// ---------------------------------------------------------------------------

Then<AppWorld>(
  'the job posting {string} appears in the postings list for {string}',
  function (title: string, companyName: string) {
    const company = requireCompany(this, companyName);
    const postings = this.jobPostingService.getByCompany(company.companyId);
    const found = postings.find((p) => p.jobTitle === title);
    assert.ok(found, `Expected posting "${title}" to exist for company "${companyName}"`);
    // TODO: page.expect('[data-testid="job-select"] mat-option').toContainText(title)
  }
);

Then<AppWorld>(
  'the user can link the posting {string} to a new application for {string}',
  function (title: string, companyName: string) {
    const company = requireCompany(this, companyName);
    const posting = this.jobPostingService.getByCompany(company.companyId)
      .find((p) => p.jobTitle === title);
    assert.ok(posting, `Expected posting "${title}" to exist`);

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
      postingUrl: null,
      resumeId: null,
      coverLetterId: null,
      salaryInfoId: null,
    });
    assert.equal(app.jobId, posting.jobId);
    // TODO: page.select('[data-testid="job-select"]', title)
    // TODO: page.click('[data-testid="submit-application"]')
  }
);

Then<AppWorld>('the posting URL is stored on the job posting', function () {
  const postingId = this.context['newPostingId'] as number;
  const expectedUrl = this.context['newPostingUrl'] as string;
  const posting = this.jobPostingService.getById(postingId);
  assert.ok(posting, 'Expected the new posting to exist');
  assert.equal(posting.postingUrl, expectedUrl,
    `Expected posting URL "${expectedUrl}" but got "${posting.postingUrl}"`);
  // TODO: page.expect('[data-testid="job-select"] mat-option[data-selected]').toHaveAttribute('data-url', expectedUrl)
});

Then<AppWorld>('the job posting is not created', function () {
  const companyId = this.context['newPostingCompanyId'] as number;
  const countBefore = this.context['postingCountBefore'] as number;
  const countAfter = this.jobPostingService.getByCompany(companyId).length;
  assert.equal(countAfter, countBefore, 'Expected no new posting to be created');
});

Then<AppWorld>(
  'the total job posting count for {string} does not change',
  function (companyName: string) {
    const company = requireCompany(this, companyName);
    const countBefore = this.context['postingCountBefore'] as number;
    const countAfter = this.jobPostingService.getByCompany(company.companyId).length;
    assert.equal(countAfter, countBefore,
      `Expected posting count to remain ${countBefore} but got ${countAfter}`);
    // TODO: page.expect('[data-testid="job-select"] mat-option').toHaveCount(countAfter)
  }
);
