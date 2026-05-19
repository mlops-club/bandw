Feature: Panel-level settings
  Panel-level settings allow editing individual chart panels
  in the workspace via a modal with Data, Grouping, Chart,
  Legend, and Expressions tabs.

  Background:
    Given the SDK setup has completed

  Scenario: Edit modal opens for a panel
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first edit panel button
    Then the panel edit modal should show the "data" tab
    And the panel edit modal should show the "grouping" tab
    And the panel edit modal should show the "chart" tab
    And the panel edit modal should show the "legend" tab
    And the panel edit modal should show the "expressions" tab

  Scenario: Change data settings (Y range and smoothing)
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first edit panel button
    And I click the "data" tab in the panel edit modal
    Then the Y-axis control should be visible
    And the smoothing control should be visible

  Scenario: Apply changes to only the edited panel
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first edit panel button
    And I click the "chart" tab in the panel edit modal
    Then the panel edit modal should show the "chart" tab

  Scenario: Other panels in same section are unchanged
    When I open the project workspace
    And I wait for workspace panels to load
    Then there should be at least 2 edit panel buttons

  Scenario: Panel override wins over section and workspace
    When I open the project workspace
    And I wait for workspace panels to load
    And I click the first edit panel button
    And I click the "data" tab in the panel edit modal
    Then the smoothing control should be visible
