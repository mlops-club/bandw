Feature: Search runs regex toggle
  Table loads with run data and search input is accessible for regex search.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the display project table page
    Then the first display run name should be visible

  Scenario: Search input is accessible
    When I navigate to the display project table page
    Then I should see a search input
