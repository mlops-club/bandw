Feature: Parallel coordinates filter interaction
  Workspace should load and provide chart content and controls
  for filter interaction with parallel coordinates panels.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads for filter interaction
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker has chart options
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker

  Scenario: Workspace controls are accessible
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
