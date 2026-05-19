Feature: Set baseline run
  The workspace loads with chart content, run names, and
  workspace settings controls needed to set a baseline run.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Run names visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
