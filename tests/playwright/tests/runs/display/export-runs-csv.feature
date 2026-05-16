Feature: Export runs CSV
  Table loads with run data and table controls are accessible.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: Table controls are accessible
    When I navigate to the display project table page
    Then I should see table control buttons
