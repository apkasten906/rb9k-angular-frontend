@career-history-management @core-feature
Feature: Career History Management
  As a job seeker
  I want to manage my career history
  So that I can track my experience and match it against job postings

  Background:
    Given the user is signed in
    And the user is on the career history page

  @create
  Scenario: Creating a career entry
    Given the user has no existing career entries
    When the user adds a career entry with details:
      | employer  | job title    | start date | end date   | location      | description                      |
      | Acme Corp | Data Analyst | 2019-06-01 | 2021-08-31 | New York, USA | Analyzed sales data for insights |
    Then the career entry appears in the career history timeline

  @responsibilities
  Scenario: Adding responsibilities to a career entry
    Given a career entry exists for "Acme Corp" as "Data Analyst"
    When the user adds responsibilities:
      | responsibility                         |
      | Built weekly dashboards for leadership |
      | Automated data quality checks          |
    Then the responsibilities are attached to the career entry

  @achievements
  Scenario: Adding achievements with impact metrics
    Given a career entry exists for "Acme Corp" as "Data Analyst"
    When the user adds achievements:
      | achievement                              | impact metric      |
      | Reduced reporting time by 40%            | 40% faster reports |
      | Increased forecast accuracy by 12 points | +12 pp accuracy    |
    Then the achievements are attached to the career entry

  @edit
  Scenario: Editing a career entry
    Given a career entry exists for "Acme Corp" as "Data Analyst"
    When the user updates the details:
      | field       | value                     |
      | job title   | Senior Data Analyst       |
      | end date    | 2022-03-31                |
      | description | Led analytics initiatives |
    Then the career entry reflects the updated details

  @delete
  Scenario: Deleting a career entry cascades related items
    Given a career entry exists for "Acme Corp" as "Data Analyst"
    And the career entry has the following responsibilities:
      | responsibility                         |
      | Built weekly dashboards for leadership |
    And the career entry has the following achievements:
      | achievement                   | impact metric      |
      | Reduced reporting time by 40% | 40% faster reports |
    When the user deletes the career entry
    Then the career entry, its responsibilities, and its achievements are removed

  @timeline
  Scenario: Viewing career timeline in chronological order
    Given the following career entries exist:
      | employer       | job title       | start date | end date   |
      | Beta Systems   | Junior Analyst  | 2017-01-01 | 2019-05-31 |
      | Acme Corp      | Data Analyst    | 2019-06-01 | 2021-08-31 |
      | CloudWorks     | Senior Analyst  | 2022-01-01 | 2024-06-30 |
    When the user views the career timeline
    Then roles are listed by start date ascending

  @overlap
  Scenario: Managing overlapping roles
    Given the following career entries exist:
      | employer       | job title    | start date | end date   |
      | Beta Systems   | Data Analyst | 2019-03-01 | 2019-08-31 |
      | Acme Corp      | Consultant   | 2019-06-01 | 2019-12-31 |
    When the user views the career timeline
    Then the two roles are displayed as concurrent and not merged into a single entry

  @filter
  Scenario: Filtering by role category
    Given the following career entries exist:
      | employer     | job title       | start date | end date   |
      | Acme Corp    | Data Analyst    | 2019-06-01 | 2021-08-31 |
      | CloudWorks   | Project Manager | 2022-01-01 | 2024-06-30 |
    And each entry has at least one responsibility and one achievement
    When the user filters by role category "Data Analyst"
    Then only responsibilities and achievements linked to "Data Analyst" roles are shown

  @gaps
  Scenario: Career gap handling
    Given the following career entries exist:
      | employer     | job title    | start date | end date   |
      | Beta Systems | Data Analyst | 2017-01-01 | 2019-05-31 |
      | Acme Corp    | Consultant   | 2019-09-15 | 2021-08-31 |
    When the user views the career timeline
    Then a gap banner is shown between the two roles
    And the banner displays the gap start date "2019-06-01", end date "2019-09-14", and duration in months
    And the banner includes a prompt to add an explanation
    When the user saves the explanation "Took time off for personal development"
    Then the gap banner shows the explanation "Took time off for personal development"

  @validation
  Scenario: Rejecting a career entry with end date before start date
    Given the user has no existing career entries
    When the user adds a career entry with details:
      | employer  | job title    | start date | end date   | location      | description                      |
      | Acme Corp | Data Analyst | 2021-08-31 | 2019-06-01 | New York, USA | Analyzed sales data for insights |
    Then a validation error is shown indicating end date must not be before start date
    And no career entry is saved

  @empty-state
  Scenario: Viewing career history with no entries
    Given the user has no existing career entries
    When the user views the career timeline
    Then an empty state message is displayed prompting the user to add their first role
