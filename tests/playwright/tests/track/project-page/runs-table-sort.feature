Feature: Runs table sort
  Sorting controls in the runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Sort button opens sort controls
    When I navigate to the project table page
    And  I wait for the table to load
    And  I click the Sort button
    Then I should see "Sort"

  Scenario: Clicking column header reorders rows
    When I navigate to the project table page
    And  I wait for the table to load
    And  I scroll to the end of the table
    And  I click the "best_accuracy" column header twice
    Then the table should show the NAME column header
