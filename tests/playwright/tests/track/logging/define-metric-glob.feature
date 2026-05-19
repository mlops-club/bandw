Feature: Define metric with glob pattern
  A glob pattern in define_metric (e.g. "train/*") applies a custom x-axis
  to all matching metrics. Non-matching metrics keep the default x-axis.

  Background:
    Given a run named "glob-pattern" exists

  Scenario: Glob pattern applies custom x-axis to matching train metrics
    When I open the run charts page
    And  I wait for chart panels to render
    And  I expand the "train" section if collapsed
    Then I should see "train/loss" on the page
    And  I should see "train/accuracy" on the page

  Scenario: Non-matching metric is still visible
    When I open the run charts page
    And  I wait for chart panels to render
    And  I expand the "val" section if collapsed
    Then I should see "val/loss" on the page
