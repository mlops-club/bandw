Feature: Scatter plot example
  Workspace should display charts and provide access to panel picker
  and settings when viewing a project with logged scatter plot data.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker shows chart type options
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker

  Scenario: Workspace settings accessible
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
