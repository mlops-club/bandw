Feature: Create parameter importance panel
  Add a parameter importance panel from the panel picker and verify
  config keys, importance bars, and correlation values.

  Background:
    Given the SDK setup has completed

  Scenario: Workspace loads
    When I open the project workspace
    And I wait for the workspace to load
    Then the project name should be visible

  Scenario: Panel picker opens
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see panel text

  Scenario: Parameter importance panel added
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see parameter importance text

  Scenario: Config keys listed
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see config key "lr" or "learning_rate"
    And I should see "batch_size" on the page
    And I should see "dropout" on the page

  Scenario: Importance bars render
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see SVG chart elements

  Scenario: Correlation values displayed
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see correlation or importance text
