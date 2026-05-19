Feature: Grouping settings
  Workspace should show multiple runs with chart panels visible for
  groupable metrics.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace shows multiple runs
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Chart panels visible for groupable metrics
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace
