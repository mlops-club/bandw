Feature: Runs table visibility sync
  Visibility toggles in the table and workspace stay in sync.

  Background:
    Given the SDK setup has completed

  Scenario: Table shows visibility checkboxes and run names
    When I navigate to the project table page
    And  I wait for the table to load
    Then the first run name should be visible
    And  I should see a checkbox in the table

  Scenario: Workspace sidebar shows chart content
    When I open the project workspace
    Then I should see "Charts"
