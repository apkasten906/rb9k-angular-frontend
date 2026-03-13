import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CareerService, CareerGap } from '../../../core/services/career.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { CareerEntry } from '../../../core/models/career-entry.model';
import { CareerGapBannerComponent } from '../../../shared/components/career-gap-banner/career-gap-banner.component';

export interface TimelineRow {
  type: 'group' | 'gap';
  entries?: CareerEntry[];
  gap?: CareerGap;
}

@Component({
  selector: 'app-career-history-list',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    CareerGapBannerComponent,
  ],
  templateUrl: './career-history-list.component.html',
  styleUrls: ['./career-history-list.component.scss'],
})
export class CareerHistoryListComponent implements OnInit {
  timelineRows: TimelineRow[] = [];
  categories: string[] = [];
  selectedCategory = '';

  editingGap: CareerGap | null = null;
  gapExplanationDraft = '';

  constructor(
    private readonly careerService: CareerService,
    private readonly mockData: MockDataService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const userId = this.mockData.currentUser.userId;
    const allEntries = this.careerService.getAllByUser(userId);
    this.categories = [...new Set(allEntries.map((e) => e.category))].sort((a, b) => a.localeCompare(b));

    const entries = this.selectedCategory
      ? allEntries.filter((e) => e.category === this.selectedCategory)
      : allEntries;

    this.timelineRows = this.buildRows(userId, entries);
  }

  private buildRows(userId: number, entries: CareerEntry[]): TimelineRow[] {
    const overlapGroups = this.careerService.getOverlapGroups(userId);
    const gaps = this.careerService.getCareerGaps(userId);

    // Filter groups to only include entries from the filtered set
    const filteredEntryIds = new Set(entries.map((e) => e.careerEntryId));
    const filteredGroups = overlapGroups
      .map((g) => g.filter((e) => filteredEntryIds.has(e.careerEntryId)))
      .filter((g) => g.length > 0);

    const rows: TimelineRow[] = [];
    for (const group of filteredGroups) {
      const groupStart = group[0].startDate;
      const prevRow = rows.at(-1);
      const relevantGap = gaps.find((gap) => {
        if (prevRow?.type !== 'group') return false;
        const prevEnd = (prevRow.entries ?? [])
          .map((e) => e.endDate ?? '9999-12-31')
          .sort((a, b) => b.localeCompare(a))
          .at(0) ?? '';
        return gap.gapStart > prevEnd && gap.gapEnd < groupStart;
      });
      if (relevantGap) rows.push({ type: 'gap', gap: relevantGap });
      rows.push({ type: 'group', entries: group });
    }

    return rows;
  }

  navigateTo(entryId: number): void {
    this.router.navigate(['/career-history', entryId]);
  }

  addNew(): void {
    this.router.navigate(['/career-history/new']);
  }

  onAddExplanation(gap: CareerGap | undefined): void {
    if (!gap) return;
    this.editingGap = gap;
    this.gapExplanationDraft = gap.explanation ?? '';
  }

  saveGapExplanation(): void {
    if (!this.editingGap) return;
    this.careerService.setGapExplanation(
      this.mockData.currentUser.userId,
      this.editingGap.gapStart,
      this.gapExplanationDraft.trim()
    );
    this.editingGap = null;
    this.load();
  }

  cancelGapExplanation(): void {
    this.editingGap = null;
  }

  onCategoryChange(): void {
    this.load();
  }

  isOverlapping(group: CareerEntry[]): boolean {
    return group.length > 1;
  }
}
