Feature: Multiple metrics
  When multiple metrics are logged in a single run.log() call,
  each metric should get its own separate chart panel.

  Background:
    Given a run named "multiple-metrics" exists

  Scenario: Separate chart panels exist for each logged metric
    When I open the run charts page
    And  I wait for chart panels to render
    Then I should see "loss" on the page
    And  I should see "accuracy" on the page
    And  I should see "learning_rate" on the page
