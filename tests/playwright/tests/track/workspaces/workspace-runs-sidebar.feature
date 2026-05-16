Feature: Workspace runs sidebar
  The runs sidebar shows run count, visibility toggles, color pickers,
  search with regex support, run links, expand/collapse, and keyboard shortcuts.

  Background:
    Given the SDK setup has completed

  Scenario: Shows run count badge
    When I open the project workspace
    Then I should see a runs count badge

  Scenario: Run visibility toggle works
    When I open the project workspace
    Then the first run should be visible in the sidebar
    When I click the visibility toggle
    Then the visibility toggle should still be present

  Scenario: Run color picker appears
    When I open the project workspace
    And  I click a run color button
    Then I should see a color picker dialog

  Scenario: Search runs by name
    When I open the project workspace
    And  I search runs for "fast"
    Then the first run should be visible in the sidebar
    And  the second run should not be visible

  Scenario: Toggle regex search
    When I open the project workspace
    And  I enable regex search mode
    And  I search runs for "(fast|mid)"
    Then the first run should be visible in the sidebar
    And  the third run should be visible in the sidebar
    And  the second run should not be visible

  Scenario: Click run name navigates to run detail
    When I open the project workspace
    And  I click the first run link
    Then the URL should contain "/runs/"

  Scenario: Expand button opens full runs table
    When I open the project workspace
    And  I click the expand sidebar button
    Then I should see a runs table

  Scenario: Keyboard shortcut collapses and expands sidebar
    When I open the project workspace
    Then the first run should be visible in the sidebar
    When I press the sidebar toggle shortcut
    Then the first run should not be visible in the sidebar
    When I press the sidebar toggle shortcut
    Then the first run should be visible in the sidebar
