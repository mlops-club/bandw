Feature: Table compare across models
  Compare prediction tables across different model runs.

  Background:
    Given the SDK setup has completed

  Scenario: Comparison view opens
    When I navigate to the project artifacts page
    Then I should see eval predictions or artifact content

  Scenario: Filter to incorrect predictions
    When I open the second run artifacts tab
    And I click on the eval predictions artifact
    And I click the table filter button
    Then I should see filter text

  Scenario: Predictions differ between models
    When I open the third run artifacts tab
    And I click on the eval predictions artifact
    Then I should see prediction column header
