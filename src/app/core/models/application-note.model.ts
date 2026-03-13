export interface ApplicationNote {
  noteId: number;
  applicationId: number;
  content: string;
  author: string;
  /** ISO 8601 timestamp */
  createdAt: string;
}
