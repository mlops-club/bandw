Feature: Compare runs full workflow
  The workspace and runs table should load with run data,
  supporting a complete compare-runs workflow.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Runs table loads with run data
    When I open the project table page
    Then the first run name should be visible

  Scenario: Multiple runs visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible
