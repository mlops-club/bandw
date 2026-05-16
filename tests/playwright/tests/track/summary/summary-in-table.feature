Feature: Summary metrics in runs table
  Summary metrics logged by the SDK should appear as columns
  in the project's runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Summary metrics appear as columns in the runs table
    When I open the project table page
    Then the run "summary-run-2" should be visible in the table
    And the table should have a column named "best_accuracy"

  Scenario: Sort controls are available on the runs table
    When I open the project table page
    And I click the Sort button
    Then the sort controls should be visible
