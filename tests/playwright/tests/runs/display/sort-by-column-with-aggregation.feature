Feature: Sort by column with aggregation
  Table loads with run data, Sort button accessible, and column headers present.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: Sort button is accessible
    When I navigate to the display project table page
    Then I should see the Sort button

  Scenario: Table has column headers for sorting
    When I navigate to the display project table page
    Then I should see table header text
