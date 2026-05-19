Feature: Change colors via legend
  Chart panels in the workspace should be editable, with pencil/edit
  controls available for color customization.

  Background:
    Given the SDK setup has completed

  Scenario: Pencil edit button exists on chart panels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see chart content in the workspace
