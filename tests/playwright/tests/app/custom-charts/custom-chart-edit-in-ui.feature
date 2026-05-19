Feature: Custom chart edit in UI
  Open edit interface, view query editor, chart field mapping,
  mapped data updates, and chart type modification.

  Background:
    Given the SDK setup has completed

  Scenario: Edit interface opens
    When I open the edit target run detail page
    And I click on the editable chart
    And I click the chart edit button
    Then I should see edit text

  Scenario: Query editor visible
    When I open the edit target run detail page
    And I click on the editable chart
    And I click the chart edit button
    Then I should see query editor content

  Scenario: Chart field mapping UI available
    When I open the edit target run detail page
    And I click on the editable chart
    And I click the chart edit button
    Then I should see field mapping controls

  Scenario: Mapped data updates chart
    When I open the edit target run detail page
    And I click on the editable chart
    And I click the chart edit button
    And I click the x-axis mapping control
    Then I should see mapping options

  Scenario: Chart type can be modified
    When I open the edit target run detail page
    And I click on the editable chart
    And I click the chart edit button
    Then I should see chart type controls
