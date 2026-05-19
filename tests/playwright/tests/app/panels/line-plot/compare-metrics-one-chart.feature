Feature: Compare metrics in one chart
  Multiple metric panels should be visible in the workspace, and the
  Add panels button should be available for creating combined charts.

  Background:
    Given the SDK setup has completed

  Scenario: Multiple metric panels visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Add panels button available for creating combined charts
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
