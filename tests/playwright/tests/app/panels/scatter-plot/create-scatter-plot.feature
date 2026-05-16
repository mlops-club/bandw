Feature: Create scatter plot
  Workspace should load with panels, chart content, and settings controls
  when a project contains runs with logged metrics.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads and panel picker is accessible
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker

  Scenario: Workspace has chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
