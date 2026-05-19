Feature: Artifacts section on run overview page
  The Overview tab for a run with artifacts should show artifact-related content.

  Background:
    Given the SDK setup has completed
    And a run named "artifacts-run" exists

  Scenario: Artifact outputs section shows logged artifacts
    When I open the run overview page
    And I scroll to the bottom of the page
    Then I should see "State"
