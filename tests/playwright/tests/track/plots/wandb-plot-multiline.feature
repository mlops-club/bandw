Feature: wandb.plot.line_series (multiline) chart
  A run that logs a wandb.plot.line_series table should display a multi-line
  chart on the run detail Charts tab.

  Scenario: Multi-line plot chart loads on run detail
    Given a run named "wandb-plot-multiline" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "Multi|Line|sin|cos|linear|plot"
