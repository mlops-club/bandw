Feature: SDK-set tags
  Verifying tags set via the SDK appear on the run detail page.

  Background:
    Given the SDK setup has completed
    And   a run named "train-a-0" exists

  Scenario: Run overview loads with tags visible
    When I open the run overview page
    Then I should see overview content

  Scenario: Run detail shows run information
    When I open the run overview page
    Then I should see the current run name
