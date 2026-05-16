Feature: Run comparer search
  Workspace should load with chart content, an accessible panel picker,
  and run names visible for search functionality.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with chart content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker is accessible
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see chart type options in the panel picker

  Scenario: Run names visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible
