import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CompanyService } from '../../../core/services/company.service';
import { JobPostingService } from '../../../core/services/job-posting.service';
import { ApplicationService } from '../../../core/services/application.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Company } from '../../../core/models/company.model';
import { JobPosting } from '../../../core/models/job-posting.model';
import { ApplicationStatus } from '../../../core/models/application-status.enum';

@Component({
  selector: 'app-application-form',
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
  ],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.scss'],
})
export class ApplicationFormComponent implements OnInit {
  form!: FormGroup;
  companies: Company[] = [];
  availablePostings: JobPosting[] = [];

  showAddCompany = false;
  newCompanyName = '';

  showAddPosting = false;
  newPostingTitle = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly companyService: CompanyService,
    private readonly jobPostingService: JobPostingService,
    private readonly appService: ApplicationService,
    private readonly mockData: MockDataService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.companies = this.companyService.getAll();
    this.form = this.fb.group({
      companyId: [null, Validators.required],
      jobId: [null],
      postingUrl: [''],
      appliedDate: [new Date(), Validators.required],
    });

    this.form.get('companyId')?.valueChanges.subscribe((companyId: number) => {
      this.availablePostings = companyId
        ? this.jobPostingService.getByCompany(companyId)
        : [];
      this.form.get('jobId')?.setValue(null);
    });
  }

  addCompany(): void {
    const name = this.newCompanyName.trim();
    if (!name) return;
    const created = this.companyService.add({ companyName: name });
    this.companies = this.companyService.getAll();
    this.form.get('companyId')?.setValue(created.companyId);
    this.newCompanyName = '';
    this.showAddCompany = false;
  }

  addPosting(): void {
    const title = this.newPostingTitle.trim();
    if (!title) return;
    const companyId = this.form.get('companyId')?.value as number;
    if (!companyId) return;
    const d = new Date();
    const todayStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
    const url = (this.form.get('postingUrl')?.value as string | null)?.trim() ?? '';
    const created = this.jobPostingService.add({
      companyId,
      jobTitle: title,
      postedDate: todayStr,
      ...(url ? { postingUrl: url } : {}),
    });
    this.availablePostings = this.jobPostingService.getByCompany(companyId);
    this.form.get('jobId')?.setValue(created.jobId);
    this.newPostingTitle = '';
    this.showAddPosting = false;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { companyId, jobId, postingUrl, appliedDate } = this.form.value;

    const d = appliedDate as Date;
    const dateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');

    const app = this.appService.createApplication({
      userId: this.mockData.currentUser.userId,
      companyId,
      jobId: jobId ?? null,
      status: ApplicationStatus.Applied,
      appliedDate: dateStr,
      postingUrl: postingUrl || null,
      resumeId: null,
      coverLetterId: null,
      salaryInfoId: null,
    });

    this.router.navigate(['/applications', app.applicationId]);
  }

  cancel(): void {
    this.router.navigate(['/applications']);
  }
}

