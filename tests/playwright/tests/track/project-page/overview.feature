Feature: Project overview
  The project overview page displays key project metadata.

  Background:
    Given the SDK setup has completed

  Scenario: Project name is displayed on the overview page
    When I navigate to the project overview page
    Then the project name should be visible

  Scenario: Contributor count is shown
    When I navigate to the project overview page
    Then I should see a contributor indicator

  Scenario: Total runs count is shown
    When I navigate to the project overview page
    Then I should see "Total runs"
    And  I should see "5"
