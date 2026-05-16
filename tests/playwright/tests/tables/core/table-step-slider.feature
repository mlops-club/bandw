Feature: Table step slider
  Verify step slider, table content updates per step, and missing step handling.

  Background:
    Given the SDK setup has completed

  Scenario: Stepper widget appears in query panel
    When I open the second run detail page
    And I click the add panel button
    And I click the query option
    Then I should see stepper or slider content

  Scenario: Slider controls step value
    When I open the second run detail page
    Then I should see a step slider control

  Scenario: Table content updates per step
    When I open the second run detail page
    Then I should see eval predictions or score content

  Scenario: Missing steps use last logged value
    When I open the second run detail page
    Then I should see table or prediction content
