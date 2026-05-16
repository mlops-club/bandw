Feature: Config from argparse
  Users who pass argparse-style config dicts to wandb.init() should see
  those key-value pairs on the run's Overview tab.

  Background:
    Given a run named "config-argparse" exists

  Scenario: Argparse config values appear in the Config section
    When I open the run overview page
    Then the config section should show "lr" with value "0.001"
    And  the config section should show "epochs" with value "20"
    And  the config section should show "optimizer" with value "adam"
