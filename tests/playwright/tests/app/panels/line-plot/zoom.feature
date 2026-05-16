Feature: Zoom
  Chart panels should be visible and interactive in the workspace,
  with controls available for zoom operations.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels are visible and interactive
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace loads with Add panels button
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
