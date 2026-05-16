Feature: wandb.plot.pr_curve chart
  A run that logs a precision-recall curve should display the PR curve panel
  on the run detail Charts tab.

  Scenario: PR curve chart loads on run detail
    Given a run named "wandb-plot-pr-curve" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "pr|precision|recall|curve|loss"
