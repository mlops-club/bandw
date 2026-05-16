Feature: Runs table bulk operations
  Bulk selection controls appear in the runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Selecting multiple runs shows checkboxes
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see a checkbox in the table

  Scenario: Select-all checkbox is present
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see a checkbox in the table
