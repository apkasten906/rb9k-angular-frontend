import { ApplicationStatus } from './application-status.enum';

/**
 * Defines allowed forward transitions for each status.
 * Statuses not present as keys are terminal (no transitions allowed).
 */
export const APPLICATION_STATUS_TRANSITIONS: ReadonlyMap<ApplicationStatus, ApplicationStatus[]> =
  new Map([
    [
      ApplicationStatus.Applied,
      [ApplicationStatus.Interviewing, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
    ],
    [
      ApplicationStatus.Interviewing,
      [ApplicationStatus.Offer, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn],
    ],
    [
      ApplicationStatus.Offer,
      [
        ApplicationStatus.Accepted,
        ApplicationStatus.OfferDeclined,
        ApplicationStatus.OfferRescinded,
        ApplicationStatus.Withdrawn,
      ],
    ],
  ]);

export function getAvailableTransitions(current: ApplicationStatus): ApplicationStatus[] {
  return APPLICATION_STATUS_TRANSITIONS.get(current) ?? [];
}

export function isTransitionAllowed(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  return getAvailableTransitions(from).includes(to);
}
