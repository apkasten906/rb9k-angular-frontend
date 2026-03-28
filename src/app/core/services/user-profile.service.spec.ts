import { MockDataService } from './mock-data.service';
import { UserProfileService } from './user-profile.service';
import { TRACKED_PROFILE_FIELDS } from '../models/user-profile.model';

function freshService(): { service: UserProfileService; mock: MockDataService } {
  const mock = new MockDataService();
  mock.profiles = [
    {
      userId: 1,
      email: 'alex@example.com',
      password: 'StrongPass!8',
      firstName: 'Alex',
      lastName: 'Morgan',
      phone: '+1 415 555 0100',
      location: 'San Francisco, CA',
      linkedInUrl: 'https://linkedin.com/in/alex-morgan',
      privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
    },
  ];
  const service = new UserProfileService(mock);
  return { service, mock };
}

describe('UserProfileService', () => {
  // -------------------------------------------------------------------------
  // getProfile
  // -------------------------------------------------------------------------
  describe('getProfile', () => {
    it('returns the profile for the given userId', () => {
      const { service } = freshService();
      const profile = service.getProfile(1);
      expect(profile.email).toBe('alex@example.com');
      expect(profile.firstName).toBe('Alex');
    });

    it('throws when the profile is not found', () => {
      const { service } = freshService();
      expect(() => service.getProfile(999)).toThrow('Profile for userId 999 not found');
    });
  });

  // -------------------------------------------------------------------------
  // createProfile
  // -------------------------------------------------------------------------
  describe('createProfile', () => {
    it('creates a profile for the current user', () => {
      const { service, mock } = freshService();
      mock.profiles = [];
      const profile = service.createProfile({
        email: 'new@example.com',
        password: 'StrongPass!8',
        firstName: 'Jane',
        lastName: 'Doe',
        privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
      });
      expect(profile.userId).toBe(mock.currentUser.userId);
      expect(profile.email).toBe('new@example.com');
      expect(mock.profiles).toHaveLength(1);
    });

    it('throws when a profile already exists for the current user', () => {
      const { service } = freshService();
      expect(() =>
        service.createProfile({
          email: 'other@example.com',
          password: 'StrongPass!8',
          firstName: 'Jane',
          lastName: 'Doe',
          privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
        })
      ).toThrow('Profile for userId 1 already exists');
    });

    it('throws when the email is already in use', () => {
      const { service, mock } = freshService();
      // Give the existing profile a different userId so currentUser (1) has no profile
      mock.profiles[0].userId = 99;
      expect(() =>
        service.createProfile({
          email: 'alex@example.com',
          password: 'StrongPass!8',
          firstName: 'Jane',
          lastName: 'Doe',
          privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
        })
      ).toThrow('Email already in use');
    });
  });

  // -------------------------------------------------------------------------
  // updateProfile
  // -------------------------------------------------------------------------
  describe('updateProfile', () => {
    it('updates fields on an existing profile', () => {
      const { service } = freshService();
      const updated = service.updateProfile(1, { lastName: 'Rivera', location: 'Oakland, CA' });
      expect(updated.lastName).toBe('Rivera');
      expect(updated.location).toBe('Oakland, CA');
    });

    it('throws when changing email to one already in use by another user', () => {
      const { service, mock } = freshService();
      mock.profiles.push({
        userId: 2,
        email: 'bob@example.com',
        password: 'StrongPass!8',
        firstName: 'Bob',
        lastName: 'Smith',
        privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
      });
      expect(() => service.updateProfile(1, { email: 'bob@example.com' })).toThrow(
        'Email already in use'
      );
    });

    it('allows updating email to the same value without conflict', () => {
      const { service } = freshService();
      const updated = service.updateProfile(1, { email: 'alex@example.com' });
      expect(updated.email).toBe('alex@example.com');
    });
  });

  // -------------------------------------------------------------------------
  // updatePassword
  // -------------------------------------------------------------------------
  describe('updatePassword', () => {
    it('updates the password when the current password is correct', () => {
      const { service, mock } = freshService();
      service.updatePassword(1, 'StrongPass!8', 'NewStrong#12');
      expect(mock.profiles[0].password).toBe('NewStrong#12');
    });

    it('throws when the current password is incorrect', () => {
      const { service } = freshService();
      expect(() => service.updatePassword(1, 'wrongpassword', 'NewStrong#12')).toThrow(
        'Current password is incorrect'
      );
    });

    it('throws when the new password is fewer than 8 characters', () => {
      const { service } = freshService();
      expect(() => service.updatePassword(1, 'StrongPass!8', 'short')).toThrow(
        'Password must be at least 8 characters'
      );
    });
  });

  // -------------------------------------------------------------------------
  // setPhoto
  // -------------------------------------------------------------------------
  describe('setPhoto', () => {
    it('sets the photo filename on the profile', () => {
      const { service, mock } = freshService();
      service.setPhoto(1, 'headshot.jpg');
      expect(mock.profiles[0].photoFilename).toBe('headshot.jpg');
    });

    it('removes the photo when filename is null', () => {
      const { service, mock } = freshService();
      mock.profiles[0].photoFilename = 'headshot.jpg';
      service.setPhoto(1, null);
      expect(mock.profiles[0].photoFilename).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // setPrivacy
  // -------------------------------------------------------------------------
  describe('setPrivacy', () => {
    it('updates both privacy fields', () => {
      const { service, mock } = freshService();
      service.setPrivacy(1, { contactDetails: 'Only me', summary: 'Connections' });
      expect(mock.profiles[0].privacy.contactDetails).toBe('Only me');
      expect(mock.profiles[0].privacy.summary).toBe('Connections');
    });
  });

  // -------------------------------------------------------------------------
  // getCompleteness
  // -------------------------------------------------------------------------
  describe('getCompleteness', () => {
    it('calculates partial completeness correctly', () => {
      const { service } = freshService();
      // Initial mock has: firstName, lastName, email, phone, location, linkedInUrl = 6 of 12
      const result = service.getCompleteness(1);
      expect(result.filled).toBe(6);
      expect(result.total).toBe(TRACKED_PROFILE_FIELDS.length);
      expect(result.percent).toBe(Math.round((6 / TRACKED_PROFILE_FIELDS.length) * 100));
    });

    it('returns 100% when all tracked fields are filled', () => {
      const { service, mock } = freshService();
      Object.assign(mock.profiles[0], {
        address: '123 Market St',
        city: 'San Francisco',
        state: 'CA',
        portfolioUrl: 'https://alex.dev',
        professionalSummary: 'Experienced analyst.',
        photoFilename: 'headshot.jpg',
      });
      const result = service.getCompleteness(1);
      expect(result.filled).toBe(TRACKED_PROFILE_FIELDS.length);
      expect(result.percent).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // isFieldVisible
  // -------------------------------------------------------------------------
  describe('isFieldVisible', () => {
    it('returns true for the owner when visibility is "Only me"', () => {
      const { service, mock } = freshService();
      mock.profiles[0].privacy.contactDetails = 'Only me';
      expect(service.isFieldVisible(1, 1, 'contactDetails')).toBe(true);
    });

    it('returns false for a non-owner when visibility is "Only me"', () => {
      const { service, mock } = freshService();
      mock.profiles[0].privacy.contactDetails = 'Only me';
      expect(service.isFieldVisible(2, 1, 'contactDetails')).toBe(false);
    });

    it('returns true for any viewer when visibility is "Everyone"', () => {
      const { service } = freshService();
      expect(service.isFieldVisible(999, 1, 'summary')).toBe(true);
    });

    it('returns true for any viewer when visibility is "Connections"', () => {
      const { service, mock } = freshService();
      mock.profiles[0].privacy.summary = 'Connections';
      expect(service.isFieldVisible(999, 1, 'summary')).toBe(true);
    });
  });
});
