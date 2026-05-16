Feature: Custom chart ROC curve
  Verify ROC curve panel renders.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel exists
    When I open the custom roc-curve run detail page
    Then I should see ROC curve content

  Scenario: Curve renders correctly
    When I open the custom roc-curve run detail page
    Then I should see ROC curve content
    And I should see SVG or canvas chart elements
