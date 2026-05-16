Feature: Expressions
  Chart panels should render in the workspace, with settings controls
  available for configuring metric expressions.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels render in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
