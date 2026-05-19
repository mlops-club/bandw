Feature: Add panel manually
  Users can add panels to the workspace using the panel picker and section menus.

  Background:
    Given the SDK setup has completed

  Scenario: Panel picker opens from Add panels button
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the "Add panels" button
    Then the panel picker should be visible

  Scenario: Select line plot from panel picker
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the "Add panels" button
    And  I select the "Line plot" panel type
    Then I should see an apply or save button

  Scenario: Configure and apply adds panel globally
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the "Add panels" button
    And  I select the "Line plot" panel type
    And  I click the apply button
    Then an Edit panel button should be visible

  Scenario: Section-scoped add panels from section actions
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the first section actions menu
    And  I click the add panel menuitem
    Then the panel picker or apply button should be visible

  Scenario: Add bar chart to specific section
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the first section actions menu
    And  I click the add panel menuitem
    And  I select the "Bar chart" panel type
    And  I click the apply button
    Then an Edit panel button should be visible
