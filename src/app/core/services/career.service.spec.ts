import { MockDataService } from './mock-data.service';
import { CareerService } from './career.service';

function freshService(): { service: CareerService; mock: MockDataService } {
  const mock = new MockDataService();
  // Reset career data to a known clean state so each test is independent
  mock.careerEntries = [];
  mock.careerResponsibilities = [];
  mock.careerAchievements = [];
  mock.nextIds = { ...mock.nextIds, careerEntry: 1, responsibility: 1, achievement: 1 };
  const service = new CareerService(mock);
  return { service, mock };
}

describe('CareerService', () => {
  // -------------------------------------------------------------------------
  // CRUD — Career Entries
  // -------------------------------------------------------------------------
  describe('create + getAllByUser + getById', () => {
    it('creates an entry and returns it', () => {
      const { service } = freshService();
      const entry = service.create({
        userId: 1,
        employer: 'Acme Corp',
        jobTitle: 'Data Analyst',
        startDate: '2019-06-01',
        endDate: '2021-08-31',
        location: 'New York, USA',
        description: 'Analyzed sales data',
        category: 'Data Analyst',
      });
      expect(entry.careerEntryId).toBe(1);
      expect(entry.employer).toBe('Acme Corp');
    });

    it('getAllByUser filters by userId', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2020-01-01', endDate: null, location: null, description: null, category: 'J' });
      service.create({ userId: 2, employer: 'B', jobTitle: 'J', startDate: '2020-01-01', endDate: null, location: null, description: null, category: 'J' });
      expect(service.getAllByUser(1)).toHaveLength(1);
    });

    it('getById returns undefined for missing id', () => {
      const { service } = freshService();
      expect(service.getById(999)).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates fields on an existing entry', () => {
      const { service } = freshService();
      const entry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'Analyst', startDate: '2019-01-01', endDate: '2020-01-01', location: null, description: null, category: 'Analyst' });
      const updated = service.update(entry.careerEntryId, { jobTitle: 'Senior Analyst', endDate: '2022-03-31' });
      expect(updated.jobTitle).toBe('Senior Analyst');
      expect(updated.endDate).toBe('2022-03-31');
    });

    it('throws when updating a non-existent entry', () => {
      const { service } = freshService();
      expect(() => service.update(999, { jobTitle: 'X' })).toThrow();
    });
  });

  describe('delete', () => {
    it('removes entry, responsibilities and achievements', () => {
      const { service } = freshService();
      const entry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'DA', startDate: '2019-01-01', endDate: '2021-01-01', location: null, description: null, category: 'DA' });
      service.addResponsibility(entry.careerEntryId, 'Built dashboards');
      service.addAchievement(entry.careerEntryId, 'Saved 40%', '40% saving');

      service.delete(entry.careerEntryId);

      expect(service.getById(entry.careerEntryId)).toBeUndefined();
      expect(service.getResponsibilities(entry.careerEntryId)).toHaveLength(0);
      expect(service.getAchievements(entry.careerEntryId)).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Responsibilities
  // -------------------------------------------------------------------------
  describe('responsibilities', () => {
    it('adds and retrieves responsibilities', () => {
      const { service } = freshService();
      const entry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'DA', startDate: '2019-01-01', endDate: null, location: null, description: null, category: 'DA' });
      service.addResponsibility(entry.careerEntryId, 'Task A');
      service.addResponsibility(entry.careerEntryId, 'Task B');
      expect(service.getResponsibilities(entry.careerEntryId)).toHaveLength(2);
    });

    it('deleteResponsibility removes the correct item', () => {
      const { service } = freshService();
      const entry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'DA', startDate: '2019-01-01', endDate: null, location: null, description: null, category: 'DA' });
      const r = service.addResponsibility(entry.careerEntryId, 'Task A');
      service.deleteResponsibility(r.responsibilityId);
      expect(service.getResponsibilities(entry.careerEntryId)).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Achievements
  // -------------------------------------------------------------------------
  describe('achievements', () => {
    it('adds and retrieves achievements including impactMetric', () => {
      const { service } = freshService();
      const entry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'DA', startDate: '2019-01-01', endDate: null, location: null, description: null, category: 'DA' });
      service.addAchievement(entry.careerEntryId, 'Cut costs by 30%', '30% reduction');
      const achievements = service.getAchievements(entry.careerEntryId);
      expect(achievements).toHaveLength(1);
      expect(achievements[0].impactMetric).toBe('30% reduction');
    });

    it('deleteAchievement removes the correct item', () => {
      const { service } = freshService();
      const entry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'DA', startDate: '2019-01-01', endDate: null, location: null, description: null, category: 'DA' });
      const a = service.addAchievement(entry.careerEntryId, 'Win', null);
      service.deleteAchievement(a.achievementId);
      expect(service.getAchievements(entry.careerEntryId)).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Timeline
  // -------------------------------------------------------------------------
  describe('getTimelineByUser', () => {
    it('returns entries sorted by startDate ascending', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'C', jobTitle: 'J', startDate: '2022-01-01', endDate: '2024-06-30', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2017-01-01', endDate: '2019-05-31', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'B', jobTitle: 'J', startDate: '2019-06-01', endDate: '2021-08-31', location: null, description: null, category: 'J' });
      const timeline = service.getTimelineByUser(1);
      expect(timeline.map((e) => e.startDate)).toEqual(['2017-01-01', '2019-06-01', '2022-01-01']);
    });
  });

  // -------------------------------------------------------------------------
  // Overlap groups
  // -------------------------------------------------------------------------
  describe('getOverlapGroups', () => {
    it('groups overlapping entries together', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2019-03-01', endDate: '2019-08-31', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'B', jobTitle: 'J', startDate: '2019-06-01', endDate: '2019-12-31', location: null, description: null, category: 'J' });
      const groups = service.getOverlapGroups(1);
      expect(groups).toHaveLength(1);
      expect(groups[0]).toHaveLength(2);
    });

    it('keeps non-overlapping entries in separate groups', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2017-01-01', endDate: '2019-05-31', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'B', jobTitle: 'J', startDate: '2020-01-01', endDate: '2022-01-01', location: null, description: null, category: 'J' });
      const groups = service.getOverlapGroups(1);
      expect(groups).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Career gaps
  // -------------------------------------------------------------------------
  describe('getCareerGaps', () => {
    it('detects a gap longer than 60 days', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2017-01-01', endDate: '2019-05-31', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'B', jobTitle: 'J', startDate: '2019-09-15', endDate: '2021-08-31', location: null, description: null, category: 'J' });
      const gaps = service.getCareerGaps(1);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].gapStart).toBe('2019-06-01');
      expect(gaps[0].gapEnd).toBe('2019-09-14');
      expect(gaps[0].durationDays).toBeGreaterThan(60);
    });

    it('does not detect a gap of 60 days or fewer', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2019-01-01', endDate: '2019-03-01', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'B', jobTitle: 'J', startDate: '2019-04-01', endDate: '2020-01-01', location: null, description: null, category: 'J' });
      const gaps = service.getCareerGaps(1);
      expect(gaps).toHaveLength(0);
    });

    it('absorbs overlapping entries before gap detection', () => {
      const { service } = freshService();
      // entries 1 and 2 overlap, so combined they end 2019-08-31 — gap to entry 3
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2017-01-01', endDate: '2019-05-31', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'B', jobTitle: 'J', startDate: '2019-03-01', endDate: '2019-08-31', location: null, description: null, category: 'J' });
      service.create({ userId: 1, employer: 'C', jobTitle: 'J', startDate: '2021-01-01', endDate: '2023-01-01', location: null, description: null, category: 'J' });
      const gaps = service.getCareerGaps(1);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].gapStart).toBe('2019-09-01');
    });

    it('returns empty array for a single entry', () => {
      const { service } = freshService();
      service.create({ userId: 1, employer: 'A', jobTitle: 'J', startDate: '2019-01-01', endDate: '2020-01-01', location: null, description: null, category: 'J' });
      expect(service.getCareerGaps(1)).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Filter by category
  // -------------------------------------------------------------------------
  describe('filterByCategory', () => {
    it('returns only entries, responsibilities and achievements for the given category', () => {
      const { service } = freshService();
      const daEntry = service.create({ userId: 1, employer: 'Acme', jobTitle: 'Data Analyst', startDate: '2019-01-01', endDate: '2021-01-01', location: null, description: null, category: 'Data Analyst' });
      const pmEntry = service.create({ userId: 1, employer: 'Cloud', jobTitle: 'Project Manager', startDate: '2022-01-01', endDate: '2024-01-01', location: null, description: null, category: 'Project Manager' });
      service.addResponsibility(daEntry.careerEntryId, 'Built dashboards');
      service.addResponsibility(pmEntry.careerEntryId, 'Managed projects');
      service.addAchievement(daEntry.careerEntryId, 'Saved 40%', null);
      service.addAchievement(pmEntry.careerEntryId, 'Delivered on time', null);

      const result = service.filterByCategory(1, 'Data Analyst');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].employer).toBe('Acme');
      expect(result.responsibilities).toHaveLength(1);
      expect(result.responsibilities[0].text).toBe('Built dashboards');
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].text).toBe('Saved 40%');
    });
  });

});
