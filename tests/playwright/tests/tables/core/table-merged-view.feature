Feature: Table merged view
  Merged comparison of table artifacts with overlapping columns.

  Background:
    Given the SDK setup has completed

  Scenario: Table artifact is visible
    When I open the fourth run artifacts tab
    Then I should see table version or dataset content

  Scenario: Comparison view opens
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    Then I should see compare text

  Scenario: Colors distinguish versions
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    Then I should see "eval_table" on the page

  Scenario: Join key selectable from dropdown
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    And I click the join key dropdown
    Then I should see join key option "id"

  Scenario: Filter expressions work per table
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    And I click the table filter button
    Then I should see filter text
