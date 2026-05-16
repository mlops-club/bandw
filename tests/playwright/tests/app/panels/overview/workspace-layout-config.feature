Feature: Workspace layout config
  Users can configure workspace layout settings including section organization, sorting, and tooltips.

  Background:
    Given the SDK setup has completed

  Scenario: Open workspace layout settings
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    Then I should see "Workspace layout"

  Scenario: Hide empty sections during search toggle
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    And  I toggle hide empty sections
    And  I press Escape and search panels for "train/loss"
    Then I should see "train/loss"

  Scenario: Sort panels alphabetically
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    And  I toggle sort panels alphabetically
    Then I should see "train/acc"

  Scenario: Change section organization from first-prefix to last-prefix
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    And  I change section organization to "last prefix"
    Then I should see "loss"

  Scenario: Configure tooltip display preferences
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    Then I should see tooltip configuration options
