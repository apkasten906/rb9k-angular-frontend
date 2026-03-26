import { Component } from '@angular/core';
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

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (newPw && confirm && newPw !== confirm) return { passwordsMismatch: true };
  return null;
}

@Component({
  selector: 'app-change-password',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  form: FormGroup;
  currentPasswordError = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly profileService: UserProfileService,
    private readonly mockData: MockDataService,
    private readonly snackBar: MatSnackBar
  ) {
    this.form = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );

    // Mirror the group-level mismatch error onto the confirmPassword control so
    // Angular Material's mat-form-field enters error state and shows mat-error.
    const syncMismatch = (): void => {
      const confirmControl = this.form.get('confirmPassword');
      if (this.form.hasError('passwordsMismatch')) {
        confirmControl?.setErrors({ ...confirmControl.errors, passwordsMismatch: true });
      } else {
        const current = confirmControl?.errors;
        if (current?.['passwordsMismatch']) {
          const { passwordsMismatch: _m, ...rest } = current;
          confirmControl?.setErrors(Object.keys(rest).length ? rest : null);
        }
      }
    };
    this.form.get('newPassword')?.valueChanges.subscribe(syncMismatch);
    this.form.get('confirmPassword')?.valueChanges.subscribe(syncMismatch);
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordsMismatch') && !!this.form.get('confirmPassword')?.dirty;
  }

  submit(): void {
    if (this.form.invalid) return;
    const { currentPassword, newPassword } = this.form.value;
    try {
      this.profileService.updatePassword(this.mockData.currentUser.userId, currentPassword, newPassword);
      this.currentPasswordError = '';
      this.form.reset();
      this.snackBar.open('Password updated successfully', 'Dismiss', { duration: 3000 });
    } catch (err: unknown) {
      if (err instanceof Error) this.currentPasswordError = err.message;
    }
  }
}
