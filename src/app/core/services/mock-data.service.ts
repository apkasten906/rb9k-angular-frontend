import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Company } from '../models/company.model';
import { JobPosting } from '../models/job-posting.model';
import { JobApplication } from '../models/job-application.model';
import { ApplicationStatus } from '../models/application-status.enum';
import { ApplicationStatusHistory } from '../models/application-status-history.model';
import { ApplicationNote } from '../models/application-note.model';
import { SalaryInfo } from '../models/salary-info.model';
import { Resume } from '../models/resume.model';
import { CoverLetter } from '../models/cover-letter.model';
import { TimelineEvent } from '../models/timeline-event.model';

const NOW = '2026-03-12T10:26:06.997Z';
const NINETY_DAYS_AGO = '2025-12-11T10:26:06.997Z';
const EIGHTY_FIVE_DAYS_AGO = '2025-12-16T10:26:06.997Z';
const SIXTY_DAYS_AGO = '2026-01-11T10:26:06.997Z';
const THIRTY_DAYS_AGO = '2026-02-10T10:26:06.997Z';
const TEN_DAYS_AGO = '2026-03-02T10:26:06.997Z';

// Date-only strings (YYYY-MM-DD) used for appliedDate fields
const NINETY_DAYS_AGO_DATE = '2025-12-11';
const THIRTY_DAYS_AGO_DATE = '2026-02-10';
const TEN_DAYS_AGO_DATE = '2026-03-02';

@Injectable({ providedIn: 'root' })
export class MockDataService {
  /** Replaceable clock — override in tests for deterministic timestamps. */
  now: () => string = () => new Date().toISOString();

  readonly currentUser: User = {
    userId: 1,
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@example.com',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: NOW,
  };

  companies: Company[] = [
    { companyId: 1, companyName: 'Acme Corp', industry: 'Technology', size: '1000-5000', location: 'New York, NY', website: 'https://acme.example.com' },
    { companyId: 2, companyName: 'DataVision Inc', industry: 'Analytics', size: '200-500', location: 'Austin, TX', website: 'https://datavision.example.com' },
    { companyId: 3, companyName: 'CloudWorks', industry: 'Cloud Services', size: '500-1000', location: 'Seattle, WA', website: 'https://cloudworks.example.com' },
  ];

  jobPostings: JobPosting[] = [
    { jobId: 1, companyId: 1, jobTitle: 'Data Analyst', postedDate: SIXTY_DAYS_AGO, postingUrl: 'https://acme.example.com/careers/data-analyst', location: 'New York, NY' },
    { jobId: 2, companyId: 1, jobTitle: 'UX Lead', postedDate: NINETY_DAYS_AGO, postingUrl: 'https://acme.example.com/careers/ux-lead', location: 'New York, NY' },
    { jobId: 3, companyId: 2, jobTitle: 'Senior Engineer', postedDate: NINETY_DAYS_AGO, postingUrl: 'https://datavision.example.com/careers/senior-engineer', location: 'Austin, TX' },
    { jobId: 4, companyId: 2, jobTitle: 'Product Manager', postedDate: SIXTY_DAYS_AGO, postingUrl: 'https://datavision.example.com/careers/product-manager', location: 'Remote' },
    { jobId: 5, companyId: 3, jobTitle: 'Project Manager', postedDate: THIRTY_DAYS_AGO, postingUrl: 'https://cloudworks.example.com/careers/project-manager', location: 'Seattle, WA' },
  ];

  applications: JobApplication[] = [
    {
      applicationId: 1,
      userId: 1,
      jobId: 1,
      companyId: 1,
      status: ApplicationStatus.Applied,
      appliedDate: TEN_DAYS_AGO_DATE,
      postingUrl: 'https://acme.example.com/careers/data-analyst',
      resumeId: 1,
      coverLetterId: null,
      salaryInfoId: null,
    },
    {
      applicationId: 2,
      userId: 1,
      jobId: 3,
      companyId: 2,
      status: ApplicationStatus.Interviewing,
      appliedDate: NINETY_DAYS_AGO_DATE,
      postingUrl: 'https://datavision.example.com/careers/senior-engineer',
      resumeId: 1,
      coverLetterId: 1,
      salaryInfoId: null,
    },
    {
      applicationId: 3,
      userId: 1,
      jobId: 5,
      companyId: 3,
      status: ApplicationStatus.Offer,
      appliedDate: THIRTY_DAYS_AGO_DATE,
      postingUrl: 'https://cloudworks.example.com/careers/project-manager',
      resumeId: 2,
      coverLetterId: 1,
      salaryInfoId: 1,
    },
    {
      applicationId: 4,
      userId: 1,
      jobId: 2,
      companyId: 1,
      status: ApplicationStatus.Accepted,
      appliedDate: NINETY_DAYS_AGO_DATE,
      postingUrl: 'https://acme.example.com/careers/ux-lead',
      resumeId: 2,
      coverLetterId: 1,
      salaryInfoId: 2,
    },
  ];

  statusHistories: ApplicationStatusHistory[] = [
    // App 2: Applied → Interviewing (90 days ago) — long-gap scenario
    { historyId: 1, applicationId: 2, from: ApplicationStatus.Applied, to: ApplicationStatus.Interviewing, timestamp: NINETY_DAYS_AGO },
    // App 3: Applied → Interviewing → Offer
    { historyId: 2, applicationId: 3, from: ApplicationStatus.Applied, to: ApplicationStatus.Interviewing, timestamp: THIRTY_DAYS_AGO },
    { historyId: 3, applicationId: 3, from: ApplicationStatus.Interviewing, to: ApplicationStatus.Offer, timestamp: TEN_DAYS_AGO },
    // App 4: full history
    { historyId: 4, applicationId: 4, from: ApplicationStatus.Applied, to: ApplicationStatus.Interviewing, timestamp: EIGHTY_FIVE_DAYS_AGO },
    { historyId: 5, applicationId: 4, from: ApplicationStatus.Interviewing, to: ApplicationStatus.Offer, timestamp: SIXTY_DAYS_AGO },
    { historyId: 6, applicationId: 4, from: ApplicationStatus.Offer, to: ApplicationStatus.Accepted, timestamp: THIRTY_DAYS_AGO },
  ];

  notes: ApplicationNote[] = [
    { noteId: 1, applicationId: 2, content: 'Phone screen scheduled', author: 'Alex Morgan', createdAt: NINETY_DAYS_AGO },
    { noteId: 2, applicationId: 3, content: 'Great interview round', author: 'Alex Morgan', createdAt: TEN_DAYS_AGO },
    { noteId: 3, applicationId: 4, content: 'Phone screen scheduled', author: 'Alex Morgan', createdAt: EIGHTY_FIVE_DAYS_AGO },
    { noteId: 4, applicationId: 4, content: 'Offer received — reviewing package', author: 'Alex Morgan', createdAt: THIRTY_DAYS_AGO },
    { noteId: 5, applicationId: 4, content: 'Accepted via email', author: 'Alex Morgan', createdAt: THIRTY_DAYS_AGO },
  ];

  salaryInfos: SalaryInfo[] = [
    {
      salaryId: 1,
      applicationId: 3,
      companyOfferedSalary: 115000,
      userExpectedSalary: 120000,
      industryAverageSalary: 118000,
      currency: 'USD',
      region: 'NY',
    },
    {
      salaryId: 2,
      applicationId: 4,
      companyOfferedSalary: 140000,
      userExpectedSalary: 135000,
      industryAverageSalary: 132000,
      currency: 'USD',
      region: 'NY',
    },
  ];

  resumes: Resume[] = [
    {
      resumeId: 1,
      userId: 1,
      jobId: null,
      title: 'R1',
      version: 1,
      parentResumeId: null,
      status: 'active',
      createdDate: NINETY_DAYS_AGO,
      lastModified: null,
    },
    {
      resumeId: 2,
      userId: 1,
      jobId: null,
      title: 'R1v2',
      version: 2,
      parentResumeId: 1,
      status: 'active',
      createdDate: SIXTY_DAYS_AGO,
      lastModified: null,
    },
  ];

  coverLetters: CoverLetter[] = [
    {
      coverLetterId: 1,
      userId: 1,
      jobId: null,
      title: 'C1',
      content: 'Dear Hiring Manager, ...',
      status: 'active',
      createdDate: NINETY_DAYS_AGO,
      lastModified: null,
    },
  ];

  timelineEvents: TimelineEvent[] = [
    // App 2 (Interviewing) — long-gap scenario seeded
    { eventType: 'creation', applicationId: 2, details: 'Application created', author: 'Alex Morgan', timestamp: NINETY_DAYS_AGO },
    { eventType: 'status_change', applicationId: 2, details: 'Applied → Interviewing', author: 'Alex Morgan', timestamp: NINETY_DAYS_AGO },
    // App 3 (Offer)
    { eventType: 'creation', applicationId: 3, details: 'Application created', author: 'Alex Morgan', timestamp: THIRTY_DAYS_AGO },
    { eventType: 'status_change', applicationId: 3, details: 'Applied → Interviewing', author: 'Alex Morgan', timestamp: THIRTY_DAYS_AGO },
    { eventType: 'status_change', applicationId: 3, details: 'Interviewing → Offer', author: 'Alex Morgan', timestamp: TEN_DAYS_AGO },
    { eventType: 'salary_update', applicationId: 3, details: 'Expected: $120,000 | Offered: $115,000 | Industry avg: $118,000 (USD, NY)', author: 'Alex Morgan', timestamp: TEN_DAYS_AGO },
    // App 4 (Accepted) — full history
    { eventType: 'creation', applicationId: 4, details: 'Application created', author: 'Alex Morgan', timestamp: NINETY_DAYS_AGO },
    { eventType: 'status_change', applicationId: 4, details: 'Applied → Interviewing', author: 'Alex Morgan', timestamp: EIGHTY_FIVE_DAYS_AGO },
    { eventType: 'note', applicationId: 4, details: 'Phone screen scheduled', author: 'Alex Morgan', timestamp: EIGHTY_FIVE_DAYS_AGO },
    { eventType: 'status_change', applicationId: 4, details: 'Interviewing → Offer', author: 'Alex Morgan', timestamp: SIXTY_DAYS_AGO },
    { eventType: 'document_link', applicationId: 4, details: 'Documents linked: R1v2, C1', author: 'Alex Morgan', timestamp: SIXTY_DAYS_AGO },
    { eventType: 'salary_update', applicationId: 4, details: 'Expected: $135,000 | Offered: $140,000 | Industry avg: $132,000 (USD, NY)', author: 'Alex Morgan', timestamp: THIRTY_DAYS_AGO },
    { eventType: 'note', applicationId: 4, details: 'Offer received — reviewing package', author: 'Alex Morgan', timestamp: THIRTY_DAYS_AGO },
    { eventType: 'status_change', applicationId: 4, details: 'Offer → Accepted', author: 'Alex Morgan', timestamp: THIRTY_DAYS_AGO },
    { eventType: 'note', applicationId: 4, details: 'Accepted via email', author: 'Alex Morgan', timestamp: THIRTY_DAYS_AGO },
  ];

  nextIds = {
    application: 5,
    note: 6,
    salary: 3,
    resume: 3,
    coverLetter: 2,
    statusHistory: 7,
  };
}
