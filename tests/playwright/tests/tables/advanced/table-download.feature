Feature: Table download
  Verify table visibility, export options, and file download.

  Background:
    Given the SDK setup has completed

  Scenario: Table is visible
    When I open the download table run detail page
    Then I should see download data or table content

  Scenario: Export options appear
    When I open the download table run detail page
    And I click the export or download button
    Then I should see export options

  Scenario: File downloads
    When I open the download table run detail page
    And I trigger table download
    Then the download should succeed
