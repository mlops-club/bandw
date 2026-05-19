Feature: define_metric with glob pattern
  A run that uses define_metric with a glob pattern (e.g. "train/*") should
  display charts for matching metrics on the run detail Charts tab.

  Scenario: Glob-pattern metric charts load on run detail
    Given a run named "glob-pattern" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "train|loss|accuracy"
