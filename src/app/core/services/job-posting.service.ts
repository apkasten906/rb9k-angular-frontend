import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { JobPosting } from '../models/job-posting.model';

@Injectable({ providedIn: 'root' })
export class JobPostingService {
  constructor(private readonly mock: MockDataService) {}

  getAll(): JobPosting[] {
    return [...this.mock.jobPostings];
  }

  getById(jobId: number): JobPosting | undefined {
    return this.mock.jobPostings.find((j) => j.jobId === jobId);
  }

  getByCompany(companyId: number): JobPosting[] {
    return this.mock.jobPostings.filter((j) => j.companyId === companyId);
  }

  add(posting: Omit<JobPosting, 'jobId'>): JobPosting {
    const newPosting: JobPosting = {
      ...posting,
      jobId: Math.max(0, ...this.mock.jobPostings.map((j) => j.jobId)) + 1,
    };
    this.mock.jobPostings.push(newPosting);
    return newPosting;
  }
}
