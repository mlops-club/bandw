Feature: Search runs by name
  Table loads with run data, search input is accessible, and multiple runs visible.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: Search input is accessible
    When I navigate to the display project table page
    Then I should see a search input

  Scenario: Multiple runs visible in table
    When I navigate to the display project table page
    Then the first display run name should be visible
    And the second display run name should be visible
