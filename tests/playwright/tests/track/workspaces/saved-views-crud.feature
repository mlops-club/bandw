Feature: Saved views CRUD
  Users can save, navigate to, update, and delete workspace views.

  Background:
    Given the SDK setup has completed

  Scenario: Save current workspace as a new view
    When I open the project workspace
    And  I open the workspace actions menu
    And  I click "Save as a new view"
    Then I should see a view name input
    When I fill the view name with "My Saved View"
    And  I click the Save button
    Then I should see "My Saved View" in the workspace navigation

  Scenario: Navigate to saved view loads correct state
    When I open the project workspace
    And  I create a saved view named "Nav Test View"
    And  I navigate to the project table page
    And  I open the project workspace
    And  I click "Nav Test View" in navigation
    Then the workspace should load with panels visible

  Scenario: Update a saved view persists changes
    When I open the project workspace
    And  I create a saved view named "Update Test View"
    And  I open the workspace actions menu
    And  I click the save menuitem
    Then I should see a save confirmation button

  Scenario: Delete a saved view removes it from navigation
    When I open the project workspace
    And  I create a saved view named "Delete Me View"
    And  I open the workspace actions menu
    And  I click "Delete view"
    And  I confirm the deletion
    Then "Delete Me View" should not be visible
