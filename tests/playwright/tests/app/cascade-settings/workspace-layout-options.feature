Feature: Workspace layout options
  Workspace layout settings control section organization,
  panel sorting, and empty section visibility.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace layout settings are visible
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on workspace layout settings
    Then the workspace layout option should be visible

  Scenario: Automated or manual mode indicator is displayed
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on workspace layout settings
    Then an automated or manual mode indicator should be visible

  Scenario: Toggle hide empty sections during search
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on workspace layout settings
    Then the hide empty sections toggle should be visible

  Scenario: Toggle sort panels alphabetically
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on workspace layout settings
    Then the sort panels alphabetically toggle should be visible

  Scenario: Change section organization by prefix
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on workspace layout settings
    Then a prefix organization option should be visible
