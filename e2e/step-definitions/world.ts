/**
 * Cucumber World — holds service instances and Playwright browser objects for all step definitions.
 *
 * Services are instantiated directly (no Angular DI / TestBed) so they run
 * cleanly in the Node/ts-node environment alongside Playwright browser interactions.
 *
 * Before each scenario, browser.hooks.ts opens a new BrowserContext + Page.
 * navigateTo() syncs the Node-side mock state into the browser via addInitScript
 * so that window.__playwrightTestData is available when MockDataService initialises.
 */
import { setWorldConstructor, IWorldOptions, World } from '@cucumber/cucumber';
import { BrowserContext, Page } from '@playwright/test';
import { MockDataService } from '../../src/app/core/services/mock-data.service';
import { ApplicationService } from '../../src/app/core/services/application.service';
import { CompanyService } from '../../src/app/core/services/company.service';
import { JobPostingService } from '../../src/app/core/services/job-posting.service';
import { ResumeService } from '../../src/app/core/services/resume.service';
import { CoverLetterService } from '../../src/app/core/services/cover-letter.service';
import { SalaryService } from '../../src/app/core/services/salary.service';
import { TimelineService } from '../../src/app/core/services/timeline.service';
import { CareerService } from '../../src/app/core/services/career.service';
import { UserProfileService } from '../../src/app/core/services/user-profile.service';
import { JobApplication } from '../../src/app/core/models/job-application.model';
import { CareerEntry } from '../../src/app/core/models/career-entry.model';
import { ApplicationStatus } from '../../src/app/core/models/application-status.enum';

export class AppWorld extends World {
  mock: MockDataService;
  applicationService: ApplicationService;
  companyService: CompanyService;
  jobPostingService: JobPostingService;
  resumeService: ResumeService;
  coverLetterService: CoverLetterService;
  salaryService: SalaryService;
  timelineService: TimelineService;
  careerService: CareerService;
  userProfileService: UserProfileService;

  /** Playwright browser context — opened per scenario by browser.hooks.ts. */
  browserContext!: BrowserContext;
  /** Playwright page — opened per scenario by browser.hooks.ts. */
  page!: Page;

  currentApplication: JobApplication | null = null;
  currentCareerEntry: CareerEntry | null = null;
  context: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);
    this.mock = new MockDataService();
    this.applicationService = new ApplicationService(this.mock);
    this.companyService = new CompanyService(this.mock);
    this.jobPostingService = new JobPostingService(this.mock);
    this.resumeService = new ResumeService(this.mock);
    this.coverLetterService = new CoverLetterService(this.mock);
    this.salaryService = new SalaryService(this.mock);
    this.timelineService = new TimelineService(this.mock);
    this.careerService = new CareerService(this.mock);
    this.userProfileService = new UserProfileService(this.mock);
  }

  /**
   * Navigate to a path, first seeding the browser's MockDataService with the
   * current Node-side mock state via window.__playwrightTestData (read by the
   * MockDataService constructor when running in Angular).
   */
  async navigateTo(path: string): Promise<void> {
    const profiles = this.mock.profiles;
    await this.page.addInitScript((testData) => {
      (globalThis as unknown as Record<string, unknown>)['__playwrightTestData'] = testData;
    }, { profiles });
    await this.page.goto(path);
  }

  get app(): JobApplication {
    if (!this.currentApplication) throw new Error('No current application set in world');
    return this.currentApplication;
  }

  setCurrentById(id: number): void {
    const app = this.applicationService.getById(id);
    if (!app) throw new Error(`Application ${id} not found`);
    this.currentApplication = app;
  }

  refresh(): void {
    if (this.currentApplication) {
      this.setCurrentById(this.currentApplication.applicationId);
    }
  }

  freezeTime(isoTimestamp: string): void {
    this.mock.now = () => isoTimestamp;
  }

  static resolveStatus(label: string): ApplicationStatus {
    const entry = Object.entries(ApplicationStatus).find(([, v]) => v === label);
    if (!entry) throw new Error(`Unknown status label: "${label}"`);
    return entry[1] as ApplicationStatus;
  }
}

setWorldConstructor(AppWorld);

