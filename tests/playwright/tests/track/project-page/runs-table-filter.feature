Feature: Runs table filter
  Filtering controls in the runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Filter button opens filter controls
    When I navigate to the project table page
    And  I wait for the table to load
    And  I click the Filter button
    Then I should see "Filter"

  Scenario: Adding a filter shows the add-filter button
    When I navigate to the project table page
    And  I wait for the table to load
    And  I click the Filter button
    And  I click the add-filter button
    Then I should see the add-filter button
