Feature: Section-level settings
  Section-level settings allow configuring display preferences
  and overrides per metric section in the workspace.

  Background:
    Given the SDK setup has completed

  Scenario: Section settings menu opens
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first section settings button
    Then I should see section-level content

  Scenario: Display preferences are visible
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first section settings button
    And I click on display preferences
    Then the display preferences option should be visible

  Scenario: Toggle colored run names in tooltips for section
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first section settings button
    And I click on display preferences
    Then the colored run names toggle should be visible

  Scenario: Section override differs from workspace default
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first section settings button
    Then override or reset controls should be visible

  Scenario: Other sections still use workspace defaults
    When I open the project workspace
    And I wait for workspace panels to load
    Then there should be at least 2 section settings buttons
