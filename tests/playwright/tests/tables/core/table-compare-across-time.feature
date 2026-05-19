Feature: Table compare across time
  Compare table versions across time within a single run.

  Background:
    Given the SDK setup has completed

  Scenario: Multiple versions available
    When I open the second run artifacts tab
    Then I should see eval predictions or version content

  Scenario: Differences visible between versions
    When I open the second run artifacts tab
    And I click the compare button
    Then I should see compare or diff text

  Scenario: Values differ across time
    When I open the second run artifacts tab
    And I click on the eval predictions artifact
    Then I should see score column content
