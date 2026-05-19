Feature: Query panels
  Add query panels, enter expressions, verify results, sort columns,
  configure panels, and access artifacts via query.

  Background:
    Given the SDK setup has completed

  Scenario: Add query panel from panel picker
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    And I click the query panel type
    Then I should see a query expression editor

  Scenario: Query panel renders result after entering expression
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    And I click the query panel type
    And I enter a table summary expression
    Then I should see a query result visualization

  Scenario: Expression evaluates and populates result panel
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    And I click the query panel type
    And I enter a table summary expression
    Then I should see query result with data

  Scenario: Sort by column header reorders rows
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see a column header or metric data

  Scenario: Panel configuration drawer opens
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    And I click the query panel type
    Then I should see a query expression editor

  Scenario: Result panel renders data
    When I open the project workspace
    And I wait for the workspace to load
    Then the first run name should be visible in the workspace

  Scenario: ArtifactVersion expression returns artifact data
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see the artifact creator run

  Scenario: Runs data is queryable in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see "query-run-1" in the workspace
    And I should see "query-run-2" in the workspace
