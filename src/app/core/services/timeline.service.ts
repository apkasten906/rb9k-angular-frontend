import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { TimelineEvent } from '../models/timeline-event.model';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  constructor(private readonly mock: MockDataService) {}

  getTimeline(applicationId: number): TimelineEvent[] {
    return this.mock.timelineEvents
      .filter((e) => e.applicationId === applicationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  addEvent(event: TimelineEvent): void {
    this.mock.timelineEvents.push(event);
  }
}
