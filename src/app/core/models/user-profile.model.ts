export type PrivacyVisibility = 'Everyone' | 'Connections' | 'Only me';

export interface UserProfile {
  userId: number;

  // Basic
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;

  // Extended
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  professionalSummary?: string;

  // Media
  photoFilename?: string;

  // Privacy
  privacy: {
    contactDetails: PrivacyVisibility;
    summary: PrivacyVisibility;
  };
}

export const TRACKED_PROFILE_FIELDS: (keyof UserProfile)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'location',
  'address',
  'city',
  'state',
  'linkedInUrl',
  'portfolioUrl',
  'professionalSummary',
  'photoFilename',
];
