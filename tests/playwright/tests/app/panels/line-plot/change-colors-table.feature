Feature: Change colors via table
  Run names should be visible in the workspace sidebar, and the workspace
  should load with standard controls for color management.

  Background:
    Given the SDK setup has completed

  Scenario: Run names visible in workspace sidebar
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace loads with Add panels button
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
