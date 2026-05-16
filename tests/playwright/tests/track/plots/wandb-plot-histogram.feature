Feature: wandb.plot.histogram chart
  A run that logs a wandb.plot.histogram table should display a histogram
  on the run detail Charts tab.

  Scenario: Histogram chart loads on run detail
    Given a run named "wandb-plot-histogram" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "histogram|Gaussian|distribution"
