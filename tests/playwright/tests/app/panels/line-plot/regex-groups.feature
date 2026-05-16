Feature: Regex groups
  The search panels input should be available in the workspace for
  filtering metrics by regex patterns.

  Background:
    Given the SDK setup has completed

  Scenario: Search panels input is available
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Workspace loads with Add panels button
    When I open the project workspace
    And I wait for the workspace to load
    Then the Add panels button should be visible
