Feature: Parameter importance interpretation
  Verify importance bars, correlation values, distinguishable correlations,
  output metric selection, and parameter toggling.

  Background:
    Given the SDK setup has completed

  Scenario: Panel visible
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see parameter importance text

  Scenario: Feature importance bars present
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see SVG rect elements

  Scenario: Correlation values in valid range
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see correlation values

  Scenario: Positive and negative correlations distinguishable
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see importance text

  Scenario: Output metric can be changed
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    And I click the metric selector
    Then I should see a loss metric option

  Scenario: Parameters can be toggled
    When I open the project workspace
    And I wait for the workspace to load
    And I add a parameter importance panel
    Then I should see parameter toggle controls
