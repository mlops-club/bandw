Feature: Custom chart PR curve
  Verify precision-recall curve panel renders.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel exists
    When I open the custom pr-curve run detail page
    Then I should see PR curve content

  Scenario: Curve renders
    When I open the custom pr-curve run detail page
    Then I should see PR curve content
    And I should see SVG or canvas chart elements
