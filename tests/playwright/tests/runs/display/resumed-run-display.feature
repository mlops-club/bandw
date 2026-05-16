Feature: Resumed run display
  Resumed run charts and table show correct data.

  Background:
    Given the SDK setup has completed

  Scenario: Charts tab loads with metric data
    When I open the resumed run charts page
    Then I should see metric chart content

  Scenario: Table shows run data
    When I navigate to the display project table page
    Then the resumed run name should be visible
