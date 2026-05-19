Feature: Workspace panel sections
  The workspace organizes panels into collapsible sections grouped by
  metric prefix, with search, pagination, and grid layout.

  Background:
    Given the SDK setup has completed

  Scenario: Sections exist with collapse toggles
    When I open the project workspace
    Then I should see section collapse buttons

  Scenario: Section names match metric prefixes
    When I open the project workspace
    Then I should see a "train" section
    And  I should see a "val" section

  Scenario: Collapsing a section hides its content
    When I open the project workspace
    And  I click the first collapse section button
    Then I should see an expand section button

  Scenario: Section panel count badge visible
    When I open the project workspace
    Then I should see a panel count badge

  Scenario: Search panels filters by title
    When I open the project workspace
    And  I search panels for "accuracy"
    Then I should see "accuracy" in results

  Scenario: Pagination controls navigate panels
    When I open the project workspace
    Then I should see a section settings button

  Scenario: Panels display in grid layout
    When I open the project workspace
    Then I should see "loss" in the panels area
    And  I should see "accuracy" in the panels area

  Scenario: Pin section button exists
    When I open the project workspace
    Then I should see a pin section button
