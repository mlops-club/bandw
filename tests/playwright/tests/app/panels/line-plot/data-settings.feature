Feature: Data settings
  Workspace should load with chart panels and provide access to
  settings controls for data configuration.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings button exists
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
