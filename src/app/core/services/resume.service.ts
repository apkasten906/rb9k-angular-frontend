import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { Resume } from '../models/resume.model';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  constructor(private readonly mock: MockDataService) {}

  getByUser(userId: number): Resume[] {
    return this.mock.resumes.filter((r) => r.userId === userId);
  }

  getById(resumeId: number): Resume | undefined {
    return this.mock.resumes.find((r) => r.resumeId === resumeId);
  }

  getActiveByUser(userId: number): Resume[] {
    return this.getByUser(userId).filter((r) => r.status === 'active');
  }

  addVersion(parentResumeId: number, title: string): Resume {
    const parent = this.getById(parentResumeId);
    const newResume: Resume = {
      resumeId: this.mock.nextIds.resume++,
      userId: parent?.userId ?? 1,
      jobId: null,
      title,
      version: (parent?.version ?? 0) + 1,
      parentResumeId,
      status: 'active',
      createdDate: this.mock.now(),
      lastModified: null,
    };
    this.mock.resumes.push(newResume);
    return newResume;
  }

  markDeleted(resumeId: number): void {
    const resume = this.getById(resumeId);
    if (resume) {
      resume.status = 'deleted';
      resume.lastModified = this.mock.now();
    }
  }
}
