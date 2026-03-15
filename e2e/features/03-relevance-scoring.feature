@relevance-scoring @future-feature
Feature: Relevance Scoring for Career History
  As a job seeker
  I want to score my career responsibilities and achievements against a job posting
  So that I can quickly identify the most relevant experience to highlight

  Background:
    Given the user is signed in
    And the user is on the career history page
    And the following career entries exist:
      | employer     | job title    | start date | end date   |
      | Acme Corp    | Data Analyst | 2019-06-01 | 2021-08-31 |
      | CloudWorks   | Lead Analyst | 2022-01-01 | 2024-06-30 |
    And the career entry for "Acme Corp" has the following tagged responsibilities:
      | responsibility                                     | tags                                  |
      | Built SQL dashboards for stakeholder communication | sql, dashboarding, communication      |
      | Automated data quality checks with Python          | python, automation, data-quality      |
      | Presented findings to C-suite quarterly            | communication, leadership, presenting |
    And the career entry for "Acme Corp" has the following tagged achievements:
      | achievement                              | impact metric      | tags                        |
      | Reduced reporting time by 40%            | 40% faster reports | automation, efficiency      |
      | Increased forecast accuracy by 12 points | +12 pp accuracy    | sql, modelling, forecasting |

  @tag-weighting
  Scenario: Scoring responsibilities and achievements against a set of weighted tags
    Given the user has defined the following tag weights for a job posting:
      | tag           | weight |
      | sql           | 10     |
      | dashboarding  | 8      |
      | communication | 6      |
      | automation    | 5      |
      | python        | 4      |
    When the user runs relevance scoring against the tag weights
    Then each responsibility receives a score proportional to how its tags match the weights
    And each achievement receives a score proportional to how its tags match the weights
    And the scores are normalised to a 0–100 range

  @top-n
  Scenario: Highlighting the top N scoring items
    Given the user has defined the following tag weights for a job posting:
      | tag           | weight |
      | sql           | 10     |
      | dashboarding  | 8      |
      | communication | 6      |
    When the user runs relevance scoring against the tag weights
    Then the top 2 responsibilities are highlighted
    And the top 2 achievements are highlighted
    And highlighted items are ordered by score descending

  @no-tags
  Scenario: Skipping items with no matching tags
    Given the user has defined the following tag weights for a job posting:
      | tag    | weight |
      | nodejs | 10     |
      | react  | 8      |
    When the user runs relevance scoring against the tag weights
    Then all responsibilities and achievements receive a score of 0
    And no items are highlighted

  @score-persistence
  Scenario: Scores persist after navigating away and returning
    Given the user has defined the following tag weights for a job posting:
      | tag           | weight |
      | sql           | 10     |
      | dashboarding  | 8      |
    When the user runs relevance scoring against the tag weights
    And the user navigates away from the career history page
    And the user returns to the career history page
    Then the previously computed scores are still displayed
    And the previously highlighted items remain highlighted
