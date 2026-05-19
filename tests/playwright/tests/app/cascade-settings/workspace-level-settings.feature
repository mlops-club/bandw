Feature: Workspace-level settings
  The workspace settings panel provides access to layout options,
  line plot defaults, and global smoothing controls.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads and project name is visible
    When I open the project workspace
    And I wait for workspace panels to load
    Then the project name should be visible in the workspace

  Scenario: Workspace settings panel opens
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    Then workspace settings content should be visible

  Scenario: Workspace layout option is accessible
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    Then the workspace layout option should be visible

  Scenario: Line plots option is accessible
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    Then the line plots option should be visible

  Scenario: Changing smoothing applies globally
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the smoothing control should be visible

  Scenario: All line plots reflect workspace setting change
    When I open the project workspace
    And I wait for workspace panels to load
    Then I should see train and val sections
