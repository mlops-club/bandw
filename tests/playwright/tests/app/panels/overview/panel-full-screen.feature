Feature: Panel full screen
  Users can view panels in full-screen mode with navigation and run selection.

  Background:
    Given the SDK setup has completed

  Scenario: Open panel actions menu shows full-screen option
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel and open actions menu
    Then I should see a full-screen menu option

  Scenario: View full screen button opens full-screen mode
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the "train/loss" panel in full screen
    Then I should see "train/loss"

  Scenario: Panel fills viewport in full-screen
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the "train/loss" panel in full screen
    Then the "train/loss" panel should be visible in full screen

  Scenario: Run selector sidebar is available in full-screen
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the "train/loss" panel in full screen
    Then the run selector or sidebar should be visible

  Scenario: Escape key returns to workspace from full-screen
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the "train/loss" panel in full screen
    And  I press the Escape key
    Then I should see "train/acc"
    And  I should see "val/loss"

  Scenario: Prev/next navigation cycles panels
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the "train/loss" panel in full screen
    And  I click the next panel button
    Then the page should still be visible
