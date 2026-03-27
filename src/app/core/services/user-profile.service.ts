import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { UserProfile, TRACKED_PROFILE_FIELDS } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  constructor(private readonly mock: MockDataService) {}

  getProfile(userId: number): UserProfile {
    const profile = this.mock.profiles.find((p) => p.userId === userId);
    if (!profile) throw new Error(`Profile for userId ${userId} not found`);
    return profile;
  }

  createProfile(data: Omit<UserProfile, 'userId'>): UserProfile {
    const userId = this.mock.currentUser.userId;
    if (this.mock.profiles.some((p) => p.userId === userId)) {
      throw new Error(`Profile for userId ${userId} already exists`);
    }
    if (data.email && this.mock.profiles.some((p) => p.email === data.email)) {
      throw new Error('Email already in use');
    }
    const profile: UserProfile = { ...data, userId };
    this.mock.profiles.push(profile);
    return profile;
  }

  updateProfile(userId: number, changes: Partial<UserProfile>): UserProfile {
    const profile = this.getProfile(userId);
    if (changes.email && changes.email !== profile.email) {
      const conflict = this.mock.profiles.find(
        (p) => p.userId !== userId && p.email === changes.email
      );
      if (conflict) throw new Error('Email already in use');
    }
    Object.assign(profile, changes);
    return profile;
  }

  updatePassword(userId: number, current: string, newPassword: string): void {
    const profile = this.getProfile(userId);
    if (profile.password !== current) throw new Error('Current password is incorrect');
    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
    profile.password = newPassword;
  }

  setPhoto(userId: number, filename: string | null): void {
    const profile = this.getProfile(userId);
    if (filename === null) {
      delete profile.photoFilename;
    } else {
      profile.photoFilename = filename;
    }
  }

  setPrivacy(userId: number, privacy: UserProfile['privacy']): void {
    const profile = this.getProfile(userId);
    profile.privacy = { ...privacy };
  }

  getCompleteness(userId: number): { filled: number; total: number; percent: number } {
    const profile = this.getProfile(userId);
    const total = TRACKED_PROFILE_FIELDS.length;
    const filled = TRACKED_PROFILE_FIELDS.filter((f) => {
      const val = profile[f];
      return val !== undefined && val !== null && val !== '';
    }).length;
    const percent = Math.round((filled / total) * 100);
    return { filled, total, percent };
  }

  isFieldVisible(
    viewerUserId: number,
    ownerId: number,
    field: keyof UserProfile['privacy']
  ): boolean {
    const profile = this.getProfile(ownerId);
    const visibility = profile.privacy[field];
    if (visibility === 'Only me') return viewerUserId === ownerId;
    // 'Connections' and 'Everyone' are both visible (connections concept is out of scope)
    return true;
  }
}
