export type TimelineEventType =
  | 'creation'
  | 'status_change'
  | 'note'
  | 'document_link'
  | 'salary_update'
  | 'date_change';

export interface TimelineEvent {
  eventType: TimelineEventType;
  applicationId: number;
  details: string;
  author: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}
