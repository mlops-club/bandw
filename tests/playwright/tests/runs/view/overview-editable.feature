Feature: Editable fields on run overview page
  The Overview tab should display a notes section and tags that can be managed.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: Notes field is visible
    When I open the run overview page
    Then I should see the notes section

  Scenario: Tags are visible and can be managed
    When I open the run overview page
    Then I should see tag "test-tag-1"
    And I should see tag "test-tag-2"
    And I should see the add tag button
