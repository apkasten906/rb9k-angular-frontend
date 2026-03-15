import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-career-gap-banner',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './career-gap-banner.component.html',
  styleUrls: ['./career-gap-banner.component.scss'],
})
export class CareerGapBannerComponent {
  @Input() gapStart!: string;
  @Input() gapEnd!: string;
  @Input() durationDays!: number;
  @Input() explanation?: string;
  @Output() addExplanation = new EventEmitter<void>();

  get durationMonths(): number {
    return Math.round(this.durationDays / 30);
  }
}
