Feature: wandb.plot.line chart
  A run that logs a wandb.plot.line table should display a line chart
  on the run detail Charts tab.

  Scenario: Line plot chart loads on run detail
    Given a run named "wandb-plot-line" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "line|Sine|plot|loss"
