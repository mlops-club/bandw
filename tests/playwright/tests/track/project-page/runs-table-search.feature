Feature: Runs table search
  Search box filters runs by name in the runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Typing filters runs by name
    When I navigate to the project table page
    And  I wait for the table to load
    And  I search for "train" in the runs search box
    Then I should see "train"

  Scenario: Clearing search shows all runs
    When I navigate to the project table page
    And  I wait for the table to load
    And  I search for "eval" in the runs search box
    And  I clear the runs search box
    Then the first run name should be visible
