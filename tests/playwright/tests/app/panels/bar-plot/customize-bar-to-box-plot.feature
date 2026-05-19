Feature: Customize bar to box plot
  Workspace should load with panels and support the panel picker
  for customizing bar charts into box plots.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads with panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace

  Scenario: Panel picker opens from Add panels
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see panel type options in the picker

  Scenario: Workspace controls are functional
    When I open the project workspace
    And I wait for the workspace to load
    Then workspace settings controls should be visible
