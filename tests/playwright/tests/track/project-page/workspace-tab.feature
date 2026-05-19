Feature: Workspace tab
  The project workspace shows charts and a runs sidebar.

  Background:
    Given the SDK setup has completed

  Scenario: Runs sidebar shows run count
    When I open the project workspace
    Then I should see "Runs"
    And  I should see "5"

  Scenario: Chart panels are visible
    When I open the project workspace
    Then I should see "loss"
    And  I should see "accuracy"

  Scenario: Run names visible in sidebar
    When I open the project workspace
    Then I should see "Runs"
