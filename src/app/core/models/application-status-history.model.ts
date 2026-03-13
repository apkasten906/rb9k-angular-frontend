import { ApplicationStatus } from './application-status.enum';

export interface ApplicationStatusHistory {
  historyId: number;
  applicationId: number;
  from: ApplicationStatus;
  to: ApplicationStatus;
  /** ISO 8601 timestamp */
  timestamp: string;
}
