Feature: Run state display
  Verifying run state badges in the table and on run detail pages.

  Background:
    Given the SDK setup has completed

  Scenario: Table loads and shows state badges
    When I navigate to the project table page
    And  I wait for the table to load
    Then I should see a state badge in the table

  Scenario: Run overview shows state
    Given a run named "train-a-0" exists
    When  I open the run overview page
    Then  I should see a state badge on the overview

  Scenario: Run detail shows run name
    Given a run named "train-a-0" exists
    When  I open the run overview page
    Then  I should see the current run name
