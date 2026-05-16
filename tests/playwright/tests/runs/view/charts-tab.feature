Feature: Charts tab on run detail page
  The Charts tab should display chart panels for each logged metric.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: Chart panels exist for logged metrics
    When I open the run detail page
    And I switch to the "Charts" tab
    And I expand any collapsed chart sections
    Then I should see a chart for "loss"
    And I should see a chart for "accuracy"
