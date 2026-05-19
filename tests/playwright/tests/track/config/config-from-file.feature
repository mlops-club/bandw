Feature: Config from file
  Users who pass a file-based config dict to wandb.init() should see
  those key-value pairs on the run's Overview tab.

  Background:
    Given a run named "config-from-file" exists

  Scenario: File-based config values appear in the Config section
    When I open the run overview page and scroll to the bottom
    Then the config section should show "model" with value "transformer"
    And  the config section should show "d_model" with value "512"
    And  the config section should contain key "n_heads"
    And  the config section should contain key "dropout"
    And  the config section should contain key "vocab_size"
