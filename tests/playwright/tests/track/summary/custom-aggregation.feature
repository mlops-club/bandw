Feature: Custom metric aggregation
  Runs that use define_metric with summary="min" or summary="max"
  should display the aggregated values in both the overview and runs table.

  Background:
    Given the SDK setup has completed
    And a run named "custom-aggregation" exists

  Scenario: Overview shows aggregated summary metrics
    When I open the run overview page
    And I scroll to the bottom of the page
    Then the summary section should show "loss"
    And the summary section should show "accuracy"

  Scenario: Aggregated values appear in the runs table
    When I open the project table page
    Then the run "custom-aggregation" should be visible in the table
    And the table should have a column named "loss"
    And the table should have a column named "accuracy"
