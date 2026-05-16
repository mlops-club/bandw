Feature: Artifacts tab
  The project's Artifacts page lists logged artifacts.

  Background:
    Given the SDK setup has completed

  Scenario: Artifact list is visible on the artifacts page
    When I navigate to the project artifacts page
    Then I should see "Artifacts"

  Scenario: Artifact type is shown via the sidebar link
    When I open the project page
    And  I click the Artifacts sidebar link
    Then I should see "Artifacts"
