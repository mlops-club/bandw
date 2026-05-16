Feature: Switch x-axis
  Charts should default to the Step x-axis in the workspace view.

  Background:
    Given the SDK setup has completed

  Scenario: Charts default to Step x-axis
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart or axis content in the workspace
