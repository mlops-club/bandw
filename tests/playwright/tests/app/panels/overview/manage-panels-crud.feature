Feature: Manage panels CRUD
  Users can edit, duplicate, reorder, move, and delete panels in the workspace.

  Background:
    Given the SDK setup has completed

  Scenario: Open panel settings edit modal
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel and click Edit panel
    Then the panel settings dialog should be visible

  Scenario: Change panel type
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel and click Edit panel
    And  I change the panel type to "Bar chart"
    And  I click the apply button
    Then I should see "train/loss"

  Scenario: Duplicate panel
    When I open the project workspace
    And  I wait for the workspace to load
    And  I duplicate the "train/loss" panel
    Then the Edit panel count should have increased by 1

  Scenario: Reorder panel via drag handle visibility
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel
    Then the drag panel handle should be visible

  Scenario: Move panel to another section
    When I open the project workspace
    And  I wait for the workspace to load
    And  I move the "train/loss" panel to the "val" section
    Then I should see "train/loss"

  Scenario: Delete panel
    When I open the project workspace
    And  I wait for the workspace to load
    And  I delete the "train/loss" panel
    Then the Edit panel count should have decreased by 1
