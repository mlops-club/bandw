Feature: Matplotlib and Plotly chart logging
  A run that logs matplotlib images and Plotly figures should display
  those panels on the run detail Charts tab.

  Scenario: Matplotlib and Plotly charts load on run detail
    Given a run named "matplotlib-plotly" exists
    When I open the run charts page
    And I wait for charts to render
    Then I should see chart content matching "chart|plot|matplotlib|plotly|loss|image"
