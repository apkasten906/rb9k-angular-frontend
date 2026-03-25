import { Component, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { UserProfileService } from '../../core/services/user-profile.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { UserProfile } from '../../core/models/user-profile.model';
import { ProfileFormComponent } from './profile-form/profile-form.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { PhotoSettingsComponent } from './photo-settings/photo-settings.component';
import { PrivacySettingsComponent } from './privacy-settings/privacy-settings.component';

@Component({
  selector: 'app-user-profile',
  imports: [
    MatTabsModule,
    MatProgressBarModule,
    ProfileFormComponent,
    ChangePasswordComponent,
    PhotoSettingsComponent,
    PrivacySettingsComponent,
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  profile: UserProfile | null = null;
  completeness = { filled: 0, total: 12, percent: 0 };

  constructor(
    private readonly profileService: UserProfileService,
    private readonly mockData: MockDataService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    try {
      this.profile = this.profileService.getProfile(this.mockData.currentUser.userId);
      this.completeness = this.profileService.getCompleteness(this.mockData.currentUser.userId);
    } catch {
      this.profile = null;
      this.completeness = { filled: 0, total: 12, percent: 0 };
    }
  }

  onProfileUpdated(): void {
    this.loadProfile();
  }
}
