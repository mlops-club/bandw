Feature: Edit individual panel
  Chart panels in the workspace should be interactive and provide
  settings controls for individual panel editing.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels are interactive in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
