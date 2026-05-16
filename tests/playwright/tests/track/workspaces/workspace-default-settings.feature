Feature: Workspace default settings
  Workspace settings panel exposes toggles and defaults for section
  organization, panel sorting, and line plot configuration.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace settings panel opens
    When I open the project workspace
    And  I open workspace settings
    Then I should see settings content

  Scenario: Hide empty sections toggle exists
    When I open the project workspace
    And  I open workspace settings
    Then the hide empty sections toggle should be visible

  Scenario: Sort panels alphabetically toggle exists
    When I open the project workspace
    And  I open workspace settings
    Then the sort panels alphabetically toggle should be visible

  Scenario: Line plot defaults are correct
    When I open the project workspace
    And  I open workspace settings
    Then I should see "Step" in settings
    And  I should see "10" in settings

  Scenario: Section organization default
    When I open the project workspace
    And  I open workspace settings
    Then I should see "first prefix" in settings
