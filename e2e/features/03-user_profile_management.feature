Feature: User Profile Management
  This feature describes how the user manages profile information using natural language steps.
  It covers creating and updating profile details, validations, visibility, completeness, and media management.

Background:
  Given the user is signed in

@create @validation
Scenario: Create initial profile with basic information
  Given the user has no existing profile
  And the user is on the registration page
  When the user submits basic information:
    | email                | password     | first name | last name | phone           | location          |
    | jane.doe@example.com | StrongPass!8 | Jane       | Doe       | +1 415 555 0100 | San Francisco, CA |
  Then a "Profile created" confirmation is shown
  And required fields are saved

@validation
Scenario: Reject duplicate email during creation
  Given an existing account uses email "john.smith@example.com"
  And the user is on the registration page
  When the user enters email "john.smith@example.com"
  Then the user sees "Email is already in use" and cannot proceed

@validation
Scenario: Reject invalid email format during creation
  Given the user is on the registration page
  When the user enters email "john..smith@bad"
  Then the user sees "Enter a valid email address"

@create
Scenario: Add extended profile information
  Given the user has a basic profile
  And the user is on the profile page
  When the user adds:
    | address       | city      | state | country | postal code | LinkedIn URL                      | portfolio URL       | professional summary                   |
    | 123 Market St | San Mateo | CA    | USA     | 94401       | https://www.linkedin.com/in/janed | https://janedoe.dev | Product manager with 8+ years in SaaS |
  Then the extended details are saved and visible on the profile

@edit
Scenario: Edit profile fields
  Given the user has a profile with last name "Doe" and location "San Francisco, CA"
  And the user is on the profile page
  When the user changes last name to "Dane" and location to "Oakland, CA"
  Then the last name shows "Dane"
  And the location shows "Oakland, CA"

@validation @edit
Scenario: Update password successfully
  Given the user is on the profile page
  And the user opens change password
  When the user enters current password "StrongPass!8", new password "NewStrong#12", and confirms "NewStrong#12"
  Then the password is updated successfully

@validation
Scenario: Reject password update with too-short new password
  Given the user is on the profile page
  And the user opens change password
  When the user enters a new password "short"
  Then the user sees "Password must be at least 8 characters"

@validation
Scenario: Reject password update with mismatched confirmation
  Given the user is on the profile page
  And the user opens change password
  When the user enters new password "NewStrong#12" with confirmation "Different#99"
  Then the user sees "Passwords do not match"

@edit
Scenario: Add or update contact details
  Given the user has a profile
  And the user is on the profile page
  When the user updates phone to "+44 20 7946 0958"
  Then the contact details show phone "+44 20 7946 0958"

@validation @edit
Scenario: Save valid social and professional links
  Given the user has a profile
  And the user is on the profile page
  And the user opens links
  When the user adds LinkedIn "https://www.linkedin.com/in/janed" and portfolio "https://janedoe.dev"
  Then both links are saved and clickable

@validation
Scenario: Reject social link without https
  Given the user has a profile
  And the user is on the profile page
  And the user opens links
  When the user enters a URL without https
  Then the user sees "Enter a valid URL (https)"

@edit
Scenario: Write professional summary
  Given the user has a profile with no summary
  And the user is on the profile page
  When the user writes "Human-centered designer with fintech experience."
  Then the summary "Human-centered designer with fintech experience." is saved and visible on the profile

@edit
Scenario: Edit existing professional summary
  Given the user has a profile with summary "Human-centered designer with fintech experience."
  And the user is on the profile page
  When the user changes the summary to "Senior designer specializing in fintech and enterprise UX."
  Then the updated summary "Senior designer specializing in fintech and enterprise UX." is visible on the profile

@view
Scenario: View complete profile
  Given the user has a complete profile
  And the user is on the profile page
  When the user views their profile
  Then the following sections are displayed:
    | section              |
    | Basic Information    |
    | Contact Details      |
    | Address              |
    | Professional Summary |
    | Social Links         |
    | Profile Photo        |
    | Privacy Settings     |

@completeness
Scenario Outline: Profile completeness indicator
  Given the profile has <filled> of <total> tracked fields filled
  And the user is on the profile page
  When the user views completeness
  Then the indicator shows <percent>%
  Examples:
    | filled | total | percent |
    | 6      | 12    | 50      |
    | 12     | 12    | 100     |

@privacy
Scenario: Configure privacy for profile sections
  Given the user is on the profile page
  And the user opens privacy settings
  When the user sets contact details to "Only me" and summary to "Connections"
  Then the privacy settings are saved

@privacy
Scenario: Verify privacy enforcement from another user perspective
  Given user "jane.doe@example.com" has set contact details to "Only me" and summary to "Connections"
  And a second signed-in user is viewing the "jane.doe@example.com" profile
  Then the second user cannot see the contact details
  And the second user can see the summary

@edit
Scenario: Upload profile photo
  Given the user has a profile
  And the user is on the profile page
  And the user opens photo settings
  When the user uploads "headshot.jpg" under 5MB
  Then "headshot.jpg" is displayed as the profile picture

@edit
Scenario: Replace profile photo
  Given the user has a profile with photo "headshot.jpg"
  And the user is on the profile page
  And the user opens photo settings
  When the user replaces the photo with "new_headshot.png"
  Then "new_headshot.png" is displayed as the profile picture

@edit
Scenario: Remove profile photo
  Given the user has a profile with photo "headshot.jpg"
  And the user is on the profile page
  And the user opens photo settings
  When the user removes their profile photo
  Then the default avatar is displayed as the profile picture

@validation
Scenario: Required email field blocks profile creation
  Given the user is on the registration page
  When the user submits the form with email left empty
  Then the user sees "Email is required" and cannot continue

@validation
Scenario: Required password field blocks profile creation
  Given the user is on the registration page
  When the user submits the form with password left empty
  Then the user sees "Password is required" and cannot continue

@validation
Scenario: Optional fields do not block profile creation
  Given the user is on the registration page
  When the user fills only the required fields
  Then the profile is created successfully
