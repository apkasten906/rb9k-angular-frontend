import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { JobApplication } from '../models/job-application.model';
import { ApplicationStatus } from '../models/application-status.enum';
import { ApplicationStatusHistory } from '../models/application-status-history.model';
import { ApplicationNote } from '../models/application-note.model';
import { TimelineEvent } from '../models/timeline-event.model';
import { isTransitionAllowed, getAvailableTransitions } from '../models/application-status-machine';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  constructor(private readonly mock: MockDataService) {}

  getAll(): JobApplication[] {
    return [...this.mock.applications];
  }

  getById(applicationId: number): JobApplication | undefined {
    return this.mock.applications.find((a) => a.applicationId === applicationId);
  }

  getByUser(userId: number): JobApplication[] {
    return this.mock.applications.filter((a) => a.userId === userId);
  }

  getByCompany(companyId: number): JobApplication[] {
    return this.mock.applications.filter((a) => a.companyId === companyId);
  }

  createApplication(
    data: Omit<JobApplication, 'applicationId'>,
    author: string = 'Alex Morgan'
  ): JobApplication {
    const today = new Date();
    const todayDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    const app: JobApplication = {
      ...data,
      applicationId: this.mock.nextIds.application++,
      status: ApplicationStatus.Applied,
      appliedDate: (data.appliedDate ?? todayDate).slice(0, 10),
    };
    this.mock.applications.push(app);

    const creationEvent: TimelineEvent = {
      eventType: 'creation',
      applicationId: app.applicationId,
      details: 'Application created',
      author,
      timestamp: this.mock.now(),
    };
    this.mock.timelineEvents.push(creationEvent);

    return app;
  }

  updateStatus(
    applicationId: number,
    newStatus: ApplicationStatus,
    author: string = 'Alex Morgan'
  ): JobApplication {
    const app = this.getById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    if (!isTransitionAllowed(app.status, newStatus)) {
      throw new Error(
        `Transition from "${app.status}" to "${newStatus}" is not allowed`
      );
    }

    const timestamp = this.mock.now();
    const history: ApplicationStatusHistory = {
      historyId: this.mock.nextIds.statusHistory++,
      applicationId,
      from: app.status,
      to: newStatus,
      timestamp,
    };
    this.mock.statusHistories.push(history);

    const event: TimelineEvent = {
      eventType: 'status_change',
      applicationId,
      details: `${app.status} → ${newStatus}`,
      author,
      timestamp,
    };
    this.mock.timelineEvents.push(event);

    app.status = newStatus;
    return app;
  }

  addNote(
    applicationId: number,
    content: string,
    author: string = 'Alex Morgan'
  ): ApplicationNote {
    const note: ApplicationNote = {
      noteId: this.mock.nextIds.note++,
      applicationId,
      content,
      author,
      createdAt: this.mock.now(),
    };
    this.mock.notes.push(note);

    const event: TimelineEvent = {
      eventType: 'note',
      applicationId,
      details: content,
      author,
      timestamp: note.createdAt,
    };
    this.mock.timelineEvents.push(event);

    return note;
  }

  getNotes(applicationId: number): ApplicationNote[] {
    return this.mock.notes
      .filter((n) => n.applicationId === applicationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getStatusHistory(applicationId: number): ApplicationStatusHistory[] {
    return this.mock.statusHistories
      .filter((h) => h.applicationId === applicationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  getAvailableTransitions(applicationId: number): ApplicationStatus[] {
    const app = this.getById(applicationId);
    if (!app) return [];
    return getAvailableTransitions(app.status);
  }

  updateAppliedDate(
    applicationId: number,
    newDate: string,
    author: string = 'Alex Morgan'
  ): JobApplication {
    const app = this.getById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    const oldDate = app.appliedDate;
    app.appliedDate = newDate;

    const event: TimelineEvent = {
      eventType: 'date_change',
      applicationId,
      details: `Applied date changed from ${oldDate} to ${newDate}`,
      author,
      timestamp: this.mock.now(),
    };
    this.mock.timelineEvents.push(event);

    return app;
  }

  updatePostingUrl(
    applicationId: number,
    newUrl: string | null
  ): JobApplication {
    const app = this.getById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);
    app.postingUrl = newUrl || null;
    return app;
  }

  linkDocuments(
    applicationId: number,
    resumeId: number | null,
    coverLetterId: number | null,
    author: string = 'Alex Morgan'
  ): JobApplication {
    const app = this.getById(applicationId);
    if (!app) throw new Error(`Application ${applicationId} not found`);

    app.resumeId = resumeId;
    app.coverLetterId = coverLetterId;

    const parts: string[] = [];
    if (resumeId != null) parts.push(`Resume #${resumeId}`);
    if (coverLetterId != null) parts.push(`Cover Letter #${coverLetterId}`);

    if (parts.length > 0) {
      const event: TimelineEvent = {
        eventType: 'document_link',
        applicationId,
        details: `Documents linked: ${parts.join(', ')}`,
        author,
        timestamp: this.mock.now(),
      };
      this.mock.timelineEvents.push(event);
    }

    return app;
  }
}
