Feature: Delete runs
  Table loads with run data, checkboxes, and multiple runs for deletion.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: Table has checkboxes for run selection
    When I navigate to the display project table page
    Then I should see run selection checkboxes

  Scenario: Multiple runs are displayed
    When I navigate to the display project table page
    Then the first display run name should be visible
    And the second display run name should be visible
