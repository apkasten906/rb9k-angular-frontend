import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { JobApplication } from '../../../core/models/job-application.model';
import { ApplicationStatus } from '../../../core/models/application-status.enum';
import { ApplicationService } from '../../../core/services/application.service';
import { CompanyService } from '../../../core/services/company.service';
import { JobPostingService } from '../../../core/services/job-posting.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

export interface ApplicationRow {
  application: JobApplication;
  companyName: string;
  jobTitle: string;
}

@Component({
  selector: 'app-application-list',
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './application-list.component.html',
  styleUrls: ['./application-list.component.scss'],
})
export class ApplicationListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = ['company', 'jobTitle', 'status', 'appliedDate', 'actions'];
  dataSource = new MatTableDataSource<ApplicationRow>();
  allStatuses = Object.values(ApplicationStatus);

  colFilters = { company: '', jobTitle: '', status: '', appliedDate: '' };

  constructor(
    private readonly appService: ApplicationService,
    private readonly companyService: CompanyService,
    private readonly jobPostingService: JobPostingService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (row, id) => {
      switch (id) {
        case 'company':     return row.companyName.toLowerCase();
        case 'jobTitle':    return row.jobTitle.toLowerCase();
        case 'status':      return row.application.status;
        case 'appliedDate': return row.application.appliedDate;
        default:            return '';
      }
    };
  }

  private loadApplications(): void {
    const apps = this.appService.getAll();
    this.dataSource.data = apps.map((app) => ({
      application: app,
      companyName: this.companyService.getById(app.companyId)?.companyName ?? '—',
      jobTitle: app.jobId
        ? (this.jobPostingService.getById(app.jobId)?.jobTitle ?? '—')
        : '(No posting)',
    }));

    this.dataSource.filterPredicate = (row, filterJson) => {
      const f = JSON.parse(filterJson) as typeof this.colFilters;
      return (
        (!f.company     || row.companyName.toLowerCase().includes(f.company)) &&
        (!f.jobTitle    || row.jobTitle.toLowerCase().includes(f.jobTitle)) &&
        (!f.status      || row.application.status === f.status) &&
        (!f.appliedDate || row.application.appliedDate.includes(f.appliedDate))
      );
    };
    this.pushFilter();
  }

  applyColFilter(col: 'company' | 'jobTitle' | 'appliedDate', event: Event): void {
    this.colFilters[col] = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.pushFilter();
  }

  setStatusFilter(status: string): void {
    this.colFilters.status = status;
    this.pushFilter();
  }

  applyCompanyFilter(event: Event): void {
    this.applyColFilter('company', event);
  }

  private pushFilter(): void {
    this.dataSource.filter = JSON.stringify(this.colFilters);
  }

  openDetail(row: ApplicationRow): void {
    this.router.navigate(['/applications', row.application.applicationId]);
  }

  newApplication(): void {
    this.router.navigate(['/applications', 'new']);
  }
}

