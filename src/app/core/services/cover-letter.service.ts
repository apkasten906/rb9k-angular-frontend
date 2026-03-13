import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { CoverLetter } from '../models/cover-letter.model';

@Injectable({ providedIn: 'root' })
export class CoverLetterService {
  constructor(private readonly mock: MockDataService) {}

  getByUser(userId: number): CoverLetter[] {
    return this.mock.coverLetters.filter((c) => c.userId === userId);
  }

  getById(coverLetterId: number): CoverLetter | undefined {
    return this.mock.coverLetters.find((c) => c.coverLetterId === coverLetterId);
  }

  getActiveByUser(userId: number): CoverLetter[] {
    return this.getByUser(userId).filter((c) => c.status === 'active');
  }

  markDeleted(coverLetterId: number): void {
    const cl = this.getById(coverLetterId);
    if (cl) {
      cl.status = 'deleted';
      cl.lastModified = this.mock.now();
    }
  }
}
