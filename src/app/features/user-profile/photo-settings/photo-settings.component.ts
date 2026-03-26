import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { MockDataService } from '../../../core/services/mock-data.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Component({
  selector: 'app-photo-settings',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './photo-settings.component.html',
  styleUrls: ['./photo-settings.component.scss'],
})
export class PhotoSettingsComponent implements OnInit {
  @Output() profileUpdated = new EventEmitter<void>();

  currentPhoto: string | undefined;
  sizeError = '';

  constructor(
    private readonly profileService: UserProfileService,
    private readonly mockData: MockDataService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    try {
      this.currentPhoto = this.profileService.getProfile(this.mockData.currentUser.userId).photoFilename;
    } catch {
      this.currentPhoto = undefined;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.sizeError = 'Photo must be under 5 MB';
      input.value = '';
      return;
    }
    this.sizeError = '';
    this.profileService.setPhoto(this.mockData.currentUser.userId, file.name);
    this.currentPhoto = file.name;
    this.snackBar.open(`Photo "${file.name}" saved`, 'Dismiss', { duration: 3000 });
    this.profileUpdated.emit();
    input.value = '';
  }

  removePhoto(): void {
    this.profileService.setPhoto(this.mockData.currentUser.userId, null);
    this.currentPhoto = undefined;
    this.snackBar.open('Profile photo removed', 'Dismiss', { duration: 3000 });
    this.profileUpdated.emit();
  }
}
