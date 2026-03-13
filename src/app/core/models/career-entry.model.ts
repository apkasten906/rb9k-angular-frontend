export interface CareerEntry {
  careerEntryId: number;
  userId: number;
  employer: string;
  jobTitle: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD or null if current role */
  endDate: string | null;
  location: string | null;
  description: string | null;
  /** Mirrors jobTitle — used for role category filtering */
  category: string;
}
