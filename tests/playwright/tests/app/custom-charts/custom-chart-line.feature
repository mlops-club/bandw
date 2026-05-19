Feature: Custom chart line
  Verify custom line chart panel renders in workspace and on run detail page.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel with title exists
    When I open the custom line run detail page
    Then I should see "Custom Line" on the page

  Scenario: Line visible in chart
    When I open the custom line run detail page
    Then I should see "Custom Line" on the page
    And I should see SVG or canvas chart elements
