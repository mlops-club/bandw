Feature: Log and view table
  Verify table panel visibility, column headers, data rows, sorting, and filtering.

  Background:
    Given the SDK setup has completed

  Scenario: Table panel or artifact is visible
    When I open the first run detail page
    Then I should see predictions table content

  Scenario: Column headers match SDK data
    When I open the first run detail page
    Then I should see column header "pred"
    And I should see column header "label"
    And I should see column header "score"

  Scenario: Data rows are present
    When I open the first run detail page
    Then I should see table rows

  Scenario: Table supports sorting by column
    When I open the first run detail page
    And I click the "score" column header
    Then I should see table rows

  Scenario: Table supports filtering
    When I open the first run detail page
    And I click the table filter button
    Then I should see filter UI
