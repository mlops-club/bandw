Feature: Custom chart table data
  Verify custom chart created from logged table data renders.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Custom chart panel exists
    When I open the custom table chart run detail page
    Then I should see training progress or table viz content

  Scenario: Data renders from logged table
    When I open the custom table chart run detail page
    Then I should see training progress or table viz content
    And I should see SVG or canvas chart elements
