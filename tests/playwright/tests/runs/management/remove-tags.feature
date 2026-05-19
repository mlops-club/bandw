Feature: Remove tags
  Removing tags from runs via the table and run detail pages.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads with run data
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible

  Scenario: Run overview loads with tags
    Given a run named "train-a-0" exists
    When  I open the run overview page
    Then  I should see tags or tag content on the overview
