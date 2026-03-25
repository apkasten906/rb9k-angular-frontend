import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { PrivacyVisibility } from '../../../core/models/user-profile.model';

@Component({
  selector: 'app-privacy-settings',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './privacy-settings.component.html',
  styleUrls: ['./privacy-settings.component.scss'],
})
export class PrivacySettingsComponent implements OnInit {
  form!: FormGroup;
  readonly visibilityOptions: PrivacyVisibility[] = ['Everyone', 'Connections', 'Only me'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: UserProfileService,
    private readonly mockData: MockDataService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const profile = this.profileService.getProfile(this.mockData.currentUser.userId);
    this.form = this.fb.group({
      contactDetails: [profile.privacy.contactDetails],
      summary: [profile.privacy.summary],
    });
  }

  save(): void {
    this.profileService.setPrivacy(this.mockData.currentUser.userId, {
      contactDetails: this.form.value.contactDetails,
      summary: this.form.value.summary,
    });
    this.snackBar.open('Privacy settings saved', 'Dismiss', { duration: 3000 });
  }
}
