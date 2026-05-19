Feature: Workspace types
  Personal workspaces load with panels, display a badge, and allow
  the workspace name to be edited.

  Background:
    Given the SDK setup has completed

  Scenario: Personal workspace loads
    When I open the project workspace
    Then the workspace should load with panels visible

  Scenario: Personal workspace badge visible
    When I open the project workspace
    Then I should see "Personal" badge

  Scenario: Workspace name is editable
    When I open the project workspace
    And  I open the named workspace menu
    Then I should see a workspace name input
    When I fill the workspace name with "My Custom Workspace"
    Then the workspace name input should have value "My Custom Workspace"
