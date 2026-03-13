/**
 * Step definitions for @status workflow scenarios.
 * TODO: replace service calls with Playwright page.xxx() for UI layer.
 */
import { When, Then, DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';

// ---------------------------------------------------------------------------
// Scenario: Update application status through workflow with notes
// ---------------------------------------------------------------------------

Then<AppWorld>(
  'the status history records the following transitions:',
  function (dataTable: DataTable) {
    const rows = dataTable.hashes(); // [{from, to, timestamp}]
    const history = this.applicationService.getStatusHistory(this.app.applicationId);

    assert.ok(
      history.length >= rows.length,
      `Expected at least ${rows.length} history records, got ${history.length}`,
    );

    for (let i = 0; i < rows.length; i++) {
      const expected = rows[i];
      const actual = history[i];
      if (expected['from']) assert.equal(actual.from, expected['from']);
      if (expected['to']) assert.equal(actual.to, expected['to']);
      // timestamp column presence is sufficient — we just check it's set
      assert.ok(actual.timestamp, `Expected timestamp on history record ${i}`);
    }
  },
);

Then<AppWorld>('both notes are stored and shown in chronological order', function () {
  const notes = this.applicationService.getNotes(this.app.applicationId);
  assert.ok(notes.length >= 2, `Expected at least 2 notes, got ${notes.length}`);

  for (let i = 1; i < notes.length; i++) {
    const prev = new Date(notes[i - 1].createdAt).getTime();
    const curr = new Date(notes[i].createdAt).getTime();
    assert.ok(prev <= curr, 'Notes should be in chronological order');
  }
});

// ---------------------------------------------------------------------------
// Scenario: Rejected status is not reachable from Offer
// ---------------------------------------------------------------------------

Then<AppWorld>('the status {string} is not an available transition', function (statusLabel: string) {
  const status = AppWorld.resolveStatus(statusLabel);
  const transitions = this.applicationService.getAvailableTransitions(this.app.applicationId);
  assert.ok(
    !transitions.includes(status),
    `Expected "${status}" to NOT be in available transitions [${transitions.join(', ')}]`,
  );
});
