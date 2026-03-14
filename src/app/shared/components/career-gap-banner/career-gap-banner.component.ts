import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-career-gap-banner',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="gap-banner">
      <mat-icon class="gap-icon">hourglass_empty</mat-icon>
      <span class="gap-label">
        Gap: {{ gapStart }} &rarr; {{ gapEnd }}
        ({{ durationMonths }} month{{ durationMonths !== 1 ? 's' : '' }})
      </span>
      @if (explanation?.trim()) {
        <div class="gap-explanation">
          <mat-icon class="explanation-icon">notes</mat-icon>
          <span class="explanation-text">{{ explanation }}</span>
          <button mat-icon-button class="edit-btn" aria-label="Edit explanation" (click)="addExplanation.emit()">
            <mat-icon>edit</mat-icon>
          </button>
        </div>
      } @else {
        <button mat-button color="accent" (click)="addExplanation.emit()">
          Add explanation
        </button>
      }
    </div>
  `,
  styles: [`
    .gap-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #fff8e1;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      margin: 4px 0;
    }
    .gap-icon { color: #f9a825; font-size: 20px; }
    .gap-label { flex: 1; font-size: 0.875rem; color: #555; }
    .gap-explanation { display: flex; align-items: center; gap: 4px; }
    .explanation-icon { font-size: 16px; color: #f9a825; }
    .explanation-text { font-size: 0.875rem; font-style: italic; color: #555; }
    .edit-btn { width: 24px; height: 24px; line-height: 24px; }
  `],
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
