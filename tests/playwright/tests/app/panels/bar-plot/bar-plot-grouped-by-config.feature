Feature: Bar plot grouped by config
  Workspace should load with chart panels and support the panel picker
  when a project contains runs with varied config values for grouping.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Add panels button opens panel picker
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see panel type options in the picker

  Scenario: Workspace settings controls exist
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
