Feature: Application loads
  As a user
  I want to see the application load correctly
  So that I can use the rb9k app

  Scenario: Application title is displayed
    Given the application is running
    Then the page title should contain "rb9k-app"
