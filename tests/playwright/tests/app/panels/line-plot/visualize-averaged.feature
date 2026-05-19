Feature: Visualize averaged runs
  Workspace should show all training runs with the Add panels button
  available for creating averaged visualizations.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace shows all training runs
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace loads with Add panels button
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
