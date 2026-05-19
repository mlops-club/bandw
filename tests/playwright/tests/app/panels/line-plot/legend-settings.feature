Feature: Legend settings
  Chart panels should show run names as legend entries in the workspace.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels show run names as legend entries
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace
