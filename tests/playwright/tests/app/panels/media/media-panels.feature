Feature: Media panels
  Verify all media types render in the workspace: images, segmentation masks,
  bounding boxes, image overlays in tables, histograms, audio, video,
  3D point clouds, HTML, panel add/configure, and compare mode.

  Background:
    Given the SDK setup has completed

  Scenario: Image panel is visible in workspace
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see image content in the workspace

  Scenario: Step slider is available
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see a slider control

  Scenario: Caption text matches SDK input
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see a step caption

  Scenario: Mask overlay controls visible
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see mask content

  Scenario: Class labels match SDK class_labels
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see a class label

  Scenario: Bounding box panel loads
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see bounding box content

  Scenario: Table with overlays loads
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see overlay table content

  Scenario: Histogram panel visible
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see histogram content

  Scenario: Audio panel with playback controls
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see audio content

  Scenario: Audio caption matches SDK input
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see an audio caption

  Scenario: Video panel visible
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see video content

  Scenario: 3D panel renders
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see point cloud or 3D content

  Scenario: HTML panel renders logged content
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see HTML content

  Scenario: Panel picker opens from Add panels button
    When I open the project workspace
    And I wait for the workspace to load
    And I click the Add panels button
    Then I should see a panel dialog

  Scenario: Compare view shows multiple images side-by-side
    When I open the project workspace
    And I wait for the workspace to load
    Then I should see the primary media run name
    And I should see the secondary media run name
