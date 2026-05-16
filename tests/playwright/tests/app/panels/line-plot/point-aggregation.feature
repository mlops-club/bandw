Feature: Point aggregation
  Chart panels should render data points in the workspace, with the
  Add panels button available.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels render data points
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace loads with Add panels button
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
