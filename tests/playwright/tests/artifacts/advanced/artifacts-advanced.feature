Feature: Artifacts advanced
  Browse files and directories, custom aliases, auto-incremented versions,
  artifact deletion, and metadata verification.

  Background:
    Given the SDK setup has completed

  Scenario: Browse files and directories in artifact
    When I navigate to the dataset artifact "structured-dataset"
    And I click the "Files" artifact tab
    Then I should see "renamed_file.txt" on the page
    And I should see "images" on the page
    When I click on "images" in the file browser
    Then I should see "img_0.png" on the page

  Scenario: Verify custom aliases on artifact
    When I navigate to the model artifact "aliased-model"
    Then I should see "latest" on the page
    And I should see "best-model" on the page
    And I should see "production" on the page

  Scenario: Three auto-incremented versions listed
    When I navigate to the dataset artifact "versioned-data"
    And I click the "Version" artifact tab
    Then I should see artifact version "v0"
    And I should see artifact version "v1"
    And I should see artifact version "v2"
    When I click artifact version "v0"
    Then I should see "v0" on the page
    When I click artifact version "v2"
    Then I should see "v2" on the page

  Scenario: Delete an artifact version via UI
    When I navigate to the dataset artifact "deletable-data"
    And I click the "Version" artifact tab
    Then I should see artifact version "v0"
    And I should see artifact version "v1"
    When I click artifact version "v0"
    And I click the delete artifact button
    Then I should see a confirmation dialog
    When I confirm the deletion
    Then I should see artifact version "v1"

  Scenario: Verify metadata and description on artifact
    When I navigate to the dataset artifact "metadata-artifact"
    And I click the "Metadata" artifact tab
    Then I should see "framework" on the page
    And I should see "pytorch" on the page
    And I should see "dataset_size" on the page
    And I should see "50000" on the page
    And I should see "split" on the page
    And I should see "train" on the page
    And I should see "An artifact with rich metadata for testing." on the page
