/**
 * Step definitions for @create scenarios.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';
import { SalaryInfo } from '../../src/app/core/models/salary-info.model';

// ---------------------------------------------------------------------------
// Scenario: Create application with company and job posting
// ---------------------------------------------------------------------------

Given<AppWorld>('the user selects an employer from company intelligence', function () {
  const company = this.companyService.getAll().find((c) => c.companyName === 'Acme Corp')!;
  this.context['selectedCompany'] = company;
  // TODO: page.click('[data-testid="company-select"]')
});

Given<AppWorld>('a job posting with title {string} exists', function (title: string) {
  const posting = this.jobPostingService.getAll().find((p) => p.jobTitle === title);
  assert.ok(posting, `No posting found with title "${title}"`);
  this.context['selectedPosting'] = posting;
});

Given<AppWorld>('the job posting has a posting URL', function () {
  const posting = this.context['selectedPosting'] as { postingUrl?: string };
  assert.ok(posting?.postingUrl, 'Expected posting to have a postingUrl');
});

Given<AppWorld>('the user has at least one resume saved', function () {
  const resumes = this.resumeService.getByUser(this.mock.currentUser.userId);
  assert.ok(resumes.length > 0, 'Expected at least one saved resume');
});

When<AppWorld>(
  'the user creates a job application linked to the employer and job posting with status {string}',
  function (statusLabel: string) {
    assert.equal(statusLabel, 'Applied', 'New applications must start as "Applied"');
    const company = this.context['selectedCompany'] as { companyId: number };
    const posting = this.context['selectedPosting'] as {
      jobId: number;
      postingUrl?: string;
    };
    const app = this.applicationService.createApplication({
      userId: this.mock.currentUser.userId,
      jobId: posting.jobId,
      companyId: company.companyId,
      status: ApplicationStatus.Applied,
      appliedDate: new Date().toISOString(),
      postingUrl: posting.postingUrl ?? null,
      resumeId: null,
      coverLetterId: null,
      salaryInfoId: null,
    });
    this.currentApplication = app;
    // TODO: page.click('[data-testid="submit-application"]')
  },
);

Then<AppWorld>('the job application is saved with a creation timestamp', function () {
  assert.ok(this.app.appliedDate, 'Expected appliedDate to be set');
  assert.ok(new Date(this.app.appliedDate).getTime() > 0, 'Expected appliedDate to be a valid date');
});

Then<AppWorld>('the application owner is the user', function () {
  assert.equal(this.app.userId, this.mock.currentUser.userId);
});

Then<AppWorld>('the employer and job posting are associated', function () {
  const company = this.context['selectedCompany'] as { companyId: number };
  const posting = this.context['selectedPosting'] as { jobId: number };
  assert.equal(this.app.companyId, company.companyId);
  assert.equal(this.app.jobId, posting.jobId);
});

Then<AppWorld>('the posting URL is stored', function () {
  const posting = this.context['selectedPosting'] as { postingUrl?: string | null };
  assert.equal(this.app.postingUrl, posting.postingUrl ?? null);
});

// ---------------------------------------------------------------------------
// Scenario: Create application with partial data
// ---------------------------------------------------------------------------

Given<AppWorld>('the user selects an employer', function () {
  const company = this.companyService.getAll()[0];
  this.context['selectedCompany'] = company;
});

Given<AppWorld>('no job posting is available', function () {
  this.context['selectedPosting'] = null;
});

When<AppWorld>('the user creates a job application with status {string}', function (statusLabel: string) {
  assert.equal(statusLabel, 'Applied', 'New applications must start as "Applied"');
  const company = this.context['selectedCompany'] as { companyId: number };
  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    jobId: null,
    companyId: company.companyId,
    status: ApplicationStatus.Applied,
    appliedDate: new Date().toISOString(),
    postingUrl: null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });
  this.currentApplication = app;
});

When<AppWorld>('the user leaves salary fields blank', function () {
  // No action needed — salary is not set during creation
});

Then<AppWorld>('the job application is saved', function () {
  assert.ok(this.app.applicationId > 0, 'Expected applicationId to be assigned');
  const found = this.applicationService.getById(this.app.applicationId);
  assert.ok(found, 'Expected to find the application by ID');
});

Then<AppWorld>('salary details fields are null', function (dataTable: DataTable) {
  const salary = this.salaryService.getByApplication(this.app.applicationId) as SalaryInfo | undefined;
  const fieldMap: Record<string, string> = {
    offered: 'companyOfferedSalary',
    expected: 'userExpectedSalary',
    industry_average: 'industryAverageSalary',
  };
  const rows = dataTable.raw().slice(1); // skip header row
  for (const [field] of rows) {
    if (salary) {
      const key = fieldMap[field];
      const value = (salary as unknown as Record<string, unknown>)[key];
      assert.equal(
        value,
        null,
        `Expected salary field "${field}" to be null`,
      );
    }
    // If no salary record exists, all fields are implicitly null — that's fine
  }
});

// ---------------------------------------------------------------------------
// Scenario: Create application with job posting URL
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'the user finds a job posting at URL {string}',
  function (url: string) {
    this.context['postingUrl'] = url;
  },
);

Given<AppWorld>('the job posting has title {string}', function (title: string) {
  this.context['postingTitle'] = title;
});

When<AppWorld>('the user creates a job application with the posting URL', function () {
  const postingUrl = this.context['postingUrl'] as string;
  const company = this.companyService.getAll()[0];
  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    jobId: null,
    companyId: company.companyId,
    status: ApplicationStatus.Applied,
    appliedDate: new Date().toISOString(),
    postingUrl,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });
  this.currentApplication = app;
  // TODO: page.fill('[data-testid="posting-url-input"]', postingUrl)
});

Then<AppWorld>('the job application is saved with the posting URL field', function () {
  assert.ok(this.app.postingUrl, 'Expected postingUrl to be set');
});

Then<AppWorld>('the posting URL is {string}', function (expectedUrl: string) {
  assert.equal(this.app.postingUrl, expectedUrl);
});

Then<AppWorld>('the user can click the URL to return to the original posting', function () {
  assert.ok(this.app.postingUrl, 'Expected postingUrl to be stored so it can be linked');
  // TODO: page.click('[data-testid="posting-url-link"]'); expect URL to match
});
