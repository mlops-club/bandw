Feature: Summary metrics in run overview
  Explicit and auto-generated summary metrics should appear
  in the Summary section of the run's Overview tab.

  Background:
    Given the SDK setup has completed
    And a run named "summary-explicit" exists

  Scenario: Explicit summary metrics appear in the Summary section
    When I open the run overview page
    And I scroll to the bottom of the page
    Then the summary section should show "best_accuracy" with value "0.95"
