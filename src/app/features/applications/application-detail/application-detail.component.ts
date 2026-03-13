import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

import { JobApplication } from '../../../core/models/job-application.model';
import { ApplicationStatus } from '../../../core/models/application-status.enum';
import { Company } from '../../../core/models/company.model';
import { JobPosting } from '../../../core/models/job-posting.model';
import { ApplicationNote } from '../../../core/models/application-note.model';
import { SalaryInfo } from '../../../core/models/salary-info.model';
import { TimelineEvent } from '../../../core/models/timeline-event.model';

import { ApplicationService } from '../../../core/services/application.service';
import { CompanyService } from '../../../core/services/company.service';
import { JobPostingService } from '../../../core/services/job-posting.service';
import { SalaryService } from '../../../core/services/salary.service';
import { TimelineService } from '../../../core/services/timeline.service';

import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TimelineComponent } from '../../../shared/components/timeline/timeline.component';
import { SalaryFormComponent } from './salary-form/salary-form.component';
import {
  DocumentLinkerComponent,
  DocumentLinkerData,
  DocumentLinkerResult,
} from './document-linker/document-linker.component';

@Component({
  selector: 'app-application-detail',
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatDialogModule,
    MatSnackBarModule,
    StatusBadgeComponent,
    SalaryFormComponent,
    TimelineComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.scss'],
})
export class ApplicationDetailComponent implements OnInit {
  application: JobApplication | null = null;
  company: Company | null = null;
  posting: JobPosting | null = null;
  notes: ApplicationNote[] = [];
  salary: SalaryInfo | null = null;
  timeline: TimelineEvent[] = [];
  availableTransitions: ApplicationStatus[] = [];

  noteForm!: FormGroup;
  selectedTransition: ApplicationStatus | null = null;

  editingAppliedDate = false;
  appliedDateEdit: Date | null = null;

  editingPostingUrl = false;
  postingUrlEdit = '';

  notFound = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly fb: FormBuilder,
    private readonly applicationService: ApplicationService,
    private readonly companyService: CompanyService,
    private readonly jobPostingService: JobPostingService,
    private readonly salaryService: SalaryService,
    private readonly timelineService: TimelineService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.noteForm = this.fb.group({ content: ['', Validators.required] });
    if (!id || isNaN(id)) { this.notFound = true; return; }
    this.load(id);
  }

  private load(id: number): void {
    const app = this.applicationService.getById(id);
    if (!app) { this.notFound = true; return; }

    this.application = app;
    this.company = this.companyService.getById(app.companyId) ?? null;
    this.posting = app.jobId ? (this.jobPostingService.getById(app.jobId) ?? null) : null;
    this.notes = this.applicationService.getNotes(id);
    this.salary = this.salaryService.getByApplication(id) ?? null;
    this.timeline = this.timelineService.getTimeline(id);
    this.availableTransitions = this.applicationService.getAvailableTransitions(id);
  }

  applyTransition(): void {
    if (!this.application || !this.selectedTransition) return;
    try {
      this.applicationService.updateStatus(this.application.applicationId, this.selectedTransition);
      this.snackBar.open(`Status updated to "${this.selectedTransition}"`, 'OK', { duration: 3000 });
      this.selectedTransition = null;
      this.load(this.application.applicationId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update status';
      this.snackBar.open(msg, 'Dismiss', { duration: 4000 });
    }
  }

  addNote(): void {
    if (!this.application || this.noteForm.invalid) return;
    this.applicationService.addNote(this.application.applicationId, this.noteForm.value.content);
    this.noteForm.reset();
    this.load(this.application.applicationId);
  }

  onSalarySaved(data: Omit<SalaryInfo, 'salaryId' | 'applicationId'>): void {
    if (!this.application) return;
    this.salaryService.setSalaryInfo(this.application.applicationId, data);
    this.snackBar.open('Salary information saved', 'OK', { duration: 3000 });
    this.load(this.application.applicationId);
  }

  openDocumentLinker(): void {
    if (!this.application) return;
    const dialogData: DocumentLinkerData = {
      userId: this.application.userId,
      currentResumeId: this.application.resumeId,
      currentCoverLetterId: this.application.coverLetterId,
    };
    const ref = this.dialog.open<DocumentLinkerComponent, DocumentLinkerData, DocumentLinkerResult>(
      DocumentLinkerComponent,
      { data: dialogData, width: '480px' }
    );
    ref.afterClosed().subscribe((result) => {
      if (result && this.application) {
        this.applicationService.linkDocuments(
          this.application.applicationId,
          result.resumeId,
          result.coverLetterId
        );
        this.snackBar.open('Documents linked', 'OK', { duration: 3000 });
        this.load(this.application.applicationId);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/applications']);
  }

  startEditAppliedDate(): void {
    if (!this.application) return;
    this.appliedDateEdit = new Date(this.application.appliedDate);
    this.editingAppliedDate = true;
  }

  saveAppliedDate(): void {
    if (!this.application || !this.appliedDateEdit) return;
    const d = this.appliedDateEdit;
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    this.applicationService.updateAppliedDate(
      this.application.applicationId,
      dateStr
    );
    this.snackBar.open('Applied date updated', 'OK', { duration: 3000 });
    this.editingAppliedDate = false;
    this.load(this.application.applicationId);
  }

  cancelEditAppliedDate(): void {
    this.editingAppliedDate = false;
    this.appliedDateEdit = null;
  }

  startEditPostingUrl(): void {
    if (!this.application) return;
    this.postingUrlEdit = this.application.postingUrl ?? '';
    this.editingPostingUrl = true;
  }

  savePostingUrl(): void {
    if (!this.application) return;
    this.applicationService.updatePostingUrl(
      this.application.applicationId,
      this.postingUrlEdit.trim() || null
    );
    this.snackBar.open('Posting URL updated', 'OK', { duration: 3000 });
    this.editingPostingUrl = false;
    this.load(this.application.applicationId);
  }

  cancelEditPostingUrl(): void {
    this.editingPostingUrl = false;
    this.postingUrlEdit = '';
  }
}
