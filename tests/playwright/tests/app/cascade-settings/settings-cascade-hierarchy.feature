Feature: Settings cascade hierarchy
  Settings cascade from workspace to section to panel level.
  Each level can override and reset to fall back to the parent.

  Background:
    Given the SDK setup has completed

  Scenario: Set workspace smoothing
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the smoothing control should be visible

  Scenario: Override section smoothing
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the smoothing control should be visible
    When I press Escape
    And I click the first section settings button
    Then I should see section-level content

  Scenario: Override individual panel smoothing
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first edit panel button
    And I click the "data" tab in the panel edit modal
    Then the smoothing control should be visible

  Scenario: Removing panel override falls back to section
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first edit panel button
    And I click the "data" tab in the panel edit modal
    Then a reset or clear button should be visible

  Scenario: Removing section override falls back to workspace
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first section settings button
    Then override or reset controls should be visible
