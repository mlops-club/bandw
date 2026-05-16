Feature: Remove filter
  Removing an applied filter from the project table.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible

  Scenario: Filter button is accessible
    When I navigate to the project table page
    And  I wait for the table to load
    Then the Filter button should be visible
