Feature: Fork run display
  Forked run overview and charts load correctly.

  Background:
    Given the SDK setup has completed

  Scenario: Run overview loads
    When I open the forked run overview page
    Then I should see overview or state content

  Scenario: Run detail shows run name
    When I open the forked run overview page
    Then the forked run name should be visible

  Scenario: Run charts tab loads
    When I open the forked run charts page
    Then I should see metric chart content
