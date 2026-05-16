Feature: Workspace filter, group, sort, and columns
  The workspace sidebar toolbar provides filter, group, sort, and
  column picker controls that modify run visibility and ordering.

  Background:
    Given the SDK setup has completed

  Scenario: Filter button opens expression builder
    When I open the project workspace
    And  I click the Filter button
    Then I should see an add filter button

  Scenario: Adding a filter narrows visible runs
    When I open the project workspace
    Then all three runs should be visible
    When I click the Filter button
    And  I click the add filter button
    Then I should see filter UI

  Scenario: Group button opens column picker
    When I open the project workspace
    And  I click the Group button
    Then I should see group UI

  Scenario: Selecting a config column groups runs
    When I open the project workspace
    And  I click the Group button
    And  I select "arch" in the group picker
    Then I should see "resnet50" group
    And  I should see "resnet18" group

  Scenario: Sort button opens sort config
    When I open the project workspace
    And  I click the Sort button
    Then I should see sort UI

  Scenario: Sorting by loss changes run order
    When I open the project workspace
    And  I click the Sort button
    And  I select "loss" in the sort picker
    Then the first run should still be visible

  Scenario: Columns button opens column picker
    When I open the project workspace
    And  I click the Columns button
    Then I should see column picker UI
