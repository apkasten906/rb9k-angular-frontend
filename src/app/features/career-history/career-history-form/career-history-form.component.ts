import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CareerService } from '../../../core/services/career.service';
import { MockDataService } from '../../../core/services/mock-data.service';

function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value;
  const end = group.get('endDate')?.value;
  if (start && end && end <= start) {
    return { endBeforeStart: true };
  }
  return null;
}

@Component({
  selector: 'app-career-history-form',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './career-history-form.component.html',
  styleUrls: ['./career-history-form.component.scss'],
})
export class CareerHistoryFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  private entryId: number | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly careerService: CareerService,
    private readonly mockData: MockDataService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        employer: ['', Validators.required],
        jobTitle: ['', Validators.required],
        startDate: [null, Validators.required],
        endDate: [null],
        location: [''],
        description: [''],
      },
      { validators: endAfterStart }
    );

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.entryId = Number(idParam);
      const entry = this.careerService.getById(this.entryId);
      if (entry) {
        this.form.patchValue({
          employer: entry.employer,
          jobTitle: entry.jobTitle,
          startDate: new Date(entry.startDate),
          endDate: entry.endDate ? new Date(entry.endDate) : null,
          location: entry.location ?? '',
          description: entry.description ?? '',
        });
      }
    }
  }

  get endBeforeStartError(): boolean {
    return this.form.hasError('endBeforeStart') && !!this.form.get('endDate')?.value;
  }

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;

    const toDateStr = (d: Date | null): string | null => {
      if (!d) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (this.isEdit && this.entryId !== null) {
      this.careerService.update(this.entryId, {
        employer: val.employer,
        jobTitle: val.jobTitle,
        startDate: toDateStr(val.startDate) ?? '',
        endDate: toDateStr(val.endDate),
        location: val.location || null,
        description: val.description || null,
        category: val.jobTitle,
      });
      this.snackBar.open('Career entry updated', 'Dismiss', { duration: 3000 });
      this.router.navigate(['/career-history', this.entryId]);
    } else {
      const entry = this.careerService.create({
        userId: this.mockData.currentUser.userId,
        employer: val.employer,
        jobTitle: val.jobTitle,
        startDate: toDateStr(val.startDate) ?? '',
        endDate: toDateStr(val.endDate),
        location: val.location || null,
        description: val.description || null,
        category: val.jobTitle,
      });
      this.snackBar.open('Career entry saved', 'Dismiss', { duration: 3000 });
      this.router.navigate(['/career-history', entry.careerEntryId]);
    }
  }

  cancel(): void {
    this.router.navigate(['/career-history']);
  }
}
