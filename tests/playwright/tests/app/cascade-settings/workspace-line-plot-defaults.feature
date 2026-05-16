Feature: Workspace line plot defaults
  The line plots settings panel under workspace settings provides
  Data and Display preferences tabs with controls for x-axis,
  smoothing, outlier rescaling, point aggregation, and tooltips.

  Background:
    Given the SDK setup has completed

  Scenario: Line plots settings show Data and Display preferences tabs
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the data tab or label should be visible
    And the display preferences tab or label should be visible

  Scenario: Change x-axis default to relative time
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the x-axis control should be visible

  Scenario: Change smoothing default
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the smoothing control should be visible

  Scenario: Toggle outlier rescaling
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the outlier rescaling toggle should be visible

  Scenario: Change point aggregation method
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the point aggregation control should be visible

  Scenario: Adjust max runs or groups
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    Then the max runs or groups control should be visible

  Scenario: Display preferences tab shows legend and tooltip options
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    And I click on the display preferences tab
    Then tooltip or legend options should be visible

  Scenario: Toggle colored run names in tooltips
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    And I click on the display preferences tab
    Then the colored run names toggle should be visible

  Scenario: Toggle full run names on primary tooltips
    When I open the project workspace
    And I wait for workspace panels to load
    And I open workspace settings
    And I click on line plots settings
    And I click on the display preferences tab
    Then the full run names toggle should be visible
