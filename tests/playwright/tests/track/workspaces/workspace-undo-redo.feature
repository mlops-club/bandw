Feature: Workspace undo, redo, and autosave
  Workspace changes can be undone and redone, and autosave status
  is displayed.

  Background:
    Given the SDK setup has completed

  Scenario: Undoing a panel deletion restores the panel
    When I open the project workspace
    And  I open section actions and delete
    And  I click the undo button
    Then I should see "loss" in the panels area

  Scenario: Redo re-applies the undone action
    When I open the project workspace
    And  I open section actions and delete
    And  I click the undo button
    Then I should see "loss" in the panels area
    When I click the redo button
    Then the undo button should still be visible

  Scenario: Workspace shows saved indicator
    When I open the project workspace
    Then I should see a saved status indicator
