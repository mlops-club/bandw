Feature: Add tags from project table
  Adding tags to runs via the project table view.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with runs
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible

  Scenario: Table has checkboxes for run selection
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see a checkbox in the table

  Scenario: Multiple runs visible
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible
    And  the second run name should be visible
