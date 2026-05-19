Feature: Smoothing methods
  A run with noisy metrics should display chart panels on the run detail
  Charts tab where smoothing can be applied.

  Scenario: Noisy loss chart loads on run detail
    Given a run named "smoothing" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "loss|noisy|train"
