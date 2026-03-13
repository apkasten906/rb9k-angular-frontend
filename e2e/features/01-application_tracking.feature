@application-tracking @core-feature
Feature: Application Tracking
  As a user
  I want to manage my job applications
  So that I can track progress with company insights, salary information, and documents
  Background:
    Given the current timestamp is "2026-03-12T10:26:06.997553"

  @create @happy-path
  Scenario: Create a new application with company and job posting
    Given the user selects an employer from company intelligence
    And a job posting with title "Data Analyst" exists
    And the job posting has a posting URL
    And the user has at least one resume saved
    When the user creates a job application linked to the employer and job posting with status "Applied"
    Then the job application is saved with a creation timestamp
    And the application owner is the user
    And the employer and job posting are associated
    And the posting URL is stored

  @create @partial-data
  Scenario: Create application with partial data
    Given the user selects an employer
    And no job posting is available
    When the user creates a job application with status "Applied"
    And the user leaves salary fields blank
    Then the job application is saved
    And salary details fields are null
      | field            |
      | offered          |
      | expected         |
      | industry_average |

  @create @posting-url
  Scenario: Create application with job posting URL
    Given the user finds a job posting at URL "https://company.com/careers/data-analyst-123"
    And the job posting has title "Data Analyst"
    When the user creates a job application with the posting URL
    Then the job application is saved with the posting URL field
    And the posting URL is "https://company.com/careers/data-analyst-123"
    And the user can click the URL to return to the original posting

  @documents @linking
  Scenario: Link a specific resume and cover letter
    Given the user has resume "R1"
    And the user has cover letter "C1"
    And an existing job application exists
    When the user links "R1" and "C1" to the job application
    Then the job application references "R1" and "C1"
    And the timeline records "Documents linked" with timestamps

  @status @workflow @notes
  Scenario: Update application status through workflow with notes
    Given a job application in status "Applied"
    When the user updates status to "Interviewing"
    And the user adds note "Phone screen scheduled"
    And the user updates status to "Offer"
    And the user adds note "Offer received"
    Then the status history records the following transitions:
      | from         | to           | timestamp |
      | Applied      | Interviewing |     |
      | Interviewing | Offer        |     |
    And both notes are stored and shown in chronological order

  @status @offer @acceptance
  Scenario: Accept an offer
    Given a job application in status "Offer"
    When the user updates status to "Accepted"
    And the user adds note "Accepted via email"
    Then the final status is "Accepted"
    And no further forward transitions are allowed

  @status @offer @offer-declined
  Scenario: Decline an offer
    Given a job application in status "Offer"
    When the user updates status to "Offer Declined"
    And the user adds note "Compensation did not meet expectations"
    Then the final status is "Offer Declined"
    And no further forward transitions are allowed

  @status @offer @offer-rescinded
  Scenario: Offer is rescinded by the company
    Given a job application in status "Offer"
    When the user updates status to "Offer Rescinded"
    And the user adds note "Position eliminated before start date"
    Then the final status is "Offer Rescinded"
    And no further forward transitions are allowed

  @status @withdrawal
  Scenario: Withdraw an application at any stage
    Given a job application in status "Interviewing"
    When the user updates status to "Withdrawn"
    And the user adds note "Accepted another offer"
    Then the final status is "Withdrawn"
    And no further forward transitions are allowed

  @status @rejection-not-from-offer
  Scenario: Rejected status is not reachable from Offer
    Given a job application in status "Offer"
    Then the status "Rejected" is not an available transition

  @salary @multiple-sources
  Scenario: Record salary information from multiple sources
    Given a job application exists
    When the user sets expected salary to 120000 "USD"
    And the user enters company offer as 115000 "USD"
    And salary intelligence returns industry average 118000 "USD" for region "NY"
    Then salary details store all three values with currency and region
    And the timeline records each salary update with a timestamp

  @timeline @history @view
  Scenario: View application details and history
    Given a job application with status changes exists
    And the job application has notes
    And the job application has a linked resume and cover letter
    When the user opens the application timeline
    Then the user sees chronological events in order:
      | event_type     | details                 |
      | creation       | with timestamp          |
      | status_changes | with timestamps         |
      | notes          | with authors            |
      | document_links | with timestamps         |
      | salary_updates | with authors/timestamps |

  @multiple-applications @same-company
  Scenario: Handle same company, different positions
    Given an employer "Acme"
    And job posting "J1" for employer "Acme"
    And job posting "J2" for employer "Acme"
    When the user creates a job application for "J1"
    And the user creates a job application for "J2"
    Then both applications exist with distinct IDs
    And both applications have separate histories
    And filtering by employer "Acme" shows both applications separately

  @documents @versioning @deletion
  Scenario: Manage document modifications and deletions
    Given a job application linked to resume "R1"
    And the job application is linked to cover letter "C1"
    When "R1" is updated to a new version "R1v2"
    Then the application shows "R1v2" as current
    And the application retains history of "R1"
    When "C1" is deleted
    Then the application shows "cover letter missing"
    And the application prompts the user to relink
    And prior timeline entries for "C1" are preserved

  @timeline @long-gap @status-update
  Scenario: Update after extended period
    Given a job application in status "Interviewing"
    And the job application has had no updates for 90 days
    When the user adds a note "Position on hold"
    And the user sets status to "Rejected"
    Then the history captures the long gap between updates
    And the new entries are recorded with accurate timestamps

  # ─────────────────────────────────────────────────────────────────────────────
  # Column-header filtering — each column header contains a filter input/select
  # ─────────────────────────────────────────────────────────────────────────────

  @filter-sort
  Scenario: Filter by company name via column header
    Given there are applications for company "Acme"
    When the user types "Acme" in the company column filter
    Then only applications for "Acme" are shown

  @filter-sort
  Scenario: Filter by job title via column header
    Given there are applications with job title "Data Analyst"
    When the user types "Data" in the job title column filter
    Then only applications matching "Data" in the job title are shown

  @filter-sort
  Scenario: Filter by status via column header dropdown
    Given there are applications with statuses "Applied", "Interviewing", and "Accepted"
    When the user selects "Interviewing" from the status column filter
    Then only applications with status "Interviewing" are shown

  @filter-sort
  Scenario: Filter by applied date via column header
    Given there are multiple applications with different applied dates
    When the user types "2026-03" in the applied date column filter
    Then only applications with applied dates containing "2026-03" are shown

  @filter-sort
  Scenario: Clearing a column filter restores all rows
    Given there are applications for company "Acme"
    When the user types "Acme" in the company column filter
    And the user clears the company column filter
    Then all applications are shown

  @filter-sort
  Scenario: Combine company and status column filters
    Given there are applications for "Acme" with statuses "Applied" and "Interviewing"
    When the user types "Acme" in the company column filter
    And the user selects "Applied" from the status column filter
    Then only applications matching both filters are shown

  # ─────────────────────────────────────────────────────────────────────────────
  # Sorting — clicking a column header cycles through ascending / descending
  # ─────────────────────────────────────────────────────────────────────────────

  @filter-sort
  Scenario: Sort applications by applied date ascending
    Given there are multiple applications with different applied dates
    When the user sorts by "appliedDate" ascending
    Then the applications are ordered oldest first

  @filter-sort
  Scenario: Sort applications by applied date descending
    Given there are multiple applications with different applied dates
    When the user sorts by "appliedDate" descending
    Then the applications are ordered newest first

  @filter-sort
  Scenario: Sort applications by company name alphabetically
    Given there are applications for companies "DataVision" and "Acme"
    When the user sorts by "company" ascending
    Then "Acme" applications appear before "DataVision" applications

  # ─────────────────────────────────────────────────────────────────────────────
  # Company creation
  # ─────────────────────────────────────────────────────────────────────────────

  @create-company
  Scenario: Add a new company by name
    Given the company "Innovatech" does not exist in the system
    When the user adds a new company named "Innovatech"
    Then "Innovatech" appears in the company list
    And the user can select "Innovatech" for a new application

  @create-company
  Scenario: Company creation requires a non-blank name
    When the user tries to add a company with a blank name
    Then the company is not created
    And the total company count does not change

  # ─────────────────────────────────────────────────────────────────────────────
  # Applied date — stored and displayed as YYYY-MM-DD (no time component)
  # ─────────────────────────────────────────────────────────────────────────────

  @applied-date
  Scenario: Set a specific applied date when creating an application
    Given the user selects company "Acme" for a new application
    When the user sets the applied date to "2026-01-15"
    And the user submits the application form
    Then the application is saved with applied date "2026-01-15"

  @applied-date
  Scenario: Applied date defaults to today when not specified
    Given the user selects company "Acme" for a new application
    When the user submits the application form without changing the applied date
    Then the application is saved with today's applied date

  @applied-date
  Scenario: Applied date stores only the calendar date, not a time
    Given the user selects company "Acme" for a new application
    When the user sets the applied date to "2026-01-15"
    And the user submits the application form
    Then the stored applied date contains no time component

  @applied-date
  Scenario: Edit applied date after application creation
    Given a job application exists with applied date "2026-01-15"
    When the user changes the applied date to "2026-01-10"
    Then the application applied date is updated to "2026-01-10"
    And a date change event is recorded in the timeline

  # ─────────────────────────────────────────────────────────────────────────────
  # Job posting creation — add postings for existing or new companies
  # ─────────────────────────────────────────────────────────────────────────────

  @create-job-posting
  Scenario: Add a new job posting for an existing company
    Given the company "Acme" exists in the system
    When the user adds a job posting "Software Engineer" for company "Acme"
    Then the job posting "Software Engineer" appears in the postings list for "Acme"
    And the user can link the posting "Software Engineer" to a new application for "Acme"

  @create-job-posting
  Scenario: Add a new job posting for a brand new company
    Given the company "NovaTech" does not exist in the system
    When the user adds a new company named "NovaTech"
    And the user adds a job posting "UX Researcher" for company "NovaTech"
    Then the job posting "UX Researcher" appears in the postings list for "NovaTech"

  @create-job-posting
  Scenario: Add a new job posting with a URL
    Given the company "Acme" exists in the system
    When the user adds a job posting "Backend Developer" with URL "https://acme.com/jobs/backend" for company "Acme"
    Then the job posting "Backend Developer" appears in the postings list for "Acme"
    And the posting URL is stored on the job posting

  @create-job-posting
  Scenario: Job posting creation requires a non-blank title
    Given the company "Acme" exists in the system
    When the user tries to add a job posting with a blank title for company "Acme"
    Then the job posting is not created
    And the total job posting count for "Acme" does not change

  # ─────────────────────────────────────────────────────────────────────────────
  # Job posting URL — entered once on the form; saved to both the posting and
  # the application. Editable after the application record has been created.
  # ─────────────────────────────────────────────────────────────────────────────

  @posting-url
  Scenario: Posting URL entered during new-posting creation is saved on both the posting and the application
    Given the company "Acme" exists in the system
    When the user adds a job posting "Data Engineer" with URL "https://acme.com/jobs/data-engineer" for company "Acme"
    And the user creates an application linked to the posting "Data Engineer" for company "Acme"
    Then the application posting URL is "https://acme.com/jobs/data-engineer"
    And the job posting URL is "https://acme.com/jobs/data-engineer"

  @posting-url
  Scenario: Edit posting URL on an existing application
    Given a job application exists with no posting URL
    When the user sets the posting URL to "https://example.com/jobs/1"
    Then the application posting URL is "https://example.com/jobs/1"

  @posting-url
  Scenario: Replace an existing posting URL on an application
    Given a job application exists with posting URL "https://old.example.com/job"
    When the user sets the posting URL to "https://new.example.com/job"
    Then the application posting URL is "https://new.example.com/job"

  @posting-url
  Scenario: Clear the posting URL from an application
    Given a job application exists with posting URL "https://example.com/jobs/1"
    When the user clears the posting URL
    Then the application has no posting URL

