Feature: Filter by tags
  Filtering runs by tags in the project table.

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

  Scenario: Multiple runs visible in table
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible
    And  the second run name should be visible
