Feature: Custom chart histogram
  Verify histogram panel renders in workspace and on run detail page.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel exists
    When I open the custom histogram run detail page
    Then I should see "Score Distribution" on the page

  Scenario: Histogram shape visible
    When I open the custom histogram run detail page
    Then I should see "Score Distribution" on the page
    And I should see SVG or canvas chart elements
