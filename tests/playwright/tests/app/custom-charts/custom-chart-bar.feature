Feature: Custom chart bar
  Verify bar chart panel renders in workspace and on run detail page.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel exists
    When I open the custom bar run detail page
    Then I should see "Animal Counts" on the page

  Scenario: Labeled bars visible
    When I open the custom bar run detail page
    Then I should see "Animal Counts" on the page
    And I should see animal label text
