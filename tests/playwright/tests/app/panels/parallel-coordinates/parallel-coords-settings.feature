Feature: Parallel coordinates settings
  Workspace should load with chart panels and provide access to
  the panel picker and workspace settings controls.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker accessible from workspace
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
