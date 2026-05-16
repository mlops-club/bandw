Feature: Share panel embed options
  Users can access share, embed, and export options from the panel actions menu.

  Background:
    Given the SDK setup has completed

  Scenario: Open panel share or actions menu
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel and open actions menu
    Then the panel actions menu should be visible

  Scenario: Embed or social-sharing options are available
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel and open actions menu
    Then I should see a share, embed, or export menu option

  Scenario: Email-report option is available
    When I open the project workspace
    And  I wait for the workspace to load
    And  I hover over the "train/loss" panel and open actions menu
    Then I should see an email, report, or send menu option
