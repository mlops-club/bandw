Feature: Config section on run overview page
  The Overview tab should display config keys and values set at init.
  A search box should filter config entries.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: Displays config keys and values
    When I open the run overview page
    And I scroll to the bottom of the page
    Then the config section should show "lr" with value "0.01"
    And the config section should show "epochs" with value "10"
    And the config section should show "arch" with value "resnet18"

  Scenario: Search filters config keys
    When I open the run overview page
    And I scroll to the bottom of the page
    And I search the config section for "lr"
    Then the config section should show "lr" with value "0.01"
    When I clear the config search box
    Then the config section should show "epochs" with value "10"
    And the config section should show "arch" with value "resnet18"
