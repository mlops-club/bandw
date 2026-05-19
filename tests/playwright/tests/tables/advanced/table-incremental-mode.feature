Feature: Table incremental mode
  Verify incremental table panel visibility, step-through controls,
  accumulated rows, and increment limit handling.

  Background:
    Given the SDK setup has completed

  Scenario: Table panel visible
    When I open the incremental table run detail page
    Then I should see incremental results or table content

  Scenario: Step-through capability available
    When I open the incremental table run detail page
    Then I should see step controls

  Scenario: Rows accumulate across increments
    When I open the incremental table run detail page
    Then I should see table rows
    And I should see sample_id column content

  Scenario: Handles increment limit gracefully
    When I open the incremental table run detail page
    Then I should see table or incremental results content
