Feature: Group runs via UI
  Grouping runs using the UI controls in the project table.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible

  Scenario: Group button exists
    When I navigate to the project table page
    And  I wait for the table to load
    Then the Group button should be visible

  Scenario: Table has checkboxes for selection
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see a checkbox in the table
