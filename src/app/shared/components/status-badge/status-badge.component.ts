import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ApplicationStatus } from '../../../core/models/application-status.enum';

type StatusGroup = 'active' | 'terminal-success' | 'terminal-declined';

@Component({
  selector: 'app-status-badge',
  imports: [NgClass, MatChipsModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input() status!: ApplicationStatus;

  get statusGroup(): StatusGroup {
    switch (this.status) {
      case ApplicationStatus.Accepted:
        return 'terminal-success';
      case ApplicationStatus.OfferDeclined:
      case ApplicationStatus.OfferRescinded:
      case ApplicationStatus.Rejected:
      case ApplicationStatus.Withdrawn:
        return 'terminal-declined';
      default:
        return 'active';
    }
  }
}
