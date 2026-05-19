Feature: Baseline comparison tooltips
  The workspace should load with charts and display run names,
  enabling tooltip-based comparisons against a baseline.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Run names visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible
