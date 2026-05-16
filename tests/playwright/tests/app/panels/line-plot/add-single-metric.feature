Feature: Add single-metric panel
  Workspace should load with chart panels visible when a project
  contains runs with logged metrics.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart panels visible
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Add panels button is available
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
