Feature: Rewind run display
  Rewind (forked) run overview loads correctly.

  Background:
    Given the SDK setup has completed

  Scenario: Run overview loads
    When I open the forked run overview page
    Then I should see overview or state content

  Scenario: Run name is shown on detail page
    When I open the forked run overview page
    Then the forked run name should be visible
