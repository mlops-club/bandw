Feature: Hide metric deltas
  The workspace and runs table load with data, enabling the
  hide-metric-deltas comparison feature.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Runs table loads with data
    When I open the project table page
    Then the first run name should be visible
