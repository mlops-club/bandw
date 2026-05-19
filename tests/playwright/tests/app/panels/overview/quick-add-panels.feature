Feature: Quick add panels
  Users can quickly add and remove panels using the quick-add interface.

  Background:
    Given the SDK setup has completed

  Scenario: Delete a panel removes it
    When I open the project workspace
    And  I wait for the workspace to load
    And  I delete the "train/loss" panel
    Then the Edit panel count should have decreased by 1

  Scenario: Open quick add panel list
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the "Add panels" button
    And  I click the quick add option
    Then I should see a metric name in the quick add list

  Scenario: Already-present panels show checkmarks
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the "Add panels" button
    And  I click the quick add option
    Then I should see a checked checkbox indicator

  Scenario: Bulk add all available panels
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the "Add panels" button
    And  I click the quick add option
    And  I click the bulk add button
    Then I should see "train/loss"

  Scenario: Individual add on hover works
    When I open the project workspace
    And  I wait for the workspace to load
    And  I delete the "train/loss" panel
    And  I click the "Add panels" button
    And  I click the quick add option
    And  I hover over "train/loss" and click Add
    Then I should see "train/loss"
