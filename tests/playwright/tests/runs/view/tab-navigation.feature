Feature: Tab navigation on run detail page
  The run detail page should display core tabs (Charts, Overview, Logs, Files)
  that are clickable and switch content. A project name link provides back navigation.

  Background:
    Given the SDK setup has completed
    And a run named "basic-run" exists

  Scenario: All core tabs are present
    When I open the run detail page
    Then I should see a tab named "Charts"
    And I should see a tab named "Overview"
    And I should see a tab named "Logs"
    And I should see a tab named "Files"

  Scenario: Clicking each tab switches content
    When I open the run detail page
    And I switch to the "Charts" tab
    Then the "Charts" tab should be active
    When I switch to the "Overview" tab
    Then the "Overview" tab should be active
    When I switch to the "Logs" tab
    Then the "Logs" tab should be active
    When I switch to the "Files" tab
    Then the "Files" tab should be active

  Scenario: Run heading and back navigation
    When I open the run detail page
    Then the project name should be visible in breadcrumbs
