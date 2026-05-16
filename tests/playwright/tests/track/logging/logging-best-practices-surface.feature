Feature: Logging best practices surface
  Config values should stay in the Config section on the Overview tab,
  while metrics should render as chart panels on the Charts tab.

  Background:
    Given a run named "basic-logging" exists

  Scenario: Config section is visible on the Overview tab
    When I open the run overview page
    And  I scroll to the bottom of the page
    Then I should see "Config" on the page

  Scenario: Metrics render as chart panels on the Charts tab
    When I open the run charts page
    And  I wait for chart panels to render
    Then I should see "loss" on the page
    And  I should see "accuracy" on the page
