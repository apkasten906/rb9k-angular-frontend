/**
 * Cucumber World — holds service instances for all step definitions.
 *
 * Services are instantiated directly (no Angular DI / TestBed) so they run
 * cleanly in the Node/ts-node environment.
 *
 * TODO: replace service method calls with `page.xxx()` Playwright calls when
 * wiring up the real browser layer.
 */
import { setWorldConstructor, IWorldOptions, World } from '@cucumber/cucumber';
import { MockDataService } from '../../src/app/core/services/mock-data.service';
import { ApplicationService } from '../../src/app/core/services/application.service';
import { CompanyService } from '../../src/app/core/services/company.service';
import { JobPostingService } from '../../src/app/core/services/job-posting.service';
import { ResumeService } from '../../src/app/core/services/resume.service';
import { CoverLetterService } from '../../src/app/core/services/cover-letter.service';
import { SalaryService } from '../../src/app/core/services/salary.service';
import { TimelineService } from '../../src/app/core/services/timeline.service';
import { JobApplication } from '../../src/app/core/models/job-application.model';
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

  /** The application under test for the current scenario */
  currentApplication: JobApplication | null = null;
  /** Arbitrary extra state shared between steps */
  context: Record<string, unknown> = {};

  constructor(options: IWorldOptions) {
    super(options);

    // Fresh mock data for every scenario
    this.mock = new MockDataService();
    this.applicationService = new ApplicationService(this.mock);
    this.companyService = new CompanyService(this.mock);
    this.jobPostingService = new JobPostingService(this.mock);
    this.resumeService = new ResumeService(this.mock);
    this.coverLetterService = new CoverLetterService(this.mock);
    this.salaryService = new SalaryService(this.mock);
    this.timelineService = new TimelineService(this.mock);
  }

  /** Helper: get the current application (throws if none) */
  get app(): JobApplication {
    if (!this.currentApplication) throw new Error('No current application set in world');
    return this.currentApplication;
  }

  /** Helper: set current application by ID */
  setCurrentById(id: number): void {
    const app = this.applicationService.getById(id);
    if (!app) throw new Error(`Application ${id} not found`);
    this.currentApplication = app;
  }

  /** Helper: re-fetch the current application after a mutation */
  refresh(): void {
    if (this.currentApplication) {
      this.setCurrentById(this.currentApplication.applicationId);
    }
  }

  /** Freeze the service clock to a fixed ISO timestamp for deterministic assertions. */
  freezeTime(isoTimestamp: string): void {
    this.mock.now = () => isoTimestamp;
  }

  /** Resolve a status label string to the ApplicationStatus enum value */
  static resolveStatus(label: string): ApplicationStatus {
    const entry = Object.entries(ApplicationStatus).find(([, v]) => v === label);
    if (!entry) throw new Error(`Unknown status label: "${label}"`);
    return entry[1] as ApplicationStatus;
  }
}

setWorldConstructor(AppWorld);

