Feature: wandb.plot.confusion_matrix chart
  A run that logs a confusion matrix should display the matrix panel
  on the run detail Charts tab.

  Scenario: Confusion matrix chart loads on run detail
    Given a run named "wandb-plot-confusion-matrix" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "confusion|matrix|cat|dog|bird"
