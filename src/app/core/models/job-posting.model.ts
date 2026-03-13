export interface JobPosting {
  jobId: number;
  companyId: number;
  jobTitle: string;
  description?: string;
  requirements?: string;
  location?: string;
  remoteOption?: string;
  postedDate: string;
  applicationDeadline?: string;
  postingUrl?: string;
}
