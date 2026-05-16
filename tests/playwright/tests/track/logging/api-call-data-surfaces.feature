Feature: API call data surfaces
  Data logged via specific W&B SDK API calls (config, metrics, summary)
  should appear on the correct UI surfaces (Overview tab, Charts tab).

  Background:
    Given a run named "multiple-metrics" exists

  Scenario: Summary section lists final metric values on the Overview tab
    When I open the run overview page
    And  I scroll to the bottom of the page
    Then the summary section should show "loss"
    And  the summary section should show "accuracy"
    And  the summary section should show "learning_rate"

  Scenario: Metrics render as chart panels on the Charts tab
    When I open the run charts page
    And  I wait for chart panels to render
    Then I should see "loss" on the page
    And  I should see "accuracy" on the page
    And  I should see "learning_rate" on the page
