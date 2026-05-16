Feature: Custom x-axis via define_metric
  When a metric is defined with a custom step_metric (e.g. epoch),
  its chart should use that metric as the x-axis instead of the default Step.

  Background:
    Given a run named "custom-x-axis" exists

  Scenario: validation_loss chart uses epoch as x-axis
    When I open the run charts page
    And  I wait for chart panels to render
    Then I should see "validation_loss" on the page
    And  I should see "epoch" on the page
