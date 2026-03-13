/**
 * Shared step definitions — used across multiple feature scenario groups.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

Given<AppWorld>('the current timestamp is {string}', function (timestamp: string) {
  this.context['scenarioTimestamp'] = timestamp;
});

// ---------------------------------------------------------------------------
// Set up an application at a given status by creating and advancing it
// ---------------------------------------------------------------------------

Given<AppWorld>('a job application in status {string}', function (statusLabel: string) {
  const targetStatus = AppWorld.resolveStatus(statusLabel);

  // Create a base Applied application
  const company = this.companyService.getAll()[0];
  const posting = this.jobPostingService.getByCompany(company.companyId)[0];
  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    jobId: posting.jobId,
    companyId: company.companyId,
    status: ApplicationStatus.Applied,
    appliedDate: new Date().toISOString().slice(0, 10),
    postingUrl: posting.postingUrl ?? null,
    resumeId: null,
    coverLetterId: null,
    salaryInfoId: null,
  });

  // Advance through transitions to reach the target status
  const path: ApplicationStatus[] = buildPath(ApplicationStatus.Applied, targetStatus);
  for (const status of path) {
    this.applicationService.updateStatus(app.applicationId, status);
  }

  this.currentApplication = this.applicationService.getById(app.applicationId)!;
});

/** Build the ordered transition path from a start status to the target. */
function buildPath(from: ApplicationStatus, to: ApplicationStatus): ApplicationStatus[] {
  if (from === to) return [];
  const ORDERED: ApplicationStatus[] = [
    ApplicationStatus.Applied,
    ApplicationStatus.Interviewing,
    ApplicationStatus.Offer,
  ];
  const terminals: ApplicationStatus[] = [
    ApplicationStatus.Accepted,
    ApplicationStatus.OfferDeclined,
    ApplicationStatus.OfferRescinded,
    ApplicationStatus.Rejected,
    ApplicationStatus.Withdrawn,
  ];
  if (terminals.includes(to)) {
    if (to === ApplicationStatus.Withdrawn) {
      // Withdrawn is reachable from any non-terminal — already at `from`
      return [to];
    }
    if (to === ApplicationStatus.Rejected) {
      // Rejected only from Applied or Interviewing
      const fromIdx = ORDERED.indexOf(from);
      const targetIdx = ORDERED.indexOf(ApplicationStatus.Interviewing);
      const intermediate = fromIdx < targetIdx ? ORDERED.slice(fromIdx + 1, targetIdx + 1) : [];
      return [...intermediate, to];
    }
    // Offer-terminal (Accepted, OfferDeclined, OfferRescinded) — must reach Offer first
    const fromIdx = ORDERED.indexOf(from);
    const offerIdx = ORDERED.indexOf(ApplicationStatus.Offer);
    const intermediate = fromIdx < offerIdx ? ORDERED.slice(fromIdx + 1, offerIdx + 1) : [];
    return [...intermediate, to];
  }
  const fromIdx = ORDERED.indexOf(from);
  const toIdx = ORDERED.indexOf(to);
  return ORDERED.slice(fromIdx + 1, toIdx + 1);
}

// ---------------------------------------------------------------------------
// Common mutation steps
// ---------------------------------------------------------------------------

When<AppWorld>('the user updates status to {string}', function (statusLabel: string) {
  const status = AppWorld.resolveStatus(statusLabel);
  this.applicationService.updateStatus(this.app.applicationId, status);
  this.refresh();
});

When<AppWorld>('the user adds note {string}', function (content: string) {
  this.applicationService.addNote(this.app.applicationId, content);
});

// ---------------------------------------------------------------------------
// Common assertion steps
// ---------------------------------------------------------------------------

Then<AppWorld>('the final status is {string}', function (statusLabel: string) {
  this.refresh();
  const expected = AppWorld.resolveStatus(statusLabel);
  assert.equal(this.app.status, expected, `Expected status "${expected}" but got "${this.app.status}"`);
});

Then<AppWorld>('no further forward transitions are allowed', function () {
  this.refresh();
  const transitions = this.applicationService.getAvailableTransitions(this.app.applicationId);
  assert.equal(
    transitions.length,
    0,
    `Expected no transitions, but found: ${transitions.join(', ')}`,
  );
});
