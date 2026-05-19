Feature: Change baseline run
  The workspace should display multiple run names, allowing
  the user to change which run is used as the comparison baseline.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with run names
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Run names are displayed
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible
    And the second run name should be visible
