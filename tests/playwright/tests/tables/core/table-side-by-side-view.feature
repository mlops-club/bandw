Feature: Table side-by-side view
  Side-by-side comparison of table artifacts.

  Background:
    Given the SDK setup has completed

  Scenario: Side-by-side view activates
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    And I select side-by-side view
    Then I should see "eval_table" on the page

  Scenario: Both tables paginate
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    Then I should see pagination controls

  Scenario: Vertical layout toggle works
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    And I toggle vertical layout
    Then I should see "eval_table" on the page

  Scenario: Sort and filter apply to both tables
    When I open the fourth run artifacts tab
    And I click on the table-version-a artifact
    And I click the compare button
    And I click the "id" column header
    Then I should see table rows
