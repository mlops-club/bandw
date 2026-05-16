Feature: Workspace modes
  The workspace supports automated and manual modes for panel generation.

  Background:
    Given the SDK setup has completed

  Scenario: Automated mode auto-generates panels for all logged keys
    When I open the project workspace
    And  I wait for the workspace to load
    Then I should see "train/loss"
    And  I should see "train/acc"
    And  I should see "val/loss"
    And  I should see "val/acc"

  Scenario: Panel count matches number of logged metric keys
    When I open the project workspace
    And  I wait for the workspace to load
    Then there should be exactly 4 Edit panel buttons

  Scenario: Reset workspace regenerates panels
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    And  I click the reset button and confirm
    Then I should see "train/loss"

  Scenario: Switching to manual mode clears workspace
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the Workspace settings button
    And  I switch to manual mode
    Then there should be exactly 0 Edit panel buttons
