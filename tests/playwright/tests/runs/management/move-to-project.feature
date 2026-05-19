Feature: Move to project
  Moving runs to another project from the project table.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible

  Scenario: Table has checkboxes for selection
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see a checkbox in the table
