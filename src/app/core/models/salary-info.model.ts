export interface SalaryInfo {
  salaryId: number;
  /** applicationId (frontend) — differs from ERD which links to job_id */
  applicationId: number;
  companyOfferedSalary: number | null;
  userExpectedSalary: number | null;
  industryAverageSalary: number | null;
  currency: string | null;
  region: string | null;
}
