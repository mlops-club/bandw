Feature: Edit workspace
  The workspace page should load with charts and provide settings
  controls for workspace-level editing.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace page loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace has settings controls
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
