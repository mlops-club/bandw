Feature: Color by config key
  Workspace loads with charts and settings controls for color-by-config.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings button exists
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
