Feature: Visualize NaN values
  The nan-run's Charts tab should load and render the nan_metric chart
  without errors, even though some data points are NaN.

  Background:
    Given a run named "nan-run" exists

  Scenario: nan_metric chart renders on run page
    When I open the run charts page
    Then the Charts tab should be visible

  Scenario: Run page loads without errors
    When I open the run charts page
    Then the Charts tab should be visible
