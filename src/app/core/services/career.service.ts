import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { CareerEntry } from '../models/career-entry.model';
import { CareerResponsibility } from '../models/career-responsibility.model';
import { CareerAchievement } from '../models/career-achievement.model';

export interface CareerGap {
  gapStart: string;
  gapEnd: string;
  durationDays: number;
  explanation?: string;
}

@Injectable({ providedIn: 'root' })
export class CareerService {
  constructor(private readonly mock: MockDataService) {}

  // ---------------------------------------------------------------------------
  // Career Entries
  // ---------------------------------------------------------------------------

  getAllByUser(userId: number): CareerEntry[] {
    return this.mock.careerEntries.filter((e) => e.userId === userId);
  }

  getById(id: number): CareerEntry | undefined {
    return this.mock.careerEntries.find((e) => e.careerEntryId === id);
  }

  create(data: Omit<CareerEntry, 'careerEntryId'>): CareerEntry {
    const entry: CareerEntry = { ...data, careerEntryId: this.mock.nextIds.careerEntry++ };
    this.mock.careerEntries.push(entry);
    return entry;
  }

  update(id: number, changes: Partial<Omit<CareerEntry, 'careerEntryId' | 'userId'>>): CareerEntry {
    const entry = this.getById(id);
    if (!entry) throw new Error(`CareerEntry ${id} not found`);
    Object.assign(entry, changes);
    return entry;
  }

  delete(id: number): void {
    this.mock.careerEntries = this.mock.careerEntries.filter((e) => e.careerEntryId !== id);
    this.mock.careerResponsibilities = this.mock.careerResponsibilities.filter(
      (r) => r.careerEntryId !== id
    );
    this.mock.careerAchievements = this.mock.careerAchievements.filter(
      (a) => a.careerEntryId !== id
    );
  }

  // ---------------------------------------------------------------------------
  // Responsibilities
  // ---------------------------------------------------------------------------

  getResponsibilities(careerEntryId: number): CareerResponsibility[] {
    return this.mock.careerResponsibilities.filter((r) => r.careerEntryId === careerEntryId);
  }

  addResponsibility(careerEntryId: number, text: string): CareerResponsibility {
    const r: CareerResponsibility = {
      responsibilityId: this.mock.nextIds.responsibility++,
      careerEntryId,
      text,
    };
    this.mock.careerResponsibilities.push(r);
    return r;
  }

  deleteResponsibility(responsibilityId: number): void {
    this.mock.careerResponsibilities = this.mock.careerResponsibilities.filter(
      (r) => r.responsibilityId !== responsibilityId
    );
  }

  // ---------------------------------------------------------------------------
  // Achievements
  // ---------------------------------------------------------------------------

  getAchievements(careerEntryId: number): CareerAchievement[] {
    return this.mock.careerAchievements.filter((a) => a.careerEntryId === careerEntryId);
  }

  addAchievement(
    careerEntryId: number,
    text: string,
    impactMetric: string | null
  ): CareerAchievement {
    const a: CareerAchievement = {
      achievementId: this.mock.nextIds.achievement++,
      careerEntryId,
      text,
      impactMetric,
    };
    this.mock.careerAchievements.push(a);
    return a;
  }

  deleteAchievement(achievementId: number): void {
    this.mock.careerAchievements = this.mock.careerAchievements.filter(
      (a) => a.achievementId !== achievementId
    );
  }

  // ---------------------------------------------------------------------------
  // Timeline
  // ---------------------------------------------------------------------------

  /** Returns entries for a user sorted by startDate ascending. */
  getTimelineByUser(userId: number): CareerEntry[] {
    return this.getAllByUser(userId).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  /**
   * Groups entries into clusters of overlapping date ranges.
   * Each cluster is an array of entries whose intervals intersect with at least one other
   * entry in the same cluster. Non-overlapping single entries appear as single-element arrays.
   */
  getOverlapGroups(userId: number): CareerEntry[][] {
    const sorted = this.getTimelineByUser(userId);
    const groups: CareerEntry[][] = [];

    for (const entry of sorted) {
      const entryStart = entry.startDate;
      const entryEnd = entry.endDate ?? '9999-12-31';

      // find an existing group this entry overlaps with
      const target = groups.find((g) =>
        g.some((e) => {
          const gs = e.startDate;
          const ge = e.endDate ?? '9999-12-31';
          return entryStart <= ge && gs <= entryEnd;
        })
      );

      if (target) {
        target.push(entry);
      } else {
        groups.push([entry]);
      }
    }

    return groups;
  }

  /**
   * Returns gaps longer than 60 days (≈ 2 months) between consecutive
   * non-overlapping merged intervals, sorted by gapStart.
   */
  getCareerGaps(userId: number): CareerGap[] {
    const sorted = this.getTimelineByUser(userId);
    if (sorted.length < 2) return [];

    const merged = this.buildMergedIntervals(sorted);
    const gaps: CareerGap[] = [];

    for (let i = 1; i < merged.length; i++) {
      const gapStartDate = new Date(merged[i - 1].end);
      gapStartDate.setDate(gapStartDate.getDate() + 1);
      const gapEndDate = new Date(merged[i].start);
      gapEndDate.setDate(gapEndDate.getDate() - 1);

      const durationDays = Math.floor(
        (gapEndDate.getTime() - gapStartDate.getTime()) / 86400000
      );

      if (durationDays > 60) {
        const gapStart = gapStartDate.toISOString().slice(0, 10);
        const gapEnd = gapEndDate.toISOString().slice(0, 10);
        gaps.push({
          gapStart,
          gapEnd,
          durationDays,
          explanation: this.mock.gapExplanations[`${userId}:${gapStart}`],
        });
      }
    }

    return gaps;
  }

  private buildMergedIntervals(sorted: CareerEntry[]): Array<{ start: string; end: string }> {
    const merged: Array<{ start: string; end: string }> = [];
    for (const entry of sorted) {
      const end = entry.endDate ?? '9999-12-31';
      const last = merged.at(-1);
      if (!last) {
        merged.push({ start: entry.startDate, end });
      } else if (entry.startDate <= last.end) {
        if (end > last.end) last.end = end;
      } else {
        merged.push({ start: entry.startDate, end });
      }
    }
    return merged;
  }

  setGapExplanation(userId: number, gapStart: string, explanation: string): void {
    this.mock.gapExplanations[`${userId}:${gapStart}`] = explanation;
  }

  // ---------------------------------------------------------------------------
  // Filter by category
  // ---------------------------------------------------------------------------

  filterByCategory(
    userId: number,
    category: string
  ): {
    entries: CareerEntry[];
    responsibilities: CareerResponsibility[];
    achievements: CareerAchievement[];
  } {
    const entries = this.getAllByUser(userId).filter((e) => e.category === category);
    const entryIds = new Set(entries.map((e) => e.careerEntryId));
    return {
      entries,
      responsibilities: this.mock.careerResponsibilities.filter((r) =>
        entryIds.has(r.careerEntryId)
      ),
      achievements: this.mock.careerAchievements.filter((a) => entryIds.has(a.careerEntryId)),
    };
  }

}
