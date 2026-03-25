import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { MockDataService } from '../../../core/services/mock-data.service';

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function httpsUrlValidator(control: AbstractControl): ValidationErrors | null {
  const val: string = control.value;
  if (!val) return null;
  if (!val.startsWith('https://')) return { httpsRequired: true };
  return null;
}

@Component({
  selector: 'app-profile-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile-form.component.html',
  styleUrls: ['./profile-form.component.scss'],
})
export class ProfileFormComponent implements OnInit {
  @Output() profileUpdated = new EventEmitter<void>();

  form!: FormGroup;
  emailDuplicateError = false;
  private isNewProfile = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: UserProfileService,
    private readonly mockData: MockDataService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    try {
      const profile = this.profileService.getProfile(this.mockData.currentUser.userId);
      this.isNewProfile = false;
      this.initForm(profile);
    } catch {
      this.isNewProfile = true;
      this.initForm(null);
    }
  }

  private initForm(profile: ReturnType<UserProfileService['getProfile']> | null): void {
    this.form = this.fb.group({
      firstName: [profile?.firstName ?? '', Validators.required],
      lastName: [profile?.lastName ?? '', Validators.required],
      email: [profile?.email ?? '', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      phone: [profile?.phone ?? ''],
      location: [profile?.location ?? ''],
      address: [profile?.address ?? ''],
      city: [profile?.city ?? ''],
      state: [profile?.state ?? ''],
      country: [profile?.country ?? ''],
      postalCode: [profile?.postalCode ?? ''],
      linkedInUrl: [profile?.linkedInUrl ?? '', httpsUrlValidator],
      portfolioUrl: [profile?.portfolioUrl ?? '', httpsUrlValidator],
      professionalSummary: [profile?.professionalSummary ?? ''],
    });
  }

  onEmailBlur(): void {
    const email: string = this.form.get('email')?.value;
    try {
      const currentEmail = this.profileService.getProfile(this.mockData.currentUser.userId).email;
      if (email && email !== currentEmail) {
        this.emailDuplicateError = this.mockData.profiles.some(
          (p) => p.userId !== this.mockData.currentUser.userId && p.email === email
        );
      } else {
        this.emailDuplicateError = false;
      }
    } catch {
      // No existing profile — check only for duplicate across all profiles
      this.emailDuplicateError = email
        ? this.mockData.profiles.some((p) => p.email === email)
        : false;
    }
  }

  save(): void {
    if (this.form.invalid || this.emailDuplicateError) return;
    const val = this.form.value;
    const changes = {
      firstName: val.firstName,
      lastName: val.lastName,
      email: val.email,
      phone: val.phone || undefined,
      location: val.location || undefined,
      address: val.address || undefined,
      city: val.city || undefined,
      state: val.state || undefined,
      country: val.country || undefined,
      postalCode: val.postalCode || undefined,
      linkedInUrl: val.linkedInUrl || undefined,
      portfolioUrl: val.portfolioUrl || undefined,
      professionalSummary: val.professionalSummary || undefined,
    };
    try {
      if (this.isNewProfile) {
        this.profileService.createProfile({
          ...changes,
          password: 'changeme',
          privacy: { contactDetails: 'Everyone', summary: 'Everyone' },
        });
        this.isNewProfile = false;
        this.snackBar.open('Profile created', 'Dismiss', { duration: 3000 });
      } else {
        this.profileService.updateProfile(this.mockData.currentUser.userId, changes);
        this.snackBar.open('Profile saved', 'Dismiss', { duration: 3000 });
      }
      this.profileUpdated.emit();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Email already in use') {
        this.emailDuplicateError = true;
      }
    }
  }
}
