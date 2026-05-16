Feature: Project notes
  The overview page shows project details and a description area.

  Background:
    Given the SDK setup has completed

  Scenario: Overview page has a description area
    When I navigate to the project overview page
    Then the project name should be visible
    And  I should see a details or summary indicator

  Scenario: Edit button opens edit interface
    When I navigate to the project overview page
    Then the project name should be visible
