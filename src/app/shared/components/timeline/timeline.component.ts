import { Component, Input, OnChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { TimelineEvent } from '../../../core/models/timeline-event.model';

const DAY_MS = 86400000;
const GAP_THRESHOLD_DAYS = 30;

export interface TimelineRow {
  type: 'event' | 'gap';
  event?: TimelineEvent;
  gapDays?: number;
}

@Component({
  selector: 'app-timeline',
  imports: [DatePipe, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements OnChanges {
  @Input() events: TimelineEvent[] = [];

  rows: TimelineRow[] = [];

  ngOnChanges(): void {
    this.rows = this.buildRows(this.events);
  }

  private buildRows(events: TimelineEvent[]): TimelineRow[] {
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const rows: TimelineRow[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const prev = new Date(sorted[i - 1].timestamp).getTime();
        const curr = new Date(sorted[i].timestamp).getTime();
        const gapDays = Math.floor((curr - prev) / DAY_MS);
        if (gapDays >= GAP_THRESHOLD_DAYS) {
          rows.push({ type: 'gap', gapDays });
        }
      }
      rows.push({ type: 'event', event: sorted[i] });
    }
    return rows;
  }

  iconFor(eventType: TimelineEvent['eventType']): string {
    switch (eventType) {
      case 'creation': return 'add_circle';
      case 'status_change': return 'swap_horiz';
      case 'note': return 'note';
      case 'document_link': return 'attach_file';
      case 'salary_update': return 'attach_money';
      case 'date_change': return 'edit_calendar';
    }
  }
}
