import { Injectable } from '@angular/core';
import { MockDataService } from './mock-data.service';
import { Company } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  constructor(private readonly mock: MockDataService) {}

  getAll(): Company[] {
    return [...this.mock.companies];
  }

  getById(companyId: number): Company | undefined {
    return this.mock.companies.find((c) => c.companyId === companyId);
  }

  add(company: Omit<Company, 'companyId'>): Company {
    const newCompany: Company = {
      ...company,
      companyId: Math.max(0, ...this.mock.companies.map((c) => c.companyId)) + 1,
    };
    this.mock.companies.push(newCompany);
    return newCompany;
  }

  searchByName(name: string): Company[] {
    const lower = name.toLowerCase();
    return this.mock.companies.filter((c) => c.companyName.toLowerCase().includes(lower));
  }
}
