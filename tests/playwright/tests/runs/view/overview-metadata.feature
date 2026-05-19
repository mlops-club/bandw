Feature: Metadata on run overview page
  The Overview tab should display run metadata fields including state, run ID,
  and host information.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: Displays run metadata fields
    When I open the run overview page
    Then the run state should show finished
    And the run ID should be visible on the page
    And I should see "State"
    And I should see host information
