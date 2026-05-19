Feature: Manage sections
  Users can add, rename, resize, collapse, expand, and delete workspace sections.

  Background:
    Given the SDK setup has completed

  Scenario: Add section after last section
    When I open the project workspace
    And  I wait for the workspace to load
    And  I scroll to the bottom of the page
    And  I click the "Add section" button
    Then the last Section actions button should be visible

  Scenario: New section above via section menu
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the first section actions menu
    And  I click the "New section above" menuitem
    Then the section count should have increased by 1

  Scenario: Rename section via section menu
    When I open the project workspace
    And  I wait for the workspace to load
    And  I open the first section actions menu
    And  I click the rename menuitem
    And  I rename the section to "My Custom Section"
    Then I should see "My Custom Section"

  Scenario: Resize panel in section shows controls
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the first Section settings button
    Then I should see panel size or column controls

  Scenario: Set panels per page via pagination
    When I open the project workspace
    And  I wait for the workspace to load
    And  I click the first Section settings button
    Then I should see pagination or panels per page controls

  Scenario: Collapse section hides content
    When I open the project workspace
    And  I wait for the workspace to load
    And  I collapse the first section
    Then the expand button should be visible

  Scenario: Expand section restores content
    When I open the project workspace
    And  I wait for the workspace to load
    And  I collapse the first section
    And  I expand the first section
    Then I should see metric panel content

  Scenario: Delete section removes it and all panels
    When I open the project workspace
    And  I wait for the workspace to load
    And  I delete the first section
    Then the section count should have decreased by 1
