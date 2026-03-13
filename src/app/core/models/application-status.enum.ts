export enum ApplicationStatus {
  Applied = 'Applied',
  Interviewing = 'Interviewing',
  Offer = 'Offer',
  Accepted = 'Accepted',
  OfferDeclined = 'Offer Declined',
  OfferRescinded = 'Offer Rescinded',
  Rejected = 'Rejected',
  Withdrawn = 'Withdrawn',
}

export const TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.Accepted,
  ApplicationStatus.OfferDeclined,
  ApplicationStatus.OfferRescinded,
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
];
