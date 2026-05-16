Feature: Reports tab
  The project reports page lists reports or shows an empty state.

  Background:
    Given the SDK setup has completed

  Scenario: Reports list or empty state is visible
    When I navigate to the project report list page
    Then I should see a report indicator

  Scenario: Create report button is accessible
    When I navigate to the project report list page
    Then I should see the create report button
