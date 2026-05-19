Feature: Custom chart scatter
  Verify custom scatter plot panel renders.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel exists
    When I open the custom scatter run detail page
    Then I should see "Custom Scatter" on the page

  Scenario: Scatter pattern visible
    When I open the custom scatter run detail page
    Then I should see "Custom Scatter" on the page
    And I should see SVG scatter or canvas chart elements
