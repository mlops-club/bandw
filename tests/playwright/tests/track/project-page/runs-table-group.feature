Feature: Runs table group
  Grouping controls in the runs table.

  Background:
    Given the SDK setup has completed

  Scenario: Group button opens group controls
    When I navigate to the project table page
    And  I wait for the table to load
    And  I click the Group button
    Then I should see "Group runs by"

  Scenario: Grouping controls are accessible
    When I navigate to the project table page
    And  I wait for the table to load
    And  I click the Group button
    Then I should see "Group runs by"
