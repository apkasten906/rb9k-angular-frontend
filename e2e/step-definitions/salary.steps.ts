/**
 * Step definitions for @salary scenarios.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

// ---------------------------------------------------------------------------
// Scenario: Record salary information from multiple sources
// ---------------------------------------------------------------------------

Given<AppWorld>('a job application exists', function () {
  const company = this.companyService.getAll()[0];
  const posting = this.jobPostingService.getByCompany(company.companyId)[0];
  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    jobId: posting.jobId,
    companyId: company.companyId,
    status: ApplicationStatus.Applied,
    appliedDate: new Date().toISOString().slice(0, 10),
    postingUrl: null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });
  this.currentApplication = app;
  this.context['salary'] = {};
});

When<AppWorld>(
  'the user sets expected salary to {int} {string}',
  function (amount: number, currency: string) {
    const salary = (this.context['salary'] as Record<string, unknown>) ?? {};
    salary['userExpectedSalary'] = amount;
    salary['currency'] = currency;
    this.context['salary'] = salary;
    // TODO: page.fill('[data-testid="expected-salary-input"]', String(amount))
  },
);

When<AppWorld>(
  'the user enters company offer as {int} {string}',
  function (amount: number, currency: string) {
    const salary = (this.context['salary'] as Record<string, unknown>) ?? {};
    salary['companyOfferedSalary'] = amount;
    salary['currency'] = currency;
    this.context['salary'] = salary;
    // TODO: page.fill('[data-testid="offered-salary-input"]', String(amount))
  },
);

When<AppWorld>(
  'salary intelligence returns industry average {int} {string} for region {string}',
  function (amount: number, currency: string, region: string) {
    const salary = (this.context['salary'] as Record<string, unknown>) ?? {};
    salary['industryAverageSalary'] = amount;
    salary['currency'] = currency;
    salary['region'] = region;
    this.context['salary'] = salary;
    // TODO: UI would auto-populate this field from salary intelligence service
  },
);

Then<AppWorld>(
  'salary details store all three values with currency and region',
  function () {
    const pending = this.context['salary'] as {
      userExpectedSalary?: number;
      companyOfferedSalary?: number;
      industryAverageSalary?: number;
      currency?: string;
      region?: string;
    };

    // Persist salary via service (simulates form submit)
    this.salaryService.setSalaryInfo(this.app.applicationId, {
      userExpectedSalary: pending.userExpectedSalary ?? null,
      companyOfferedSalary: pending.companyOfferedSalary ?? null,
      industryAverageSalary: pending.industryAverageSalary ?? null,
      currency: pending.currency ?? null,
      region: pending.region ?? null,
    });

    const stored = this.salaryService.getByApplication(this.app.applicationId);
    assert.ok(stored, 'Expected salary record to be saved');
    assert.equal(stored.userExpectedSalary, pending.userExpectedSalary ?? null);
    assert.equal(stored.companyOfferedSalary, pending.companyOfferedSalary ?? null);
    assert.equal(stored.industryAverageSalary, pending.industryAverageSalary ?? null);
    assert.equal(stored.currency, pending.currency ?? null);
    assert.equal(stored.region, pending.region ?? null);
    // TODO: page.click('[data-testid="save-salary-button"]')
  },
);

Then<AppWorld>(
  'the timeline records each salary update with a timestamp',
  function () {
    const timeline = this.timelineService.getTimeline(this.app.applicationId);
    const salaryEvents = timeline.filter((e) => e.eventType === 'salary_update');
    assert.ok(
      salaryEvents.length > 0,
      'Expected at least one salary_update event in the timeline',
    );
    for (const event of salaryEvents) {
      assert.ok(event.timestamp, 'Expected salary_update event to have a timestamp');
    }
  },
);
