Feature: Reports advanced
  Share reports, edit drafts, add comments, star/unstar,
  cross-project reports, view-only links, clone, export, and send panels.

  Background:
    Given the SDK setup has completed

  Scenario: Open share modal and verify sharing options
    When I navigate to the project report list page
    And I click the first report link
    And I click the share button
    Then I should see a dialog
    And I should see an invite input field
    And I should see permission options
    And I should see a shareable link control

  Scenario: Edit report and save draft
    When I navigate to the project report list page
    And I click the first report link
    And I click the edit button
    And I type draft content
    Then I should see "Draft edit test content" on the page
    When I click save to report
    Then I should see "Draft edit test content" on the page

  Scenario: Add report-level comments
    When I navigate to the project report list page
    And I click the first report link
    And I click the comment button
    And I fill in the comment text
    And I submit the comment
    Then I should see "This is a report-level comment" on the page

  Scenario: Star and unstar a report
    When I navigate to the project report list page
    And I click the star button
    Then I should see a starred indicator
    When I click the unstar button

  Scenario: Add run sets from multiple projects
    When I navigate to the project report list page
    And I click the create report button on reports page
    And I type a slash command
    And I click the panel grid option
    Then I should see a run name in the advanced report

  Scenario: Generate and access view-only link
    When I navigate to the project report list page
    And I click the first report link
    And I click the share button
    Then I should see a dialog
    And I should see a shareable link control

  Scenario: Clone a report via actions menu
    When I navigate to the project report list page
    And I click the first report link
    And I click the report actions menu
    And I click the clone option
    Then I should see a dialog
    When I click the clone confirm button
    Then I should see clone confirmation

  Scenario: Export report as PDF
    When I navigate to the project report list page
    And I click the first report link
    And I click the report actions menu
    And I click the download option
    Then I should see PDF option
    When I click PDF and download
    Then the downloaded file should be a PDF

  Scenario: Send workspace panel to a report
    When I open the project workspace
    And I wait for the workspace to load
    And I click the first panel actions menu
    And I click add to report
    Then I should see a report selector
