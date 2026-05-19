Feature: Config at init
  Users who pass a config dict to wandb.init() should see those
  key-value pairs on the run's Overview tab.

  Background:
    Given a run named "config-at-init" exists

  Scenario: Scalar config values appear in the Config section
    When I open the run overview page
    Then the config section should show "lr" with value "0.01"
    And  the config section should show "epochs" with value "10"
    And  the config section should show "arch" with value "resnet18"

  Scenario: Array config values appear in the Config section
    When I open the run overview page
    Then the config section should show "hidden_layers" with value "128"
    And  the config section should show "hidden_layers" with value "64"
