Feature: Reports core
  Create reports from workspace and reports tab, add content blocks,
  run sets, and verify API-created reports.

  Background:
    Given the SDK setup has completed

  Scenario: Create report from workspace charts
    When I open the project workspace
    And I wait for the workspace to load
    And I click the create report button
    Then I should see a dialog
    When I toggle filter run sets
    And I click the create report confirm button
    Then I should see report content

  Scenario: Create report from Reports tab
    When I navigate to the project report list page
    And I click the create report button on reports page
    Then I should see a report editor

  Scenario: API-created report loads in UI
    When I navigate to the project report list page
    Then I should see a report link

  Scenario: Add line plot via slash command
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    Then I should see a line plot option
    When I click the line plot option
    Then I should see a panel element

  Scenario: Add panel grid with project run sets
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    And I click the panel grid option
    Then I should see a run name in the report

  Scenario: Freeze a run set in a report
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    And I click the panel grid option
    And I click the freeze button
    Then I should see a frozen indicator

  Scenario: Add a Python code block via slash command
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    And I click the code option
    And I click the Python language option
    And I type code content
    Then I should see "import" on the page

  Scenario: Add markdown block with formatting
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    And I click the markdown option
    And I type markdown content
    Then I should see "bold text" on the page
    And I should see "italic text" on the page

  Scenario: Add heading and paragraph via slash command
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    And I click the heading 2 option
    And I type "Results Section"
    Then I should see a heading named "Results Section"
    When I press Enter and type paragraph text
    Then I should see "This section contains our findings." on the page
