Feature: Filter operators by type
  Verifying filter operator types and metric columns in the project table.

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

  Scenario: Table has metric columns
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see metric column headers in the table
