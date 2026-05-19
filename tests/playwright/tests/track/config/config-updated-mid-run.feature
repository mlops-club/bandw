Feature: Config updated mid-run
  Config values updated via run.config.update() during a run should
  reflect their final values on the run's Overview tab.

  Background:
    Given a run named "config-mid-run" exists

  Scenario: Mid-run config updates appear in the Config section
    When I open the run overview page
    Then the config section should show "lr" with value "0.001"
    And  the config section should show "batch_size" with value "32"
