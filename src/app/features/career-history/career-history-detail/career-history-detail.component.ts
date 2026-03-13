import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CareerService } from '../../../core/services/career.service';
import { CareerEntry } from '../../../core/models/career-entry.model';
import { CareerResponsibility } from '../../../core/models/career-responsibility.model';
import { CareerAchievement } from '../../../core/models/career-achievement.model';

@Component({
  selector: 'app-career-history-detail',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSnackBarModule,
  ],
  templateUrl: './career-history-detail.component.html',
  styleUrls: ['./career-history-detail.component.scss'],
})
export class CareerHistoryDetailComponent implements OnInit {
  entry: CareerEntry | null = null;
  responsibilities: CareerResponsibility[] = [];
  achievements: CareerAchievement[] = [];

  // Add forms
  newResponsibility = '';
  newAchievementText = '';
  newAchievementImpact = '';

  constructor(
    private readonly careerService: CareerService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.entry = this.careerService.getById(id) ?? null;
    if (this.entry) this.reload();
  }

  private reload(): void {
    if (!this.entry) return;
    this.responsibilities = this.careerService.getResponsibilities(this.entry.careerEntryId);
    this.achievements = this.careerService.getAchievements(this.entry.careerEntryId);
  }

  edit(): void {
    if (!this.entry) return;
    this.router.navigate(['/career-history', this.entry.careerEntryId, 'edit']);
  }

  delete(): void {
    if (!this.entry) return;
    if (!confirm(`Delete the "${this.entry.jobTitle}" role at ${this.entry.employer}? This cannot be undone.`)) return;
    this.careerService.delete(this.entry.careerEntryId);
    this.snackBar.open('Career entry deleted', 'Dismiss', { duration: 3000 });
    this.router.navigate(['/career-history']);
  }

  addResponsibility(): void {
    const text = this.newResponsibility.trim();
    if (!text || !this.entry) return;
    this.careerService.addResponsibility(this.entry.careerEntryId, text);
    this.newResponsibility = '';
    this.reload();
  }

  removeResponsibility(id: number): void {
    this.careerService.deleteResponsibility(id);
    this.reload();
  }

  addAchievement(): void {
    const text = this.newAchievementText.trim();
    if (!text || !this.entry) return;
    this.careerService.addAchievement(
      this.entry.careerEntryId,
      text,
      this.newAchievementImpact.trim() || null
    );
    this.newAchievementText = '';
    this.newAchievementImpact = '';
    this.reload();
  }

  removeAchievement(id: number): void {
    this.careerService.deleteAchievement(id);
    this.reload();
  }

  back(): void {
    this.router.navigate(['/career-history']);
  }
}
