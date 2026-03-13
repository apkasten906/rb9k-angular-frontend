export interface Resume {
  resumeId: number;
  userId: number;
  jobId: number | null;
  title: string;
  version: number;
  /** Points to the previous version's resumeId */
  parentResumeId: number | null;
  status: 'active' | 'deleted';
  createdDate: string;
  lastModified: string | null;
}
