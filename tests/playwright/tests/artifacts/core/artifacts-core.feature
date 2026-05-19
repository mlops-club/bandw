Feature: Artifacts core
  Browse artifact types, view details, download files, list versions,
  and explore lineage graphs.

  Background:
    Given the SDK setup has completed

  Scenario: Browse artifact types and verify details
    When I navigate to the project artifacts page
    Then I should see a "dataset" artifact type in the sidebar
    And I should see a "model" artifact type in the sidebar
    When I click the "dataset" artifact type
    And I click the "my-dataset" artifact link
    Then I should see "my-dataset" on the page
    When I click the "Metadata" artifact tab
    Then I should see "num_samples" on the page
    When I click the "Usage" artifact tab
    Then I should see "data-producer" on the page
    When I click the "Files" artifact tab
    Then I should see "README.md" on the page

  Scenario: Download a file from the Files tab
    When I navigate to the dataset artifact "my-dataset"
    And I click the "Files" artifact tab
    Then I should see "README.md" on the page
    When I click to download "README.md"
    Then the download filename should contain "README"

  Scenario: List and navigate between versions
    When I navigate to the dataset artifact "my-dataset"
    And I click the "Version" artifact tab
    Then I should see artifact version "v0"
    And I should see artifact version "v1"
    And I should see artifact version "v2"
    When I click artifact version "v0"
    Then I should see "v0" on the page
    When I click artifact version "v2"
    Then I should see "v2" on the page

  Scenario: DAG graph renders with run and artifact nodes
    When I navigate to the model artifact "my-model"
    And I click the "Lineage" artifact tab
    Then the lineage graph should be visible
    And I should see "trainer" on the page
    And I should see "my-dataset" on the page
    And I should see "my-model" on the page

  Scenario: Interact with lineage graph nodes
    When I navigate to the model artifact "my-model"
    And I click the "Lineage" artifact tab
    And I click on "trainer" in the lineage graph
    Then I should see "trainer" on the page
    When I click on "my-dataset" in the lineage graph
    Then I should see "my-dataset" on the page

  Scenario: Clustered nodes appear with many versions
    When I navigate to the model artifact "my-model"
    And I click the "Lineage" artifact tab
    Then I should see "my-model" on the page
    And I should see a version indicator in the lineage
