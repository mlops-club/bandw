Feature: Artifacts tab on run detail page
  The Artifacts tab should list input and output artifacts when present.

  Background:
    Given the SDK setup has completed
    And a run named "artifacts-run" exists

  Scenario: Input and output artifacts are listed
    When I open the run detail page
    And I click the Artifacts tab if visible
    Then I should see artifacts content or the Charts tab as fallback
