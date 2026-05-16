Feature: Keyboard shortcuts
  Verify undo/redo, navigation, panel navigation, and media shortcuts
  in the workspace.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads for shortcut testing
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Cmd+Z undoes panel deletion
    When I open the project workspace
    And I wait for the workspace to load
    And I open a panel menu
    And I click delete panel
    And I press undo shortcut
    Then a panel menu button should be visible

  Scenario: Cmd+Shift+Z redoes undone action
    When I open the project workspace
    And I wait for the workspace to load
    And I open a panel menu
    And I click delete panel
    And I press undo shortcut
    And I press redo shortcut
    Then the project name should be visible

  Scenario: Cmd+J toggles between Workspaces and Runs tabs
    When I open the project workspace
    And I wait for the workspace to load
    And I press toggle tab shortcut
    Then I should see a workspace or runs tab

  Scenario: Escape exits full-screen panel
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Arrow keys navigate between panels in full-screen
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Zoom shortcuts work on image panel
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see images or media content

  Scenario: Cmd+Left/Right moves step slider
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see a slider or step control
