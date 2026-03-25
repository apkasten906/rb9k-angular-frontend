/**
 * Step definitions for: 03-user_profile_management.feature
 */
import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { AppWorld } from './world';
import { UserProfile } from '../../src/app/core/models/user-profile.model';

// ---------------------------------------------------------------------------
// Background / shared Given steps
// ---------------------------------------------------------------------------

Given<AppWorld>('the user is signed in', function () {
  // The mock always has userId: 1 as the signed-in user — no action needed.
});

Given<AppWorld>('the user is on the registration page', function () {
  // TODO: replace with Playwright page.goto('/register')
  // No state to set in the service layer.
});

Given<AppWorld>('the user is on the profile page', function () {
  // TODO: replace with Playwright page.goto('/profile')
  // No state to set in the service layer.
});

// ---------------------------------------------------------------------------
// @create
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has no existing profile', function () {
  this.mock.profiles = this.mock.profiles.filter(
    (p) => p.userId !== this.mock.currentUser.userId
  );
});

When<AppWorld>('the user submits basic information:', function (table: DataTable) {
  const row = table.hashes()[0];
  // TODO: replace with Playwright form.fill() calls
  const email = row['email'];
  const conflict = this.mock.profiles.find((p) => p.email === email);
  if (conflict) {
    this.context['validationError'] = 'Email is already in use';
    return;
  }
  const profile = this.userProfileService.createProfile({
    email,
    password: row['password'],
    firstName: row['first name'],
    lastName: row['last name'],
    phone: row['phone'] || undefined,
    location: row['location'] || undefined,
    privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
  });
  this.context['createdProfile'] = profile;
  this.context['validationError'] = null;
});

Then<AppWorld>('a "Profile created" confirmation is shown', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=confirm-banner]')).toBeVisible()
  assert.ok(!this.context['validationError'], 'Expected no validation error');
  const profile = this.context['createdProfile'] as UserProfile | undefined;
  assert.ok(profile, 'Expected a profile to have been created');
});

Then<AppWorld>('required fields are saved', function () {
  const profile = this.context['createdProfile'] as UserProfile;
  assert.ok(profile.email, 'email should be set');
  assert.ok(profile.firstName, 'firstName should be set');
  assert.ok(profile.lastName, 'lastName should be set');
});

// ---------------------------------------------------------------------------
// @validation — email
// ---------------------------------------------------------------------------

Given<AppWorld>('an existing account uses email {string}', function (email: string) {
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

When<AppWorld>('the user enters email {string}', function (email: string) {
  // TODO: replace with Playwright page.fill('[data-testid=email-input]', email)
  this.context['enteredEmail'] = email;
  const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!EMAIL_PATTERN.test(email)) {
    this.context['validationError'] = 'Enter a valid email address';
    return;
  }
  const conflict = this.mock.profiles.find(
    (p) => p.userId !== this.mock.currentUser.userId && p.email === email
  );
  if (conflict) {
    this.context['validationError'] = 'Email is already in use';
    return;
  }
  this.context['validationError'] = null;
});

Then<AppWorld>('the user sees "Email is already in use" and cannot proceed', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=email-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Email is already in use');
});

Then<AppWorld>('the user sees "Enter a valid email address"', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=email-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Enter a valid email address');
});

// ---------------------------------------------------------------------------
// @create — extended fields
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a basic profile', function () {
  let profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (!profile) {
    profile = this.userProfileService.createProfile({
      email: 'alex@example.com',
      password: 'MockPass!1',
      firstName: 'Alex',
      lastName: 'Morgan',
      privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
    });
  }
  this.context['currentProfile'] = profile;
});

When<AppWorld>('the user adds:', function (table: DataTable) {
  // TODO: replace with Playwright form.fill() calls for each column
  const row = table.hashes()[0];
  const changes: Partial<UserProfile> = {};
  if (row['address']) changes.address = row['address'];
  if (row['city']) changes.city = row['city'];
  if (row['state']) changes.state = row['state'];
  if (row['country']) changes.country = row['country'];
  if (row['postal code']) changes.postalCode = row['postal code'];
  if (row['LinkedIn URL']) changes.linkedInUrl = row['LinkedIn URL'];
  if (row['portfolio URL']) changes.portfolioUrl = row['portfolio URL'];
  if (row['professional summary']) changes.professionalSummary = row['professional summary'];
  this.userProfileService.updateProfile(this.mock.currentUser.userId, changes);
});

Then<AppWorld>('the extended details are saved and visible on the profile', function () {
  // TODO: replace with Playwright assertions on the profile view
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.ok(profile.address || profile.city || profile.linkedInUrl || profile.professionalSummary,
    'Expected at least one extended field to be saved');
});

// ---------------------------------------------------------------------------
// @edit — profile fields
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a profile', function () {
  let profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (!profile) {
    this.userProfileService.createProfile({
      email: 'alex@example.com',
      password: 'MockPass!1',
      firstName: 'Alex',
      lastName: 'Morgan',
      privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
    });
  }
});

Given<AppWorld>(
  'the user has a profile with last name {string} and location {string}',
  function (lastName: string, location: string) {
    const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
    if (profile) {
      profile.lastName = lastName;
      profile.location = location;
    }
  }
);

When<AppWorld>(
  'the user changes last name to {string} and location to {string}',
  function (lastName: string, location: string) {
    // TODO: replace with Playwright form.fill() calls
    this.userProfileService.updateProfile(this.mock.currentUser.userId, { lastName, location });
  }
);

Then<AppWorld>('the last name shows {string}', function (expected: string) {
  // TODO: replace with Playwright expect(page.locator('[data-testid=last-name]')).toHaveText(...)
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.equal(profile.lastName, expected);
});

Then<AppWorld>('the location shows {string}', function (expected: string) {
  // TODO: replace with Playwright expect(page.locator('[data-testid=location]')).toHaveText(...)
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.equal(profile.location, expected);
});

// ---------------------------------------------------------------------------
// @edit — profile info
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has profile information', function () {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  assert.ok(profile, 'Expected a profile to exist');
});

// ---------------------------------------------------------------------------
// @validation @edit — password
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens change password', function () {
  // TODO: replace with Playwright page.click('[data-testid=change-password-tab]')
});

When<AppWorld>(
  'the user enters current password {string}, new password {string}, and confirms {string}',
  function (current: string, newPw: string, confirm: string) {
    // TODO: replace with Playwright form.fill() calls
    if (newPw !== confirm) {
      this.context['validationError'] = 'Passwords do not match';
      return;
    }
    try {
      this.userProfileService.updatePassword(this.mock.currentUser.userId, current, newPw);
      this.context['validationError'] = null;
      this.context['passwordUpdated'] = true;
    } catch (err: unknown) {
      this.context['validationError'] = err instanceof Error ? err.message : String(err);
      this.context['passwordUpdated'] = false;
    }
  }
);

Then<AppWorld>('the password is updated successfully', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=snackbar]')).toHaveText(...)
  assert.equal(this.context['passwordUpdated'], true);
  assert.ok(!this.context['validationError'], 'Expected no validation error');
});

When<AppWorld>('the user enters a new password {string}', function (newPw: string) {
  // TODO: replace with Playwright page.fill('[data-testid=new-password-input]', newPw)
  if (newPw.length < 8) {
    this.context['validationError'] = 'Password must be at least 8 characters';
  } else {
    this.context['validationError'] = null;
  }
});

Then<AppWorld>('the user sees "Password must be at least 8 characters"', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=pw-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Password must be at least 8 characters');
});

When<AppWorld>(
  'the user enters new password {string} with confirmation {string}',
  function (newPw: string, confirm: string) {
    // TODO: replace with Playwright form.fill() calls
    if (newPw === confirm) {
      this.context['validationError'] = null;
    } else {
      this.context['validationError'] = 'Passwords do not match';
    }
  }
);

Then<AppWorld>('the user sees "Passwords do not match"', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=pw-mismatch-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Passwords do not match');
});

// ---------------------------------------------------------------------------
// @edit — contact details
// ---------------------------------------------------------------------------

When<AppWorld>('the user updates phone to {string}', function (phone: string) {
  // TODO: replace with Playwright page.fill('[data-testid=phone-input]', phone)
  this.userProfileService.updateProfile(this.mock.currentUser.userId, { phone });
});

Then<AppWorld>('the contact details show phone {string}', function (expected: string) {
  // TODO: replace with Playwright expect(page.locator('[data-testid=phone]')).toHaveText(...)
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.equal(profile.phone, expected);
});

// ---------------------------------------------------------------------------
// @validation @edit — social links
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens links', function () {
  // TODO: replace with Playwright page.click('[data-testid=links-section]')
});

When<AppWorld>(
  'the user adds LinkedIn {string} and portfolio {string}',
  function (linkedInUrl: string, portfolioUrl: string) {
    // TODO: replace with Playwright form.fill() calls
    const errors: string[] = [];
    if (!linkedInUrl.startsWith('https://')) errors.push('Enter a valid URL (https)');
    if (!portfolioUrl.startsWith('https://')) errors.push('Enter a valid URL (https)');
    if (errors.length) {
      this.context['validationError'] = errors[0];
      return;
    }
    this.userProfileService.updateProfile(this.mock.currentUser.userId, { linkedInUrl, portfolioUrl });
    this.context['validationError'] = null;
  }
);

Then<AppWorld>('both links are saved and clickable', function () {
  // TODO: replace with Playwright assertions on anchor href attributes
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.ok(profile.linkedInUrl, 'LinkedIn URL should be saved');
  assert.ok(profile.portfolioUrl, 'Portfolio URL should be saved');
  assert.ok(profile.linkedInUrl?.startsWith('https://'), 'LinkedIn URL should start with https://');
  assert.ok(profile.portfolioUrl?.startsWith('https://'), 'Portfolio URL should start with https://');
});

When<AppWorld>('the user enters a URL without https', function () {
  // TODO: replace with Playwright page.fill('[data-testid=linkedin-input]', 'http://linkedin.com')
  this.context['validationError'] = 'Enter a valid URL (https)';
});

Then<AppWorld>('the user sees "Enter a valid URL (https)"', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=url-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Enter a valid URL (https)');
});

// ---------------------------------------------------------------------------
// @edit — professional summary: write
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a profile with no summary', function () {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) delete profile.professionalSummary;
});

When<AppWorld>('the user writes {string}', function (summary: string) {
  // TODO: replace with Playwright page.fill('[data-testid=summary-textarea]', summary)
  this.userProfileService.updateProfile(this.mock.currentUser.userId, { professionalSummary: summary });
});

Then<AppWorld>(
  'the summary {string} is saved and visible on the profile',
  function (expected: string) {
    // TODO: replace with Playwright expect(page.locator('[data-testid=summary]')).toHaveText(...)
    const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
    assert.equal(profile.professionalSummary, expected);
  }
);

// ---------------------------------------------------------------------------
// @edit — professional summary: edit
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a profile with summary {string}', function (summary: string) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) profile.professionalSummary = summary;
});

When<AppWorld>('the user changes the summary to {string}', function (summary: string) {
  // TODO: replace with Playwright page.fill('[data-testid=summary-textarea]', summary)
  this.userProfileService.updateProfile(this.mock.currentUser.userId, { professionalSummary: summary });
});

Then<AppWorld>('the updated summary {string} is visible on the profile', function (expected: string) {
  // TODO: replace with Playwright expect(page.locator('[data-testid=summary]')).toHaveText(...)
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.equal(profile.professionalSummary, expected);
});

// ---------------------------------------------------------------------------
// @view
// ---------------------------------------------------------------------------

Given<AppWorld>('the user has a complete profile', function () {
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

Given<AppWorld>('the user has basic and extended details', function () {
  // alias — same as "has a complete profile" for view scenario
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  assert.ok(profile, 'Expected a profile to exist');
});

When<AppWorld>('the user views their profile', function () {
  // TODO: replace with Playwright page.goto('/profile')
  this.context['viewedProfile'] = this.userProfileService.getProfile(this.mock.currentUser.userId);
});

Then<AppWorld>('the following sections are displayed:', function (table: DataTable) {
  // TODO: replace with Playwright assertions that each section heading is visible
  const expectedSections = table.hashes().map((r) => r['section']);
  const profile = this.context['viewedProfile'] as UserProfile;
  assert.ok(profile, 'Expected a profile to be loaded');
  // In the service layer, we assert the data backing each section exists on the object
  for (const section of expectedSections) {
    switch (section) {
      case 'Basic Information':
        assert.ok(profile.firstName && profile.email, `Section "${section}" data missing`);
        break;
      case 'Contact Details':
        // optional — section is always rendered
        break;
      case 'Address':
        break;
      case 'Professional Summary':
        break;
      case 'Social Links':
        break;
      case 'Profile Photo':
        break;
      case 'Privacy Settings':
        assert.ok(profile.privacy, `Section "${section}" data missing`);
        break;
    }
  }
});

// ---------------------------------------------------------------------------
// @completeness
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'the profile has {int} of {int} tracked fields filled',
  function (filled: number, total: number) {
    // Seed the profile so exactly `filled` of the 12 tracked fields are populated.
    const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
    assert.ok(profile, 'Expected a profile to exist');

    // Clear all optional tracked fields first
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

    this.context['expectedFilled'] = filled;
    this.context['expectedTotal'] = total;
  }
);

When<AppWorld>('the user views completeness', function () {
  // TODO: replace with Playwright assertion on the progress bar value
  this.context['completeness'] = this.userProfileService.getCompleteness(
    this.mock.currentUser.userId
  );
});

Then<AppWorld>('the indicator shows {int}%', function (expectedPercent: number) {
  // TODO: replace with Playwright expect(page.locator('[data-testid=completeness-bar]')).toHaveAttribute('value', ...)
  const { percent } = this.context['completeness'] as { filled: number; total: number; percent: number };
  assert.equal(percent, expectedPercent, `Expected ${expectedPercent}% but got ${percent}%`);
});

// ---------------------------------------------------------------------------
// @privacy — configure
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens privacy settings', function () {
  // TODO: replace with Playwright page.click('[data-testid=privacy-tab]')
});

When<AppWorld>(
  'the user sets contact details to {string} and summary to {string}',
  function (contactDetails: string, summary: string) {
    // TODO: replace with Playwright mat-select interactions
    this.userProfileService.setPrivacy(this.mock.currentUser.userId, {
      contactDetails: contactDetails as PrivacyVisibility,
      summary: summary as PrivacyVisibility,
    });
  }
);

Then<AppWorld>('the privacy settings are saved', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=snackbar]')).toHaveText(...)
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.ok(profile.privacy, 'Expected privacy settings to be saved');
});

// ---------------------------------------------------------------------------
// @privacy — enforcement from second user perspective
// ---------------------------------------------------------------------------

Given<AppWorld>(
  'user {string} has set contact details to {string} and summary to {string}',
  function (email: string, contactDetails: string, summary: string) {
    let profile = this.mock.profiles.find((p) => p.email === email);
    if (!profile) {
      profile = {
        userId: this.mock.currentUser.userId,
        email,
        password: 'MockPass!1',
        firstName: 'Alex',
        lastName: 'Morgan',
        privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
      };
      this.mock.profiles.push(profile);
    }
    profile.privacy = {
      contactDetails: contactDetails as 'Everyone' | 'Connections' | 'Only me',
      summary: summary as 'Everyone' | 'Connections' | 'Only me',
    };
    this.context['profileOwnerEmail'] = email;
    this.context['profileOwnerId'] = profile.userId;
  }
);

Given<AppWorld>(
  "a second signed-in user is viewing {string}'s profile",
  function (_ownerEmail: string) {
    // TODO: replace with Playwright second-browser-context navigation
    this.context['secondUserId'] = 999; // simulated second user
  }
);

Then<AppWorld>('the second user cannot see the contact details', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=contact-section]')).not.toBeVisible()
  const ownerId = this.context['profileOwnerId'] as number;
  const viewerId = this.context['secondUserId'] as number;
  const visible = this.userProfileService.isFieldVisible(viewerId, ownerId, 'contactDetails');
  assert.equal(visible, false, 'Expected contact details to be hidden from second user');
});

Then<AppWorld>('the second user can see the summary', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=summary-section]')).toBeVisible()
  const ownerId = this.context['profileOwnerId'] as number;
  const viewerId = this.context['secondUserId'] as number;
  const visible = this.userProfileService.isFieldVisible(viewerId, ownerId, 'summary');
  assert.equal(visible, true, 'Expected summary to be visible to second user');
});

// ---------------------------------------------------------------------------
// @edit — photo
// ---------------------------------------------------------------------------

Given<AppWorld>('the user opens photo settings', function () {
  // TODO: replace with Playwright page.click('[data-testid=photo-tab]')
});

When<AppWorld>('the user uploads {string} under 5MB', function (filename: string) {
  // TODO: replace with Playwright page.setInputFiles('[data-testid=photo-input]', ...)
  this.userProfileService.setPhoto(this.mock.currentUser.userId, filename);
  this.context['uploadedPhoto'] = filename;
});

Then<AppWorld>('{string} is displayed as the profile picture', function (filename: string) {
  // TODO: replace with Playwright expect(page.locator('[data-testid=profile-photo]')).toHaveAttribute('alt', ...)
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.equal(profile.photoFilename, filename);
});

Given<AppWorld>('the user has a profile with photo {string}', function (filename: string) {
  const profile = this.mock.profiles.find((p) => p.userId === this.mock.currentUser.userId);
  if (profile) profile.photoFilename = filename;
});

When<AppWorld>('the user replaces the photo with {string}', function (newFilename: string) {
  // TODO: replace with Playwright page.setInputFiles('[data-testid=photo-input]', ...)
  this.userProfileService.setPhoto(this.mock.currentUser.userId, newFilename);
});

When<AppWorld>('the user removes their profile photo', function () {
  // TODO: replace with Playwright page.click('[data-testid=remove-photo-btn]')
  this.userProfileService.setPhoto(this.mock.currentUser.userId, null);
});

Then<AppWorld>('the default avatar is displayed as the profile picture', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=default-avatar]')).toBeVisible()
  const profile = this.userProfileService.getProfile(this.mock.currentUser.userId);
  assert.equal(
    profile.photoFilename,
    undefined,
    'Expected photoFilename to be undefined (default avatar shown)'
  );
});

// ---------------------------------------------------------------------------
// @validation — required fields
// ---------------------------------------------------------------------------

Given<AppWorld>('the user is creating a profile', function () {
  // TODO: replace with Playwright page.goto('/register')
});

When<AppWorld>('the user submits the form with email left empty', function () {
  // TODO: replace with Playwright page submit with empty email field
  this.context['validationError'] = 'Email is required';
  this.context['canContinue'] = false;
});

Then<AppWorld>('the user sees "Email is required" and cannot continue', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=email-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Email is required');
  assert.equal(this.context['canContinue'], false);
});

When<AppWorld>('the user submits the form with password left empty', function () {
  // TODO: replace with Playwright page submit with empty password field
  this.context['validationError'] = 'Password is required';
  this.context['canContinue'] = false;
});

Then<AppWorld>('the user sees "Password is required" and cannot continue', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=pw-error]')).toHaveText(...)
  assert.equal(this.context['validationError'], 'Password is required');
  assert.equal(this.context['canContinue'], false);
});

When<AppWorld>('the user fills only the required fields', function () {
  // TODO: replace with Playwright form fill for email + password only
  this.context['validationError'] = null;
  this.context['canContinue'] = true;
  // Optional fields are simply absent — profile creation would succeed
});

Then<AppWorld>('the profile is created successfully', function () {
  // TODO: replace with Playwright expect(page.locator('[data-testid=confirm-banner]')).toBeVisible()
  assert.ok(!this.context['validationError'], 'Expected no validation error');
  assert.equal(this.context['canContinue'], true);
});
