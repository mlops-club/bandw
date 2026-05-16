Feature: Config updated after finish
  Config values updated via the Public API after a run finishes should
  appear with their new values on the run's Overview tab.

  Background:
    Given a run named "config-post-finish" exists

  Scenario: Post-finish config updates appear in the Config section
    When I open the run overview page
    Then the config section should show "lr" with value "0.005"
    And  the config section should show "batch_size" with value "64"
