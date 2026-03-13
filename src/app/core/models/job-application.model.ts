import { ApplicationStatus } from './application-status.enum';

export interface JobApplication {
  applicationId: number;
  userId: number;
  /** Null when no job posting is available */
  jobId: number | null;
  companyId: number;
  status: ApplicationStatus;
  /** Date-only string (YYYY-MM-DD) */
  appliedDate: string;
  postingUrl: string | null;
  resumeId: number | null;
  coverLetterId: number | null;
  salaryInfoId: number | null;
}
