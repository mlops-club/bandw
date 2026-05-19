Feature: wandb.plot.scatter chart
  A run that logs a wandb.plot.scatter table should display a scatter chart
  on the run detail Charts tab.

  Scenario: Scatter plot chart loads on run detail
    Given a run named "wandb-plot-scatter" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "scatter|plot|loss"
