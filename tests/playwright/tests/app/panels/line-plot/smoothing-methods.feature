Feature: Smoothing methods
  Workspace should render line charts with settings controls available
  for configuring smoothing methods.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace renders line charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
