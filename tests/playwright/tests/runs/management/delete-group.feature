Feature: Delete group
  Deleting a run group from the project table.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible

  Scenario: Group button is accessible
    When I navigate to the project table page
    And  I wait for the table to load
    Then the Group button should be visible
