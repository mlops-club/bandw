Feature: Summary metric deltas
  The workspace and runs table load with data, including
  metric columns for delta comparisons.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Runs table loads with data
    When I open the project table page
    Then the first run name should be visible

  Scenario: Table has metric columns
    When I open the project table page
    Then I should see metric column headers in the table
