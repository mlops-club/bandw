Feature: Project lifecycle
  A project created by the SDK is navigable and has expected sidebar links.

  Background:
    Given the SDK setup has completed

  Scenario: Project exists and is navigable
    When I open the project page
    Then the project name should be visible

  Scenario: Project sidebar navigation links are present
    When I open the project page
    Then I should see a sidebar link named "Workspace"
    And  I should see a sidebar link named "Runs"
    And  I should see a sidebar link named "Reports"
    And  I should see a sidebar link named "Artifacts"

  Scenario: Project shows runs from setup
    When I navigate to the project table page
    Then the table should show the NAME column header
    And  I should see "5"
