export interface CoverLetter {
  coverLetterId: number;
  userId: number;
  jobId: number | null;
  title: string;
  content?: string;
  status: 'active' | 'deleted';
  createdDate: string;
  lastModified: string | null;
}
