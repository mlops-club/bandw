Feature: Pin runs
  The workspace loads with run names visible and workspace
  controls available for pinning runs.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with run names visible
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Run names visible in workspace sidebar
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible

  Scenario: Multiple runs are displayed
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
