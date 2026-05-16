Feature: Files tab on run detail page
  The Files tab should show a file browser with run files.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: File browser is visible with run files
    When I open the run detail page
    And I switch to the "Files" tab
    Then I should see "Files"
