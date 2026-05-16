Feature: Metric naming
  Panel titles should match logged metric names exactly, with no
  mangling or transformation of names like camelCase or underscored.

  Background:
    Given a run named "metric-naming" exists

  Scenario: Panel titles match metric names without mangling
    When I open the run charts page
    And  I wait for chart panels to render
    Then I should see "accuracy" on the page
    And  I should see "val_loss" on the page
    And  I should see "modelAccuracy" on the page
