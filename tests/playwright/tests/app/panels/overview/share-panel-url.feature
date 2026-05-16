Feature: Share panel URL
  Users can copy a panel URL and navigate to it to open the panel in full-screen.

  Background:
    Given the SDK setup has completed

  Scenario: Copy panel URL from actions menu
    When I open the project workspace
    And  I wait for the workspace to load
    And  I copy the "train/loss" panel URL
    Then I should see a copied confirmation

  Scenario: Copied URL contains panel-identifying query parameters
    When I open the project workspace
    And  I wait for the workspace to load
    And  I grant clipboard permissions
    And  I copy the "train/loss" panel URL
    Then the clipboard should contain the project name
    And  the clipboard should contain a panel identifier

  Scenario: Navigate to copied URL opens full-screen panel
    When I open the project workspace
    And  I wait for the workspace to load
    And  I grant clipboard permissions
    And  I copy the "train/loss" panel URL
    And  I navigate to the copied panel URL
    Then I should see "train/loss"

  Scenario: Back navigation returns to workspace from full-screen
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the "train/loss" panel in full screen
    And  I click the back button
    Then I should see "train/acc"
    And  I should see "val/loss"
