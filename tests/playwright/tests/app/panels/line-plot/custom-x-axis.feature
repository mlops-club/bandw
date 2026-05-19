Feature: Custom x-axis
  The custom-x run uses define_metric with a custom step_metric. Its
  Charts tab should load and display the validation_loss chart.

  Background:
    Given a run named "custom-x" exists

  Scenario: Validation_loss chart visible on run page
    When I open the run charts page
    Then the Charts tab should be visible

  Scenario: Charts tab loads for custom-x run
    When I open the run charts page
    Then the Charts tab should be visible
