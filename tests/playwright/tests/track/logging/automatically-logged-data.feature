Feature: Automatically logged data
  W&B automatically logs metadata (state, runtime, host info) for every run.
  This data should be visible on the Overview tab without any explicit logging.

  Background:
    Given a run named "basic-logging" exists

  Scenario: Auto-logged metadata is visible on the Overview tab
    When I open the run overview page
    Then I should see "State" on the page
    And  I should see a tab named "Overview"
