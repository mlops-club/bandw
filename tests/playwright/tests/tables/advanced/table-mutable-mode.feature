Feature: Table mutable mode
  Verify mutable table panel visibility, rows including additions,
  and newly added columns.

  Background:
    Given the SDK setup has completed

  Scenario: Table panel visible
    When I open the mutable table run detail page
    Then I should see mutable results or table content

  Scenario: All rows including additions are present
    When I open the mutable table run detail page
    Then I should see animal data

  Scenario: Newly added columns are present
    When I open the mutable table run detail page
    Then I should see latency column
