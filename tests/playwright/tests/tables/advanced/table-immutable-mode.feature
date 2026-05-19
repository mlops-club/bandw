Feature: Table immutable mode
  Verify immutable table panel visibility, row count, and read-only state.

  Background:
    Given the SDK setup has completed

  Scenario: Table panel visible
    When I open the immutable table run detail page
    Then I should see immutable predictions or table content

  Scenario: Row count matches SDK data
    When I open the immutable table run detail page
    Then I should see table rows

  Scenario: Table is read-only
    When I open the immutable table run detail page
    Then the edit button should not be visible
