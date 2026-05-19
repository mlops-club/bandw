Feature: Add tag on run detail
  Adding tags to a run from the run detail overview page.

  Background:
    Given the SDK setup has completed
    And   a run named "train-a-0" exists

  Scenario: Run overview loads
    When I open the run overview page
    Then I should see overview content

  Scenario: Run detail shows run name
    When I open the run overview page
    Then I should see the current run name

  Scenario: Tags section visible on overview
    When I open the run overview page
    Then I should see tags or tag content on the overview
