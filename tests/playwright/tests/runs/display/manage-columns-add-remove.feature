Feature: Manage columns add/remove
  Table loads and Columns button is accessible with column headers.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: Columns button is accessible
    When I navigate to the display project table page
    Then I should see the Columns button

  Scenario: Table has column headers
    When I navigate to the display project table page
    Then I should see table header text
