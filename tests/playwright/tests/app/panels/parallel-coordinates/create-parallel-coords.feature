Feature: Create parallel coordinates panel
  Workspace should load with panels, chart content, and settings controls
  when a project contains runs with varied configs and metrics.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker is accessible
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
