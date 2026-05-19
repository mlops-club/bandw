Feature: wandb.plot.roc_curve chart
  A run that logs an ROC curve should display the ROC curve panel
  on the run detail Charts tab.

  Scenario: ROC curve chart loads on run detail
    Given a run named "wandb-plot-roc-curve" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "roc|curve|loss|accuracy"
