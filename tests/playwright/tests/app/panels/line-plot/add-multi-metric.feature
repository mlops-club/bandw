Feature: Add multi-metric panels
  Workspace should display multiple metric panels for a project with
  several training runs logging train/loss, train/acc, val/loss, val/acc.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace shows multiple metric panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Add panels button exists
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
