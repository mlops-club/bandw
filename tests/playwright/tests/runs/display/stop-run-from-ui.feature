Feature: Stop run from UI
  Table loads with run data and state badges are visible.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: State badges are visible
    When I navigate to the display project table page
    Then I should see run state badges
