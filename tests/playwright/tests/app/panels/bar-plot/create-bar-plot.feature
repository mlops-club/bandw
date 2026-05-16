Feature: Create bar plot
  Workspace should load and the panel picker should be accessible
  for creating new bar chart panels.

  Background:
    Given the SDK setup has completed

  Scenario: Panel picker is accessible from workspace
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see panel type options in the picker

  Scenario: Workspace has chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings are accessible
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
