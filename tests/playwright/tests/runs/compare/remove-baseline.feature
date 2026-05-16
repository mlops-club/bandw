Feature: Remove baseline
  The workspace loads with chart content and run names,
  allowing the user to remove a previously set baseline run.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Run names are visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible
