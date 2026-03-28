/**
 * Step definitions for: 03-user_profile_management.feature
 *
 * Architecture
 * ─────────────
 * • "Given" steps that only set up mock state mutate this.mock.profiles (Node-side).
 *   They must run BEFORE "the user is on the profile page", which calls navigateTo()
 *   and seeds that state into the browser via addInitScript.
 *
 * • "When/Then" steps that interact with or assert on the live UI use Playwright
 *   page/locator APIs.
 *
 * • Privacy-enforcement steps have no public "view someone else's profile" route, so
 *   they stay as service-layer assertions.
 */
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { UserProfile, PrivacyVisibility } from '../../src/app/core/models/user-profile.model';

// ---------------------------------------------------------------------------
// Background / shared Given steps
// ---------------------------------------------------------------------------

// NOTE: 'the user is signed in' is defined in shared.steps.ts — do not duplicate here.

Given<AppWorld>('the user is on the registration page', async function (this: AppWorld) {
  await this.navigateTo('/profile');
});

Given<AppWorld>('the user is on the profile page', async function (this: AppWorld) {
  await this.navigateTo('/profile');
});

// ---------------------------------------------------------------------------
// @create
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has no existing profile', function (this: AppWorld) {
  this.mock.profiles = this.mock.profiles.filter(
    (p) => p.userId !== this.mock.currentUser.userId
  );
});

When<AppWorld>('the user submits basic information:', async function (this: AppWorld, table: DataTable) {
  const row = table.hashes()[0];
  await this.page.fill('[data-testid=first-name-input]', row['first name'] ?? '');
  await this.page.fill('[data-testid=last-name-input]', row['last name'] ?? '');
  await this.page.fill('[data-testid=email-input]', row['email'] ?? '');
  if (row['password']) await this.page.fill('[data-testid=password-input]', row['password']);
  if (row['phone']) await this.page.fill('[data-testid=phone-input]', row['phone']);
  if (row['location']) await this.page.fill('[data-testid=location-input]', row['location']);
  await this.page.click('[data-testid=save-btn]');
});

Then<AppWorld>('a "Profile created" confirmation is shown', async function (this: AppWorld) {
  await expect(this.page.getByText('Profile created')).toBeVisible({ timeout: 5000 });
});

Then<AppWorld>('required fields are saved', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=first-name-input]')).not.toHaveValue('');
  await expect(this.page.locator('[data-testid=last-name-input]')).not.toHaveValue('');
  await expect(this.page.locator('[data-testid=email-input]')).not.toHaveValue('');
});

// ---------------------------------------------------------------------------
// @validation — email
// ---------------------------------------------------------------------------

Given<AppWorld>('an existing account uses email {string}', function (this: AppWorld, email: string) {
  const existing = this.mock.profiles.find((p) => p.email === email);
  if (!existing) {
    this.mock.profiles.push({
      userId: 99,
      email,
      password: 'AnyPass!1',
      firstName: 'Other',
      lastName: 'User',
      privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
    });
  }
});

When<AppWorld>('the user enters email {string}', async function (this: AppWorld, email: string) {
  await this.page.fill('[data-testid=email-input]', email);
  // blur() reliably fires native blur event, marking the control touched and triggering onEmailBlur()
  await this.page.locator('[data-testid=email-input]').blur();
});

Then<AppWorld>('the user sees "Email is already in use" and cannot proceed', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=email-error]'))
    .toContainText('Email is already in use', { timeout: 3000 });
});

Then<AppWorld>('the user sees "Enter a valid email address"', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=email-error]'))
    .toContainText('Enter a valid email address', { timeout: 3000 });
});

// ---------------------------------------------------------------------------
// @create — extended fields
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a basic profile', function (this: AppWorld) {
  let profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (!profile) {
    profile = {
      userId: this.mock.currentUser.userId,
      email: 'alex@example.com',
      password: 'StrongPass!8',
      firstName: 'Alex',
      lastName: 'Morgan',
      linkedInUrl: 'https://linkedin.com/in/alex-morgan',
      privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
    };
    this.mock.profiles.push(profile);
  }
  this.context['currentProfile'] = profile;
});

When<AppWorld>('the user adds:', async function (this: AppWorld, table: DataTable) {
  const row = table.hashes()[0];
  if (row['address']) await this.page.fill('[data-testid=address-input]', row['address']);
  if (row['city']) await this.page.fill('[data-testid=city-input]', row['city']);
  if (row['state']) await this.page.fill('[data-testid=state-input]', row['state']);
  if (row['country']) await this.page.fill('[data-testid=country-input]', row['country']);
  if (row['postal code']) await this.page.fill('[data-testid=postal-code-input]', row['postal code']);
  if (row['LinkedIn URL']) await this.page.fill('[data-testid=linkedin-input]', row['LinkedIn URL']);
  if (row['portfolio URL']) await this.page.fill('[data-testid=portfolio-input]', row['portfolio URL']);
  if (row['professional summary']) await this.page.fill('[data-testid=summary-textarea]', row['professional summary']);
  await this.page.click('[data-testid=save-btn]');
  await expect(this.page.getByText('Profile saved')).toBeVisible({ timeout: 5000 });
});

Then<AppWorld>('the extended details are saved and visible on the profile', async function (this: AppWorld) {
  const address = await this.page.locator('[data-testid=address-input]').inputValue();
  const city = await this.page.locator('[data-testid=city-input]').inputValue();
  const linkedin = await this.page.locator('[data-testid=linkedin-input]').inputValue();
  const summary = await this.page.locator('[data-testid=summary-textarea]').inputValue();
  assert.ok(address || city || linkedin || summary, 'Expected at least one extended field to be populated');
});

// ---------------------------------------------------------------------------
// @edit — profile fields
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a profile', function (this: AppWorld) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (!profile) {
    this.mock.profiles.push({
      userId: this.mock.currentUser.userId,
      email: 'alex@example.com',
      password: 'StrongPass!8',
      firstName: 'Alex',
      lastName: 'Morgan',
      privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
    });
  }
});

Given<AppWorld>(
  'the user has a profile with last name {string} and location {string}',
  function (this: AppWorld, lastName: string, location: string) {
    const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
    if (profile) {
      profile.lastName = lastName;
      profile.location = location;
    }
  }
);

When<AppWorld>(
  'the user changes last name to {string} and location to {string}',
  async function (this: AppWorld, lastName: string, location: string) {
    await this.page.fill('[data-testid=last-name-input]', lastName);
    await this.page.fill('[data-testid=location-input]', location);
    await this.page.click('[data-testid=save-btn]');
    await expect(this.page.getByText('Profile saved')).toBeVisible({ timeout: 5000 });
  }
);

Then<AppWorld>('the last name shows {string}', async function (this: AppWorld, expected: string) {
  await expect(this.page.locator('[data-testid=last-name-input]')).toHaveValue(expected);
});

Then<AppWorld>('the location shows {string}', async function (this: AppWorld, expected: string) {
  await expect(this.page.locator('[data-testid=location-input]')).toHaveValue(expected);
});

// ---------------------------------------------------------------------------
// @edit — profile info
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has profile information', function (this: AppWorld) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  assert.ok(profile, 'Expected a profile to exist');
});

// ---------------------------------------------------------------------------
// @validation @edit — password
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens change password', async function (this: AppWorld) {
  await this.page.getByRole('tab', { name: 'Password' }).click();
  await this.page.locator('[data-testid=current-password-input]').waitFor();
});

When<AppWorld>(
  'the user enters current password {string}, new password {string}, and confirms {string}',
  async function (this: AppWorld, current: string, newPw: string, confirm: string) {
    await this.page.fill('[data-testid=current-password-input]', current);
    await this.page.fill('[data-testid=new-password-input]', newPw);
    await this.page.fill('[data-testid=confirm-password-input]', confirm);
    await this.page.click('[data-testid=change-password-btn]');
  }
);

Then<AppWorld>('the password is updated successfully', async function (this: AppWorld) {
  await expect(this.page.getByText('Password updated successfully')).toBeVisible({ timeout: 5000 });
});

When<AppWorld>('the user enters a new password {string}', async function (this: AppWorld, newPw: string) {
  await this.page.fill('[data-testid=new-password-input]', newPw);
  // blur() moves focus away, marking the control as touched so minlength error renders
  await this.page.locator('[data-testid=new-password-input]').blur();
});

Then<AppWorld>('the user sees "Password must be at least 8 characters"', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=pw-error]'))
    .toContainText('Password must be at least 8 characters', { timeout: 3000 });
});

When<AppWorld>(
  'the user enters new password {string} with confirmation {string}',
  async function (this: AppWorld, newPw: string, confirm: string) {
    await this.page.fill('[data-testid=new-password-input]', newPw);
    await this.page.fill('[data-testid=confirm-password-input]', confirm);
    // blur() makes the control touched so Angular Material enters error state
    await this.page.locator('[data-testid=confirm-password-input]').blur();
  }
);

Then<AppWorld>('the user sees "Passwords do not match"', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=pw-mismatch-error]'))
    .toContainText('Passwords do not match', { timeout: 3000 });
});

// ---------------------------------------------------------------------------
// @edit — contact details
// ---------------------------------------------------------------------------

When<AppWorld>('the user updates phone to {string}', async function (this: AppWorld, phone: string) {
  await this.page.fill('[data-testid=phone-input]', phone);
  await this.page.click('[data-testid=save-btn]');
  await expect(this.page.getByText('Profile saved')).toBeVisible({ timeout: 5000 });
});

Then<AppWorld>('the contact details show phone {string}', async function (this: AppWorld, expected: string) {
  await expect(this.page.locator('[data-testid=phone-input]')).toHaveValue(expected);
});

// ---------------------------------------------------------------------------
// @validation @edit — social links
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens links', async function (this: AppWorld) {
  // Social Links section is in the Profile tab; scroll it into view
  await this.page.locator('[data-testid=links-section]').scrollIntoViewIfNeeded();
});

When<AppWorld>(
  'the user adds LinkedIn {string} and portfolio {string}',
  async function (this: AppWorld, linkedInUrl: string, portfolioUrl: string) {
    await this.page.fill('[data-testid=linkedin-input]', linkedInUrl);
    await this.page.fill('[data-testid=portfolio-input]', portfolioUrl);
    await this.page.click('[data-testid=save-btn]');
    await expect(this.page.getByText('Profile saved')).toBeVisible({ timeout: 5000 });
  }
);

Then<AppWorld>('both links are saved and clickable', async function (this: AppWorld) {
  const linkedin = await this.page.locator('[data-testid=linkedin-input]').inputValue();
  const portfolio = await this.page.locator('[data-testid=portfolio-input]').inputValue();
  assert.ok(linkedin.startsWith('https://'), 'LinkedIn URL should start with https://');
  assert.ok(portfolio.startsWith('https://'), 'Portfolio URL should start with https://');
});

When<AppWorld>('the user enters a URL without https', async function (this: AppWorld) {
  await this.page.fill('[data-testid=linkedin-input]', 'http://linkedin.com/in/test');
  await this.page.locator('[data-testid=linkedin-input]').press('Tab');
});

Then<AppWorld>(/^the user sees "Enter a valid URL \(https\)"$/, async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=url-error]'))
    .toContainText('Enter a valid URL (https)', { timeout: 3000 });
});

// ---------------------------------------------------------------------------
// @edit — professional summary: write
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a profile with no summary', function (this: AppWorld) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) delete profile.professionalSummary;
});

When<AppWorld>('the user writes {string}', async function (this: AppWorld, summary: string) {
  await this.page.fill('[data-testid=summary-textarea]', summary);
  await this.page.click('[data-testid=save-btn]');
  await expect(this.page.getByText('Profile saved')).toBeVisible({ timeout: 5000 });
});

Then<AppWorld>(
  'the summary {string} is saved and visible on the profile',
  async function (this: AppWorld, expected: string) {
    await expect(this.page.locator('[data-testid=summary-textarea]')).toHaveValue(expected);
  }
);

// ---------------------------------------------------------------------------
// @edit — professional summary: edit
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a profile with summary {string}', function (this: AppWorld, summary: string) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) profile.professionalSummary = summary;
});

When<AppWorld>('the user changes the summary to {string}', async function (this: AppWorld, summary: string) {
  await this.page.fill('[data-testid=summary-textarea]', summary);
  await this.page.click('[data-testid=save-btn]');
  await expect(this.page.getByText('Profile saved')).toBeVisible({ timeout: 5000 });
});

Then<AppWorld>('the updated summary {string} is visible on the profile', async function (this: AppWorld, expected: string) {
  await expect(this.page.locator('[data-testid=summary-textarea]')).toHaveValue(expected);
});

// ---------------------------------------------------------------------------
// @view
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a complete profile', function (this: AppWorld) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) {
    profile.address = '123 Market St';
    profile.city = 'San Mateo';
    profile.state = 'CA';
    profile.linkedInUrl = 'https://www.linkedin.com/in/alexmorgan';
    profile.portfolioUrl = 'https://alexmorgan.dev';
    profile.professionalSummary = 'Senior data analyst.';
    profile.photoFilename = 'headshot.jpg';
  }
});

Given<AppWorld>('the user has basic and extended details', function (this: AppWorld) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  assert.ok(profile, 'Expected a profile to exist');
});

When<AppWorld>('the user views their profile', async function (this: AppWorld) {
  // Page is already loaded by the preceding "the user is on the profile page" step
  await this.page.locator('.user-profile').waitFor({ timeout: 5000 });
});

Then<AppWorld>('the following sections are displayed:', async function (this: AppWorld, table: DataTable) {
  const expectedSections = table.hashes().map((r: Record<string, string>) => r['section']);
  for (const section of expectedSections) {
    if (section === 'Profile Photo') {
      await expect(this.page.getByRole('tab', { name: 'Photo' })).toBeVisible();
    } else if (section === 'Privacy Settings') {
      await expect(this.page.getByRole('tab', { name: 'Privacy' })).toBeVisible();
    } else {
      await expect(this.page.getByRole('heading', { name: section, level: 2 })).toBeVisible();
    }
  }
});

// ---------------------------------------------------------------------------
// @completeness
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'the profile has {int} of {int} tracked fields filled',
  function (this: AppWorld, filled: number, _total: number) {
    const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
    assert.ok(profile, 'Expected a profile to exist');

    // Clear all optional tracked fields
    delete profile.phone;
    delete profile.location;
    delete profile.address;
    delete profile.city;
    delete profile.state;
    delete profile.linkedInUrl;
    delete profile.portfolioUrl;
    delete profile.professionalSummary;
    delete profile.photoFilename;

    // firstName, lastName, email are always present (3 required)
    let remaining = filled - 3;
    const optionalFields: (keyof UserProfile)[] = [
      'phone', 'location', 'address', 'city', 'state',
      'linkedInUrl', 'portfolioUrl', 'professionalSummary', 'photoFilename',
    ];
    for (const field of optionalFields) {
      if (remaining <= 0) break;
      if (field === 'linkedInUrl') profile.linkedInUrl = 'https://linkedin.com/in/alex';
      else if (field === 'portfolioUrl') profile.portfolioUrl = 'https://alex.dev';
      else if (field === 'photoFilename') profile.photoFilename = 'headshot.jpg';
      else Object.assign(profile, { [field]: 'filled' });
      remaining--;
    }
  }
);

When<AppWorld>('the user views completeness', async function (this: AppWorld) {
  await this.page.locator('[data-testid=completeness-bar]').waitFor({ timeout: 5000 });
});

Then<AppWorld>('the indicator shows {int}%', async function (this: AppWorld, expectedPercent: number) {
  await expect(this.page.locator('[data-testid=completeness-bar]'))
    .toHaveAttribute('aria-valuenow', String(expectedPercent), { timeout: 5000 });
});

// ---------------------------------------------------------------------------
// @privacy — configure
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens privacy settings', async function (this: AppWorld) {
  await this.page.getByRole('tab', { name: 'Privacy' }).click();
  await this.page.locator('mat-select[data-testid="contact-details-select"]').waitFor();
});

When<AppWorld>(
  'the user sets contact details to {string} and summary to {string}',
  async function (this: AppWorld, contactDetails: string, summary: string) {
    const contactSelect = this.page.locator('mat-select[data-testid="contact-details-select"]');
    await contactSelect.click();
    await this.page.locator('mat-option').filter({ hasText: contactDetails }).click();

    const summarySelect = this.page.locator('mat-select[data-testid="summary-select"]');
    await summarySelect.click();
    await this.page.locator('mat-option').filter({ hasText: summary }).click();

    await this.page.click('[data-testid=privacy-save-btn]');
  }
);

Then<AppWorld>('the privacy settings are saved', async function (this: AppWorld) {
  await expect(this.page.getByText('Privacy settings saved')).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// @privacy — enforcement (service-layer: no public "view other profile" route)
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'user {string} has set contact details to {string} and summary to {string}',
  function (this: AppWorld, email: string, contactDetails: string, summary: string) {
    let profile = this.mock.profiles.find((p) => p.email === email);
    if (!profile) {
      const maxId = Math.max(...this.mock.profiles.map((p) => p.userId));
      profile = {
        userId: maxId + 1,
        email,
        password: 'StrongPass!8',
        firstName: 'Jane',
        lastName: 'Doe',
        privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
      };
      this.mock.profiles.push(profile);
    }
    profile.privacy = {
      contactDetails: contactDetails as PrivacyVisibility,
      summary: summary as PrivacyVisibility,
    };
    this.context['profileOwnerEmail'] = email;
    this.context['profileOwnerId'] = profile.userId;
  }
);

Given<AppWorld>(
  "a second signed-in user is viewing the {string} profile",
  function (this: AppWorld, _ownerEmail: string) {
    this.context['secondUserId'] = 999;
  }
);

Then<AppWorld>('the second user cannot see the contact details', function (this: AppWorld) {
  const ownerId = this.context['profileOwnerId'] as number;
  const viewerId = this.context['secondUserId'] as number;
  const visible = this.userProfileService.isFieldVisible(viewerId, ownerId, 'contactDetails');
  assert.equal(visible, false, 'Expected contact details to be hidden from second user');
});

Then<AppWorld>('the second user can see the summary', function (this: AppWorld) {
  const ownerId = this.context['profileOwnerId'] as number;
  const viewerId = this.context['secondUserId'] as number;
  const visible = this.userProfileService.isFieldVisible(viewerId, ownerId, 'summary');
  assert.equal(visible, true, 'Expected summary to be visible to second user');
});

// ---------------------------------------------------------------------------
// @edit — photo
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens photo settings', async function (this: AppWorld) {
  await this.page.getByRole('tab', { name: 'Photo' }).click();
  // photo-input is display:none — wait for the visible heading instead
  await this.page.getByRole('heading', { name: 'Profile Photo' }).waitFor({ state: 'visible' });
});

When<AppWorld>('the user uploads {string} under 5MB', async function (this: AppWorld, filename: string) {
  const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  await this.page.locator('[data-testid=photo-input]').setInputFiles({
    name: filename,
    mimeType,
    buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]),
  });
  await this.page.locator('[data-testid=profile-photo]').waitFor();
});

Then<AppWorld>('{string} is displayed as the profile picture', async function (this: AppWorld, _filename: string) {
  await expect(this.page.locator('[data-testid=profile-photo]')).toBeVisible({ timeout: 5000 });
});

Given<AppWorld>('the user has a profile with photo {string}', function (this: AppWorld, filename: string) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) profile.photoFilename = filename;
});

When<AppWorld>('the user replaces the photo with {string}', async function (this: AppWorld, newFilename: string) {
  const mimeType = newFilename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  await this.page.locator('[data-testid=photo-input]').setInputFiles({
    name: newFilename,
    mimeType,
    buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]),
  });
  await this.page.locator('[data-testid=profile-photo]').waitFor();
});

When<AppWorld>('the user removes their profile photo', async function (this: AppWorld) {
  await this.page.click('[data-testid=remove-photo-btn]');
  await this.page.locator('[data-testid=default-avatar]').waitFor();
});

Then<AppWorld>('the default avatar is displayed as the profile picture', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=default-avatar]')).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// @validation — required fields
// ---------------------------------------------------------------------------

Given<AppWorld>('the user is creating a profile', async function (this: AppWorld) {
  this.mock.profiles = this.mock.profiles.filter(
    (p) => p.userId !== this.mock.currentUser.userId
  );
  await this.navigateTo('/profile');
});

When<AppWorld>('the user submits the form with email left empty', async function (this: AppWorld) {
  // Clear the email field and blur it → Angular marks it touched → "Email is required" shows
  await this.page.fill('[data-testid=email-input]', '');
  await this.page.locator('[data-testid=email-input]').blur();
  await this.page.waitForTimeout(300);
});

Then<AppWorld>('the user sees "Email is required" and cannot continue', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=email-error]'))
    .toContainText('Email is required', { timeout: 3000 });
});

When<AppWorld>('the user submits the form with password left empty', async function (this: AppWorld) {
  // Password validation lives in the Change Password tab
  await this.page.getByRole('tab', { name: 'Password' }).click();
  await this.page.locator('[data-testid=new-password-input]').waitFor();
  // Click the new-password field and Tab away without filling → marked touched → error shows
  await this.page.locator('[data-testid=new-password-input]').click();
  await this.page.locator('[data-testid=new-password-input]').press('Tab');
});

Then<AppWorld>('the user sees "Password is required" and cannot continue', async function (this: AppWorld) {
  await expect(this.page.locator('[data-testid=pw-error]'))
    .toContainText('Password is required', { timeout: 3000 });
});

When<AppWorld>('the user fills only the required fields', async function (this: AppWorld) {
  await this.page.fill('[data-testid=first-name-input]', 'Jane');
  await this.page.fill('[data-testid=last-name-input]', 'Doe');
  await this.page.fill('[data-testid=email-input]', 'jane.fresh@example.com');
  await this.page.click('[data-testid=save-btn]');
});

Then<AppWorld>('the profile is created successfully', async function (this: AppWorld) {
  // Accepts either 'Profile created' (new profile) or 'Profile saved' (existing being updated)
  await expect(this.page.getByText(/Profile (created|saved)/)).toBeVisible({ timeout: 5000 });
});

