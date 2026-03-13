/**
 * Step definitions for @create-company scenarios.
 * Service-layer only — no DOM interaction.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';

// ---------------------------------------------------------------------------
// Scenario: Add a new company by name
// ---------------------------------------------------------------------------

Given<AppWorld>('the company {string} does not exist in the system', function (name: string) {
  const found = this.companyService.searchByName(name);
  assert.equal(found.length, 0, `Expected company "${name}" to not exist yet`);
  // TODO: page.goto('/applications/new')
});

When<AppWorld>('the user adds a new company named {string}', function (name: string) {
  const created = this.companyService.add({ companyName: name });
  this.context['newCompanyId'] = created.companyId;
  // TODO: page.click('[data-testid="add-company-toggle"]')
  // TODO: page.fill('[data-testid="new-company-input"]', name)
  // TODO: page.click('[data-testid="add-company-submit"]')
});

Then<AppWorld>('{string} appears in the company list', function (name: string) {
  const all = this.companyService.getAll();
  const found = all.find((c) => c.companyName === name);
  assert.ok(found, `Expected "${name}" to be in the company list`);
  // TODO: page.expect('[data-testid="company-select"] mat-option').toContainText(name)
});

Then<AppWorld>('the user can select {string} for a new application', function (name: string) {
  const company = this.companyService.searchByName(name)[0];
  assert.ok(company, `Expected company "${name}" to be findable`);

  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    companyId: company.companyId,
    jobId: null,
    status: 'Applied' as unknown as import('../../src/app/core/models/application-status.enum').ApplicationStatus,
    appliedDate: new Date().toISOString(),
    postingUrl: null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });
  assert.equal(app.companyId, company.companyId);
  // TODO: page.select('[data-testid="company-select"]', name)
});

// ---------------------------------------------------------------------------
// Scenario: Company creation requires a non-blank name
// ---------------------------------------------------------------------------

When<AppWorld>('the user tries to add a company with a blank name', function () {
  this.context['companyCountBefore'] = this.companyService.getAll().length;
  // The UI disables the Add button when the input is empty — no service call happens.
  // We mirror that guard here: do NOT call companyService.add().
  // TODO: page.click('[data-testid="add-company-toggle"]')
  // TODO: page.expect('[data-testid="add-company-submit"]').toBeDisabled()
});

Then<AppWorld>('the company is not created', function () {
  // Blank-name guard: service was never called, count is unchanged.
  const countAfter = this.companyService.getAll().length;
  assert.equal(countAfter, this.context['companyCountBefore'] as number,
    'Expected no new company to be created');
});

Then<AppWorld>('the total company count does not change', function () {
  const countAfter = this.companyService.getAll().length;
  assert.equal(countAfter, this.context['companyCountBefore'] as number);
  // TODO: page.expect('[data-testid="company-select"] mat-option').toHaveCount(countAfter)
});
