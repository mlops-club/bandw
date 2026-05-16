Feature: Run comparer diff-only toggle
  Workspace should load with chart panels and the panel picker
  should be accessible for adding a run comparer panel.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker is accessible
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker
