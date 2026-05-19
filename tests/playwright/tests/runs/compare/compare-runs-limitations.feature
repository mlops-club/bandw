Feature: Compare runs limitations
  The workspace loads with charts and the Add panels button
  opens the panel picker, demonstrating workspace limitations.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with charts
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Add panels button opens panel picker
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker
