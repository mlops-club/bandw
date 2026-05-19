Feature: Metrics in workspace
  The project workspace should display chart panels for all logged
  metrics across runs in the project.

  Background:
    Given the SDK setup has completed

  Scenario: Chart panels exist for logged metrics in the workspace
    When I open the project workspace
    And  I wait for chart panels to render
    Then I should see "loss" on the page
    And  I should see "accuracy" on the page
    And  I should see "val_loss" on the page
