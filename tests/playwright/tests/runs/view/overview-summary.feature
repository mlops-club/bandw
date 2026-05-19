Feature: Summary section on run overview page
  The Overview tab should display explicit and auto-generated summary metrics.
  A search box should filter summary entries.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: Displays explicit and auto-generated summary metrics
    When I open the run overview page
    And I scroll to the bottom of the page
    Then the summary section should show "best_accuracy" with value "0.95"
    And the summary section should show a key matching "loss"
    And the summary section should show a key matching "accuracy:"

  Scenario: Search filters summary keys
    When I open the run overview page
    And I scroll to the bottom of the page
    And I search the summary section for "best_accuracy"
    Then the summary section should show "best_accuracy" with value "0.95"
    When I clear the summary search box
    Then the summary section should show a key matching "loss"
