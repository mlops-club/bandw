Feature: Point aggregation modes
  A high-volume run (2000 data points) should display chart panels on the
  run detail Charts tab where point aggregation is applied.

  Scenario: High-volume loss chart loads on run detail
    Given a run named "high-volume" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "loss|accuracy|train"
