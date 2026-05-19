Feature: Logs tab on run detail page
  The Logs tab should display the log viewer with visible log lines.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: Log viewer loads with visible log lines
    When I open the run logs page
    Then I should see a tab named "Logs"
    And I should see "Logs"
