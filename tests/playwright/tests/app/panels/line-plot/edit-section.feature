Feature: Edit section
  Section headers should be visible in the workspace, and workspace
  controls should be available for section-level editing.

  Background:
    Given the SDK setup has completed

  Scenario: Section headers visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
