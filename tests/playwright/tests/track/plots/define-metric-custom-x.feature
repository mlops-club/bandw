Feature: define_metric with custom x-axis
  A run that uses define_metric to set a custom step_metric should display
  charts with the correct x-axis on the run detail Charts tab.

  Scenario: Custom x-axis charts load on run detail
    Given a run named "custom-x-axis" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "loss|accuracy|epoch|validation"
