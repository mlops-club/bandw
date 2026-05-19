Feature: wandb.plot.bar chart
  A run that logs a wandb.plot.bar table should display a bar chart
  on the run detail Charts tab.

  Scenario: Bar chart loads on run detail
    Given a run named "wandb-plot-bar" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "bar|chart|Animal|cat|dog"
