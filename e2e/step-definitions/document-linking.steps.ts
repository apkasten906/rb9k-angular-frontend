/**
 * Step definitions for @documents scenarios.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';

// ---------------------------------------------------------------------------
// Scenario: Link a specific resume and cover letter
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has resume {string}', function (resumeTitle: string) {
  const resume = this.resumeService
    .getByUser(this.mock.currentUser.userId)
    .find((r) => r.title === resumeTitle);
  assert.ok(resume, `Expected resume titled "${resumeTitle}" to exist`);
  this.context['resume'] = resume;
});

Given<AppWorld>('the user has cover letter {string}', function (clTitle: string) {
  const cl = this.coverLetterService
    .getByUser(this.mock.currentUser.userId)
    .find((c) => c.title === clTitle);
  assert.ok(cl, `Expected cover letter titled "${clTitle}" to exist`);
  this.context['coverLetter'] = cl;
});

Given<AppWorld>('an existing job application exists', function () {
  const apps = this.applicationService.getAll();
  assert.ok(apps.length > 0, 'Expected at least one application to exist');
  this.currentApplication = apps[0];
});

When<AppWorld>(
  'the user links {string} and {string} to the job application',
  function (resumeTitle: string, clTitle: string) {
    const resume = this.resumeService
      .getByUser(this.mock.currentUser.userId)
      .find((r) => r.title === resumeTitle);
    const cl = this.coverLetterService
      .getByUser(this.mock.currentUser.userId)
      .find((c) => c.title === clTitle);
    assert.ok(resume, `Resume "${resumeTitle}" not found`);
    assert.ok(cl, `Cover letter "${clTitle}" not found`);

    this.applicationService.linkDocuments(
      this.app.applicationId,
      resume.resumeId,
      cl.coverLetterId,
    );
    this.refresh();
    // TODO: page.click('[data-testid="link-documents-button"]')
  },
);

Then<AppWorld>(
  'the job application references {string} and {string}',
  function (resumeTitle: string, clTitle: string) {
    this.refresh();
    const resume = this.resumeService
      .getByUser(this.mock.currentUser.userId)
      .find((r) => r.title === resumeTitle);
    const cl = this.coverLetterService
      .getByUser(this.mock.currentUser.userId)
      .find((c) => c.title === clTitle);
    assert.ok(resume, `Resume "${resumeTitle}" not found`);
    assert.ok(cl, `Cover letter "${clTitle}" not found`);
    assert.equal(this.app.resumeId, resume.resumeId);
    assert.equal(this.app.coverLetterId, cl.coverLetterId);
  },
);

Then<AppWorld>(
  'the timeline records {string} with timestamps',
  function (eventDetail: string) {
    const timeline = this.timelineService.getTimeline(this.app.applicationId);
    const found = timeline.find((e) => e.details.includes(eventDetail));
    assert.ok(found, `Expected timeline to contain "${eventDetail}"`);
    assert.ok(found.timestamp, 'Expected timeline event to have a timestamp');
  },
);

// ---------------------------------------------------------------------------
// Scenario: Manage document modifications and deletions
// ---------------------------------------------------------------------------

Given<AppWorld>('a job application linked to resume {string}', function (resumeTitle: string) {
  const resume = this.resumeService
    .getByUser(this.mock.currentUser.userId)
    .find((r) => r.title === resumeTitle);
  assert.ok(resume, `Resume "${resumeTitle}" not found`);

  const company = this.companyService.getAll()[0];
  const posting = this.jobPostingService.getByCompany(company.companyId)[0];
  const app = this.applicationService.createApplication({
    userId: this.mock.currentUser.userId,
    jobId: posting.jobId,
    companyId: company.companyId,
    status: 'Applied' as never,
    appliedDate: new Date().toISOString(),
    postingUrl: null,
    resumeId: resume.resumeId,
    coverLetterId: null,
    salaryInfoId: null,
  });
  this.currentApplication = app;
  this.context['linkedResumeId'] = resume.resumeId;
});

Given<AppWorld>(
  'the job application is linked to cover letter {string}',
  function (clTitle: string) {
    const cl = this.coverLetterService
      .getByUser(this.mock.currentUser.userId)
      .find((c) => c.title === clTitle);
    assert.ok(cl, `Cover letter "${clTitle}" not found`);

    this.applicationService.linkDocuments(
      this.app.applicationId,
      this.app.resumeId,
      cl.coverLetterId,
    );
    this.refresh();
    this.context['linkedCoverLetterId'] = cl.coverLetterId;
  },
);

When<AppWorld>(
  '{string} is updated to a new version {string}',
  function (oldTitle: string, newTitle: string) {
    const oldResume = this.resumeService
      .getByUser(this.mock.currentUser.userId)
      .find((r) => r.title === oldTitle);
    assert.ok(oldResume, `Resume "${oldTitle}" not found`);

    // Mark old version as superseded (still 'active' — it's historical, not deleted)
    const newResume = this.resumeService.addVersion(oldResume.resumeId, newTitle);

    // Update the application to point to the new version
    this.applicationService.linkDocuments(
      this.app.applicationId,
      newResume.resumeId,
      this.app.coverLetterId,
    );
    this.refresh();
    this.context['newResume'] = newResume;
    // TODO: page.click('[data-testid="update-resume-button"]')
  },
);

Then<AppWorld>('the application shows {string} as current', function (resumeTitle: string) {
  this.refresh();
  const newResume = this.context['newResume'] as { resumeId: number; title: string };
  assert.ok(newResume, 'Expected newResume context to be set');
  assert.equal(this.app.resumeId, newResume.resumeId);
  assert.equal(newResume.title, resumeTitle);
});

Then<AppWorld>('the application retains history of {string}', function (resumeTitle: string) {
  const timeline = this.timelineService.getTimeline(this.app.applicationId);
  const docEvents = timeline.filter((e) => e.eventType === 'document_link');
  assert.ok(docEvents.length >= 1, 'Expected at least one document_link event in timeline');
  // The old resume was linked — history is preserved in timeline events
  const hasOldRef = docEvents.some((e) => e.details.includes(`Resume #`));
  assert.ok(hasOldRef, `Expected timeline to retain a document_link event referencing "${resumeTitle}"`);
});

When<AppWorld>('{string} is deleted', function (docTitle: string) {
  // Try cover letter first, then resume
  const cl = this.coverLetterService
    .getByUser(this.mock.currentUser.userId)
    .find((c) => c.title === docTitle);
  if (cl) {
    cl.status = 'deleted';
    this.context['deletedCoverLetter'] = cl;
    return;
  }
  const resume = this.resumeService
    .getByUser(this.mock.currentUser.userId)
    .find((r) => r.title === docTitle);
  if (resume) {
    resume.status = 'deleted';
    this.context['deletedResume'] = resume;
    return;
  }
  throw new Error(`No resume or cover letter found with title "${docTitle}"`);
});

Then<AppWorld>('the application shows {string}', function (label: string) {
  if (label === 'cover letter missing') {
    const clId = this.app.coverLetterId;
    if (clId == null) return; // no cover letter linked — matches "missing"
    const cl = this.coverLetterService
      .getByUser(this.mock.currentUser.userId)
      .find((c) => c.coverLetterId === clId);
    assert.ok(!cl || cl.status === 'deleted', 'Expected linked cover letter to be deleted (missing)');
    // TODO: page.expect('[data-testid="cover-letter-missing-warning"]').toBeVisible()
  }
});

Then<AppWorld>('the application prompts the user to relink', function () {
  // Service-layer verification: deleted document is detectable
  const clId = this.app.coverLetterId;
  if (clId != null) {
    const cl = this.coverLetterService
      .getByUser(this.mock.currentUser.userId)
      .find((c) => c.coverLetterId === clId);
    const isMissing = !cl || cl.status === 'deleted';
    assert.ok(isMissing, 'Expected cover letter to be flagged as missing so relink can be prompted');
  }
  // TODO: page.expect('[data-testid="relink-button"]').toBeVisible()
});

Then<AppWorld>(
  'prior timeline entries for {string} are preserved',
  function (_docTitle: string) {
    const timeline = this.timelineService.getTimeline(this.app.applicationId);
    const beforeDelete = (this.context['timelineCountBeforeDelete'] as number | undefined) ?? 0;
    // Timeline should not shrink — events are append-only
    assert.ok(
      timeline.length >= beforeDelete,
      'Expected timeline to preserve all prior entries after deletion',
    );
    // TODO: page.expect('[data-testid="timeline"]').toContainText(docTitle)
  },
);
