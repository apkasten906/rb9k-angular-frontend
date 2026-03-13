import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { SalaryInfo } from '../models/salary-info.model';
import { TimelineEvent } from '../models/timeline-event.model';

@Injectable({ providedIn: 'root' })
export class SalaryService {
  constructor(private readonly mock: MockDataService) {}

  getByApplication(applicationId: number): SalaryInfo | undefined {
    return this.mock.salaryInfos.find((s) => s.applicationId === applicationId);
  }

  setSalaryInfo(
    applicationId: number,
    data: Omit<SalaryInfo, 'salaryId' | 'applicationId'>,
    author: string = 'Alex Morgan'
  ): SalaryInfo {
    const existing = this.getByApplication(applicationId);
    const timestamp = new Date().toISOString();

    if (existing) {
      Object.assign(existing, data);
    } else {
      const newSalary: SalaryInfo = {
        salaryId: this.mock.nextIds.salary++,
        applicationId,
        ...data,
      };
      this.mock.salaryInfos.push(newSalary);

      const app = this.mock.applications.find((a) => a.applicationId === applicationId);
      if (app) {
        app.salaryInfoId = newSalary.salaryId;
      }
    }

    const parts: string[] = [];
    const currency = data.currency ?? null;
    const formatAmount = (amount: number): string => {
      if (!currency) return `$${amount.toLocaleString()}`;
      try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
      catch { return `${currency} ${amount.toLocaleString()}`; }
    };
    if (data.userExpectedSalary != null) parts.push(`Expected: ${formatAmount(data.userExpectedSalary)}`);
    if (data.companyOfferedSalary != null) parts.push(`Offered: ${formatAmount(data.companyOfferedSalary)}`);
    if (data.industryAverageSalary != null) parts.push(`Industry avg: ${formatAmount(data.industryAverageSalary)}`);
    if (data.currency || data.region) parts.push(`(${[data.currency, data.region].filter(Boolean).join(', ')})`);

    const event: TimelineEvent = {
      eventType: 'salary_update',
      applicationId,
      details: parts.join(' | '),
      author,
      timestamp,
    };
    this.mock.timelineEvents.push(event);

    return this.getByApplication(applicationId) as unknown as SalaryInfo;
  }
}
