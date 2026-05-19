Feature: Runs table columns
  Default, config, and summary columns appear in the runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Default columns are present
    When I navigate to the project table page
    And  I wait for the table to load
    Then the table should show the NAME column header
    And  the table should show a State column header
    And  I should see a Created column header

  Scenario: Config columns are auto-generated
    When I navigate to the project table page
    And  I wait for the table to load
    And  I scroll to the end of the table
    Then I should see "lr"
    And  I should see "arch"
    And  I should see "batch_size"

  Scenario: Summary columns are auto-generated
    When I navigate to the project table page
    And  I wait for the table to load
    And  I scroll to the end of the table
    Then I should see "loss"
    And  I should see "accuracy"
    And  I should see "best_accuracy"
