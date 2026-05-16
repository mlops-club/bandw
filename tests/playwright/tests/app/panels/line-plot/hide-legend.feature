Feature: Hide legend
  Chart panels should render with legends visible in the workspace.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels render with legends visible
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace
