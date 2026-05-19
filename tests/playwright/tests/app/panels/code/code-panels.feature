Feature: Code panels
  Verify code file browsing, source rendering, code directory files,
  code comparer panel, and Jupyter artifact navigation.

  Background:
    Given the SDK setup has completed

  Scenario: File browser loads on run detail Files tab
    When I open the first run files tab
    Then I should see a files heading

  Scenario: Saved source files are visible
    When I open the first run files tab
    Then I should see a source file name

  Scenario: Opening a source file renders its contents
    When I open the first run files tab
    And I click on the train.py file
    Then I should see "def train" on the page

  Scenario: Files from configured code directory are present
    When I open the second run files tab
    Then I should see a source file name

  Scenario: Add code comparer panel from panel picker
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    And I click the code panel type
    Then I should see a code panel action

  Scenario: Artifacts tab is navigable for a code-logged run
    When I open the first run artifacts tab
    Then I should see artifact text
